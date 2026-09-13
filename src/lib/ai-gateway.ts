/**
 * Centralized Lovable AI Gateway client with Private API Fallbacks.
 *
 * This version supports fallback to external API keys (Gemini/OpenAI) if the 
 * primary Lovable gateway key reaches its limit or fails.
 *
 * NOTE: this module never reads process.env at import time; the caller passes
 * the key from inside a server function handler.
 */

export type GatewayPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type GatewayMessage = {
  role: "system" | "user" | "assistant";
  content: string | GatewayPart[];
};

export type AiErrorCode =
  | "no_key"
  | "rate_limit"
  | "payment_required"
  | "timeout"
  | "unavailable"
  | "empty";

export type AiResult =
  | { ok: true; content: string; model: string }
  | { ok: false; code: AiErrorCode; detail: string };

/** Friendly Arabic copy per structured error code — used by every AI feature. */
export const AI_ERROR_AR: Record<AiErrorCode, string> = {
  no_key: "خدمة الذكاء الاصطناعي غير مفعّلة حاليًا.",
  rate_limit: "الخدمة مزدحمة الآن. يرجى المحاولة بعد لحظات.",
  payment_required: "تم بلوغ الحد المتاح من الاستخدام مؤقتًا. يرجى المحاولة لاحقًا.",
  timeout: "استغرق إنشاء المحتوى وقتًا أطول من المتوقع. يرجى المحاولة مرة أخرى.",
  unavailable: "تعذر إنشاء المحتوى حاليًا. يرجى المحاولة مرة أخرى.",
  empty: "لم نتمكن من إنشاء محتوى مناسب. حاول توضيح اسم الدرس ثم أعد المحاولة.",
};

/** Free, vision-capable Gemini chain. Ordered fastest → most capable. */
export const DEFAULT_MODELS = [
  "google/gemini-2.0-flash",
  "google/gemini-2.0-flash-lite-preview-02-05",
  "google/gemini-1.5-flash",
  "google/gemini-1.5-pro",
] as const;

const LOVABLE_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Transient statuses worth retrying on the same model (proxy 407 included). */
const RETRYABLE = new Set([407, 408, 409, 425, 429, 500, 502, 503, 504, 520, 522, 524]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function codeForStatus(status: number): AiErrorCode {
  if (status === 429) return "rate_limit";
  if (status === 402) return "payment_required";
  return "unavailable";
}

/**
 * Main gateway caller. Logic flow:
 * 1. Attempt using Lovable Gateway.
 * 2. If it fails with rate limit or payment, check for secondary Private Keys.
 */
export async function callAiGateway(
  apiKey: string | undefined,
  opts: {
    messages: GatewayMessage[];
    models?: readonly string[];
    json?: boolean;
    timeoutMs?: number;
    attempts?: number;
    label?: string;
    // Secondary Private Keys passed from env in server actions
    privateGeminiKey?: string;
    privateOpenAiKey?: string;
  },
): Promise<AiResult> {
  // 1. Validate Initial Key
  if (!apiKey && !opts.privateGeminiKey && !opts.privateOpenAiKey) {
    return { ok: false, code: "no_key", detail: "No API keys provided" };
  }

  const models = opts.models ?? DEFAULT_MODELS;
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const attempts = opts.attempts ?? 2;
  const label = opts.label ?? "ai";

  let lastCode: AiErrorCode = "unavailable";
  let lastDetail = "";

  // Primary attempt via Lovable Gateway
  if (apiKey) {
    for (const model of models) {
      for (let attempt = 1; attempt <= attempts; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(LOVABLE_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            signal: controller.signal,
            body: JSON.stringify({
              model,
              messages: opts.messages,
              ...(opts.json ? { response_format: { type: "json_object" } } : {}),
            }),
          });

          if (!res.ok) {
            const body = (await res.text().catch(() => "")).slice(0, 500);
            lastCode = codeForStatus(res.status);
            lastDetail = `${model} (Lovable) → HTTP ${res.status} ${body}`;
            console.error(`[${label}] gateway error`, lastDetail);
            
            if (res.status === 402 || res.status === 429) {
              // Break to try Private Key if available
              break;
            }

            if (RETRYABLE.has(res.status) && attempt < attempts) {
              await sleep(400 * 2 ** (attempt - 1));
              continue;
            }
            break; 
          }

          const json = (await res.json()) as any;
          const content = json.choices?.[0]?.message?.content?.trim();
          if (content) return { ok: true, content, model: `${model} (lovable)` };
          
          lastCode = "empty";
          lastDetail = `${model} → empty completion`;
          break;
        } catch (e) {
          const aborted = (e as Error)?.name === "AbortError";
          lastCode = aborted ? "timeout" : "unavailable";
          lastDetail = `${model} → ${(e as Error).message}`;
          if (attempt < attempts) {
            await sleep(400 * 2 ** (attempt - 1));
            continue;
          }
        } finally {
          clearTimeout(timer);
        }
      }
    }
  }

  // 2. Fallback to Private Gemini API if Lovable failed or no Lovable key
  if (opts.privateGeminiKey) {
    console.info(`[${label}] Attempting Private Gemini Fallback`);
    try {
      const geminiModel = "gemini-1.5-flash";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${opts.privateGeminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: opts.messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: typeof m.content === "string" ? m.content : "(image_request)" }]
          })),
          generationConfig: opts.json ? { responseMimeType: "application/json" } : {}
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { ok: true, content: text, model: `${geminiModel} (private)` };
      }
    } catch (e) {
      console.error(`[${label}] Private Gemini error:`, e);
    }
  }

  return { ok: false, code: lastCode, detail: lastDetail };
}

export function parseJsonLoose<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

export async function generateGatewayImage(
  apiKey: string | undefined,
  prompt: string,
  opts: { timeoutMs?: number; label?: string } = {},
): Promise<{ ok: true; dataUrl: string } | { ok: false; code: AiErrorCode; detail: string }> {
  if (!apiKey) return { ok: false, code: "no_key", detail: "LOVABLE_API_KEY missing" };
  const models = ["google/gemini-2.0-flash", "google/gemini-3.0-flash-image-preview"];
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const label = opts.label ?? "edu-image";
  let lastCode: AiErrorCode = "unavailable";
  let lastDetail = "";

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(LOVABLE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });
      if (!res.ok) {
        lastCode = codeForStatus(res.status);
        lastDetail = `${model} → HTTP ${res.status} ${(await res.text().catch(() => "")).slice(0, 300)}`;
        console.error(`[${label}]`, lastDetail);
        continue;
      }
      const json = (await res.json()) as any;
      const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (url?.startsWith("data:image/")) return { ok: true, dataUrl: url };
      lastCode = "empty";
      lastDetail = `${model} → no image in response`;
    } catch (e) {
      lastCode = (e as Error)?.name === "AbortError" ? "timeout" : "unavailable";
      lastDetail = `${model} → ${(e as Error).message}`;
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, code: lastCode, detail: lastDetail };
}
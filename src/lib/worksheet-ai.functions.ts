import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { VISUAL_PROMPT, normalizeVisuals } from "./edu-visual-schema";
import { AI_ERROR_AR, callAiGateway, parseJsonLoose, type GatewayMessage } from "./ai-gateway";

/**
 * Free unlimited AI worksheet generator.
 * Strictly grounded in the Palestinian curriculum + the uploaded page image (if any).
 * Uses the free Gemini model chain with automatic fallback so students never hit a quota wall.
 */
const inputSchema = z.object({
  lesson: z.string().max(300).optional(),
  gradeId: z.number().int().min(1).max(12),
  subject: z.string().min(1).max(80),
  count: z.number().int().min(3).max(30).default(10),
  imageDataUrl: z.string().startsWith("data:image/").max(8_000_000).optional(),
});

const SYSTEM = `أنت معلم فلسطيني خبير معتمد لدى وزارة التربية والتعليم العالي الفلسطينية.
مهمتك: إنتاج ورقة عمل قابلة للطباعة + مفتاح إجابات نموذجي.

قيود إلزامية:
- اعتمد حصريًا على المنهاج الفلسطيني الرسمي وعلى صورة صفحة الكتاب المرفقة إن وُجدت. ممنوع منعًا باتًا استخدام مناهج أو مصادر خارجية.
- إن كانت هناك صورة: استخرج محتوى الدرس منها حرفيًا واعتمد عليه أولًا.
- استخدم عربية فصحى تربوية دقيقة بمصطلحات المنهاج (أو الإنجليزية إذا كانت المادة اللغة الإنجليزية).
- نوّع الأسئلة: اختيار من متعدد، صواب/خطأ، أكمل الفراغ، أسئلة مقالية قصيرة، ومسائل تطبيقية للمواد العلمية.
- لا تكتب مقدمات ولا خواتيم إنشائية.
${VISUAL_PROMPT}
- يجوز ربط سؤال بمرئية عبر الحقل "visualIndex" (رقم ترتيب المرئية في مصفوفة visuals ابتداءً من 0).

أعد JSON فقط بالشكل:
{
  "title": "عنوان ورقة العمل",
  "objectives": ["هدف 1", "هدف 2", "هدف 3"],
  "instructions": "تعليمات قصيرة للطالب",
  "visuals": [{ "kind": "table", "title": "...", "caption": "...", "headers": ["..."], "rows": [["..."]] }],
  "questions": [
    { "n": 1, "type": "mcq|truefalse|fill|short|problem", "text": "نص السؤال", "options": ["أ...","ب...","ج...","د..."], "answer": "الإجابة النموذجية", "explanation": "شرح مختصر للحل" }
  ]
}
- options تُملأ فقط لأسئلة الاختيار من متعدد، وإلا اجعلها [].
- كل سؤال يجب أن يحتوي answer صحيحة ودقيقة.`;

const MODELS = [
  "google/gemini-3.6-flash",
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-3.1-flash-lite",
  "google/gemini-2.5-pro",
];

export type WorksheetQuestion = {
  n: number;
  type: string;
  text: string;
  options: string[];
  answer: string;
  explanation: string;
};
export type GeneratedWorksheet = {
  title: string;
  objectives: string[];
  instructions: string;
  questions: WorksheetQuestion[];
  visuals: ReturnType<typeof normalizeVisuals>;
};

export const generateWorksheet = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<{ worksheet: GeneratedWorksheet | null; error: string | null }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { worksheet: null, error: "خدمة الذكاء الاصطناعي غير مفعّلة." };

    const gradeName = data.gradeId === 12 ? "الثاني عشر (التوجيهي)" : `الصف ${data.gradeId}`;
    const ask = `المادة: ${data.subject}
الصف: ${gradeName}
الدرس: ${data.lesson?.trim() || "(مستخرج من صورة صفحة الكتاب المرفقة)"}
عدد الأسئلة المطلوبة: ${data.count}
${data.imageDataUrl ? "اعتمد على صورة صفحة الكتاب المرفقة كمصدر أساسي للمحتوى." : "اعتمد على محتوى هذا الدرس كما ورد في الكتاب المدرسي الفلسطيني الرسمي."}`;

    const content = data.imageDataUrl
      ? [
          { type: "text", text: ask },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ]
      : ask;

    let lastErr = "";
    for (const model of MODELS) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (!res.ok) { lastErr = String(res.status); continue; }
        const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const raw = j.choices?.[0]?.message?.content ?? "";
        let parsed: Partial<GeneratedWorksheet> & { visuals?: unknown } = {};
        try { parsed = JSON.parse(raw); }
        catch {
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) { try { parsed = JSON.parse(m[0]); } catch { /* next model */ } }
        }
        const questions = (parsed.questions ?? [])
          .filter((q) => q && typeof q.text === "string" && q.text.trim())
          .slice(0, data.count)
          .map((q, i) => ({
            n: i + 1,
            type: String(q.type || "short"),
            text: String(q.text).trim(),
            options: Array.isArray(q.options) ? q.options.map(String).slice(0, 6) : [],
            answer: String(q.answer ?? "").trim(),
            explanation: String(q.explanation ?? "").trim(),
          }));
        if (!questions.length) { lastErr = "empty"; continue; }
        return {
          worksheet: {
            title: (parsed.title || data.lesson || `ورقة عمل — ${data.subject}`).toString().trim(),
            objectives: (parsed.objectives ?? []).map(String).slice(0, 6),
            instructions: String(parsed.instructions ?? "أجب عن جميع الأسئلة الآتية بخط واضح.").trim(),
            questions,
            visuals: normalizeVisuals(parsed.visuals, 4),
          },
          error: null,
        };
      } catch (e) {
        lastErr = (e as Error).message;
      }
    }
    return { worksheet: null, error: `الخدمة مشغولة الآن (${lastErr})، حاول مرة أخرى بعد لحظات.` };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { VISUAL_PROMPT, normalizeVisuals } from "./edu-visual-schema";

/**
 * Free unlimited AI summary generator, grounded strictly in the Palestinian curriculum.
 * Accepts a lesson name and/or a photo of the textbook page.
 */
const inputSchema = z.object({
  lesson: z.string().max(300).optional(),
  gradeId: z.number().int().min(1).max(12),
  subject: z.string().min(1).max(80),
  imageDataUrl: z.string().startsWith("data:image/").max(8_000_000).optional(),
});

const SYSTEM = `أنت معلم فلسطيني خبير معتمد لدى وزارة التربية والتعليم العالي الفلسطينية.
مهمتك: إنتاج ملخّص دراسي احترافي منظّم وغني بصريًا لدرس من المنهاج الفلسطيني.

قيود إلزامية:
- اعتمد حصريًا على المنهاج الفلسطيني الرسمي وعلى صورة صفحة الكتاب المرفقة إن وُجدت.
- لغة عربية فصحى تربوية دقيقة (أو الإنجليزية إن كانت المادة اللغة الإنجليزية).
- بدون مقدمات أو خواتيم إنشائية — محتوى مباشر ومركّز.
- نظّم المحتوى في أقسام واضحة: نظرة عامة، نقاط رئيسية، مصطلحات، أمثلة، إرشادات، أسئلة مراجعة.
${VISUAL_PROMPT}

أعد JSON فقط بالشكل:
{
  "title": "عنوان الملخّص",
  "overview": "فقرة تمهيدية من سطرين",
  "keyPoints": ["نقطة 1", "نقطة 2"],
  "definitions": [{ "term": "المصطلح", "meaning": "التعريف" }],
  "examples": ["مثال محلول 1"],
  "exam_tips": ["إرشاد للامتحان"],
  "questions": ["سؤال مراجعة 1"],
  "visuals": [{ "kind": "concept_map", "title": "...", "caption": "...", "center": "...", "branches": [{ "label": "...", "children": ["..."] }] }]
}`;

const MODELS = [
  "google/gemini-3.6-flash",
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-3.1-flash-lite",
  "google/gemini-2.5-pro",
];

export type GeneratedSummary = {
  title: string;
  overview: string;
  keyPoints: string[];
  definitions: { term: string; meaning: string }[];
  examples: string[];
  exam_tips: string[];
  questions: string[];
  visuals: ReturnType<typeof normalizeVisuals>;
};

export const generateSummary = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<{ summary: GeneratedSummary | null; error: string | null }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { summary: null, error: "خدمة الذكاء الاصطناعي غير مفعّلة." };

    const gradeName = data.gradeId === 12 ? "الثاني عشر (التوجيهي)" : `الصف ${data.gradeId}`;
    const ask = `المادة: ${data.subject}
الصف: ${gradeName}
الدرس: ${data.lesson?.trim() || "(مستخرج من صورة صفحة الكتاب المرفقة)"}
${data.imageDataUrl ? "اعتمد على صورة صفحة الكتاب المرفقة كمصدر أساسي." : "اعتمد على محتوى هذا الدرس كما ورد في الكتاب المدرسي الفلسطيني الرسمي."}`;

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
        let parsed: Partial<GeneratedSummary> & { visuals?: unknown } = {};
        try { parsed = JSON.parse(raw); }
        catch {
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) { try { parsed = JSON.parse(m[0]); } catch { /* next model */ } }
        }
        const keyPoints = (parsed.keyPoints ?? []).map(String).filter(Boolean).slice(0, 15);
        if (!keyPoints.length && !parsed.overview) { lastErr = "empty"; continue; }
        return {
          summary: {
            title: String(parsed.title || data.lesson || `ملخّص — ${data.subject}`).trim(),
            overview: String(parsed.overview ?? "").trim(),
            keyPoints,
            definitions: (parsed.definitions ?? [])
              .filter((d) => d && d.term)
              .map((d) => ({ term: String(d.term).trim(), meaning: String(d.meaning ?? "").trim() }))
              .slice(0, 12),
            examples: (parsed.examples ?? []).map(String).slice(0, 8),
            exam_tips: (parsed.exam_tips ?? []).map(String).slice(0, 8),
            questions: (parsed.questions ?? []).map(String).slice(0, 10),
            visuals: normalizeVisuals(parsed.visuals, 4),
          },
          error: null,
        };
      } catch (e) {
        lastErr = (e as Error).message;
      }
    }
    return { summary: null, error: `الخدمة مشغولة الآن (${lastErr})، حاول مرة أخرى بعد لحظات.` };
  });

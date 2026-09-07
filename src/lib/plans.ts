import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TierKey = "free" | "pro";

export type PlanFeature = { label: string; included: boolean };

export type PlanTier = {
  tier: TierKey;
  title: string;
  subtitle: string;
  price_label: string;
  daily_ai_limit: number;
  features: PlanFeature[];
  limits: Record<string, boolean | number | string>;
};

export type FeatureFlag = {
  key: string;
  label: string;
  enabled: boolean;
  min_tier: TierKey;
  position: number;
};

export type ProRequest = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  grade: string | null;
  age: number | null;
  note: string | null;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string;
};

export type AdminPrompt = {
  id: string;
  title: string;
  category: string;
  raw_request: string;
  generated_prompt: string;
  status: string;
  created_at: string;
};

function asFeatures(value: unknown): PlanFeature[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((f): f is PlanFeature => !!f && typeof f === "object" && "label" in (f as object))
    .map((f) => ({ label: String(f.label ?? ""), included: Boolean(f.included) }));
}

/* ---------------------------------- tiers --------------------------------- */

export function usePlanTiers() {
  const [tiers, setTiers] = useState<PlanTier[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from("plan_tiers").select("*").order("price_label");
    if (!error && data) {
      setTiers(
        (data as unknown as PlanTier[]).map((t) => ({
          ...t,
          features: asFeatures(t.features),
          limits: (t.limits ?? {}) as PlanTier["limits"],
        })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const tierOf = (key: TierKey) => tiers.find((t) => t.tier === key) ?? null;

  return { tiers, tierOf, loading, refresh };
}

export async function savePlanTier(tier: PlanTier) {
  const { error } = await supabase
    .from("plan_tiers")
    .update({
      title: tier.title,
      subtitle: tier.subtitle,
      price_label: tier.price_label,
      daily_ai_limit: tier.daily_ai_limit,
      features: tier.features as unknown as never,
      limits: tier.limits as unknown as never,
    })
    .eq("tier", tier.tier);
  return error;
}

/* ------------------------------ feature flags ----------------------------- */

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("feature_flags").select("*").order("position");
    setFlags((data as unknown as FeatureFlag[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Is a feature visible for the given plan? */
  const allows = useCallback(
    (key: string, plan: TierKey) => {
      const f = flags.find((x) => x.key === key);
      if (!f) return true;
      if (!f.enabled) return false;
      return f.min_tier === "pro" ? plan === "pro" : true;
    },
    [flags],
  );

  return { flags, loading, refresh, allows };
}

export async function saveFeatureFlag(flag: Partial<FeatureFlag> & { key: string }) {
  const { error } = await supabase.from("feature_flags").upsert(flag as never, { onConflict: "key" });
  return error;
}

export async function deleteFeatureFlag(key: string) {
  const { error } = await supabase.from("feature_flags").delete().eq("key", key);
  return error;
}

/* ------------------------------ pro requests ------------------------------ */

export function useProRequests() {
  const [rows, setRows] = useState<ProRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pro_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data as unknown as ProRequest[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}

export async function createProRequest(input: {
  user_id: string;
  email: string;
  display_name: string | null;
  grade: string;
  age: number | null;
  note?: string;
}) {
  const { data, error } = await supabase
    .from("pro_requests")
    .insert(input as never)
    .select("*")
    .maybeSingle();
  return { data: data as unknown as ProRequest | null, error };
}

export async function decideProRequest(id: string, approve: boolean) {
  const { error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>
  )("decide_pro_request", { _id: id, _approve: approve });
  return error;
}

/** Builds the WhatsApp deep link with a pre-filled Arabic message. */
export function buildWhatsAppLink(phone: string, msg: string) {
  const clean = (phone || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(msg);
  return clean ? `https://wa.me/${clean}?text=${text}` : `https://wa.me/?text=${text}`;
}

/* ------------------------------ admin prompts ----------------------------- */

export function useAdminPrompts() {
  const [rows, setRows] = useState<AdminPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_prompts")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data as unknown as AdminPrompt[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}

const CATEGORY_AR: Record<string, string> = {
  feature: "ميزة جديدة",
  fix: "إصلاح خلل",
  design: "تحسين تصميم",
  content: "محتوى",
  performance: "أداء",
};

/** Turns a rough Arabic request into a structured, optimized prompt — locally, free. */
export function generateStructuredPrompt(input: {
  title: string;
  category: string;
  raw: string;
  pages?: string;
  audience?: string;
}) {
  const cat = CATEGORY_AR[input.category] ?? input.category;
  const lines = input.raw
    .split(/\n|،|\.|;/g)
    .map((s) => s.trim())
    .filter(Boolean);

  return [
    `# طلب تطوير: ${input.title || "بدون عنوان"}`,
    `النوع: ${cat}`,
    "",
    "## السياق",
    "منصة «المنارة» التعليمية الفلسطينية — واجهة عربية RTL بالكامل، TanStack Start + React + Tailwind، وقاعدة بيانات مع سياسات صلاحيات.",
    input.pages ? `الصفحات/الأقسام المتأثرة: ${input.pages}` : "الصفحات/الأقسام المتأثرة: حدّدها بدقة قبل التعديل.",
    input.audience ? `المستخدم المستهدف: ${input.audience}` : "المستخدم المستهدف: الطالب.",
    "",
    "## المطلوب بالتفصيل",
    ...(lines.length ? lines.map((l, i) => `${i + 1}. ${l}`) : ["1. (لم تتم كتابة تفاصيل)"]),
    "",
    "## معايير القبول",
    "- كل النصوص بالعربية الفصحى وواجهة RTL سليمة.",
    "- تصميم متجاوب بالكامل (جوال/لوحي/سطح مكتب).",
    "- عدم كسر أي ميزة قائمة، والحفاظ على المسارات والمكوّنات الحالية.",
    "- معالجة الأخطاء برسائل عربية واضحة وحالات تحميل ظاهرة.",
    "- احترام صلاحيات المستخدم وخطة الاشتراك (مجاني / منارة بلس).",
    "",
    "## قيود",
    "- لا إعادة بناء أو إعادة تصميم شاملة، فقط التعديل المطلوب.",
    "- استخدام ألوان ورموز التصميم الحالية (الذهبي والملكي) دون ألوان ثابتة جديدة.",
  ].join("\n");
}

export async function saveAdminPrompt(row: Partial<AdminPrompt> & { title: string }) {
  const payload = { ...row };
  if (payload.id) {
    const { error } = await supabase.from("admin_prompts").update(payload as never).eq("id", payload.id);
    return error;
  }
  const { error } = await supabase.from("admin_prompts").insert(payload as never);
  return error;
}

export async function deleteAdminPrompt(id: string) {
  const { error } = await supabase.from("admin_prompts").delete().eq("id", id);
  return error;
}

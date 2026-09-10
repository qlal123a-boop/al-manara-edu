import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/use-auth";

export type Plan = "free" | "pro";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  plan_started_at: string | null;
  onboarded: boolean;
  ai_usage_date: string;
  ai_usage_count: number;
  age: number | null;
  grade: string | null;
  subscription_status: "pending" | "approved" | "none" | string;
};

export const FREE_DAILY_AI_LIMIT = 5;

/** Preset student avatars — stored as `preset:<id>` in profiles.avatar_url. */
export const AVATAR_PRESETS = [
  { id: "scholar", emoji: "🎓", label: "طالب متفوّق", ring: "from-[#d4af37] to-[#f6e27a]" },
  { id: "girl", emoji: "👩‍🎓", label: "طالبة مجتهدة", ring: "from-[#a78bfa] to-[#e9d5ff]" },
  { id: "boy", emoji: "👨‍🎓", label: "طالب نشيط", ring: "from-[#38bdf8] to-[#bae6fd]" },
  { id: "science", emoji: "🔬", label: "عالِم صغير", ring: "from-[#34d399] to-[#a7f3d0]" },
  { id: "math", emoji: "📐", label: "عبقري الرياضيات", ring: "from-[#fb7185] to-[#fecdd3]" },
  { id: "book", emoji: "📚", label: "قارئ نهم", ring: "from-[#f59e0b] to-[#fde68a]" },
  { id: "rocket", emoji: "🚀", label: "طموح لا يتوقف", ring: "from-[#6366f1] to-[#c7d2fe]" },
  { id: "star", emoji: "🌟", label: "نجم الصف", ring: "from-[#eab308] to-[#fef08a]" },
  { id: "pen", emoji: "🖊️", label: "كاتب متميّز", ring: "from-[#0ea5e9] to-[#bae6fd]" },
  { id: "globe", emoji: "🌍", label: "مستكشف العالم", ring: "from-[#10b981] to-[#d1fae5]" },
  { id: "brain", emoji: "🧠", label: "مفكّر ذكي", ring: "from-[#ec4899] to-[#fbcfe8]" },
  { id: "trophy", emoji: "🏆", label: "بطل التحدي", ring: "from-[#f97316] to-[#fed7aa]" },
] as const;

export function presetOf(avatarUrl: string | null | undefined) {
  if (!avatarUrl?.startsWith("preset:")) return null;
  const id = avatarUrl.slice("preset:".length);
  return AVATAR_PRESETS.find((p) => p.id === id) ?? null;
}

export function useProfile() {
  const { user, loading: authLoading } = useAuthUser();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as unknown as Profile;
      const { data: created, error: insErr } = await supabase
        .from("profiles")
        .insert({ id: user.id, display_name: user.email?.split("@")[0] ?? null })
        .select("*")
        .maybeSingle();
      if (insErr) return null;
      return (created as unknown as Profile) ?? null;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Omit<Profile, "id">>) => {
      if (!user) throw new Error("no-user");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...patch } as never, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });

  const profile = query.data ?? null;
  return {
    user,
    profile,
    plan: (profile?.plan ?? "free") as Plan,
    isPro: profile?.plan === "pro",
    loading: authLoading || (!!user && query.isLoading),
    update,
    refetch: query.refetch,
  };
}

/** Server-side counted quota. Returns remaining (-1 = unlimited). */
export async function consumeAiQuota(): Promise<{
  allowed: boolean;
  remaining: number;
  reason?: string;
  plan?: Plan;
}> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return { allowed: true, remaining: -1, reason: "guest" };
  const { data, error } = await supabase.rpc("consume_ai_quota" as never, {
    _limit: FREE_DAILY_AI_LIMIT,
  } as never);
  if (error) return { allowed: true, remaining: -1 };
  const r = data as unknown as { allowed: boolean; remaining: number; reason?: string; plan?: Plan };
  return r ?? { allowed: true, remaining: -1 };
}

export const QUOTA_MESSAGE_AR =
  "انتهت أسئلتك المجانية اليوم (٥ أسئلة). اشترك في «منارة بلس» بـ 1$ شهريًا للحصول على أسئلة غير محدودة، أو عُد غدًا.";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const SUPER_ADMIN_EMAIL = "qlal123a@gmail.com";

export type SubscriptionData = {
  tier: "free" | "pro";
  status: string;
  dailyUsage: Record<string, number>;
};

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await fetchSubscription(u.id);
      else setSubscription(null);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) await fetchSubscription(u.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchSubscription(userId: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", userId)
      .single();

    const { data: usage } = await supabase
      .from("daily_usage")
      .select("action_type, count")
      .eq("user_id", userId)
      .eq("usage_date", new Date().toISOString().split("T")[0]);

    const usageMap: Record<string, number> = {};
    usage?.forEach((row) => (usageMap[row.action_type] = row.count));

    setSubscription({
      tier: (profile?.subscription_tier as "free" | "pro") || "free",
      status: profile?.subscription_status || "active",
      dailyUsage: usageMap,
    });
  }

  const isSuperAdmin = !!user && user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
  
  return { user, loading, isSuperAdmin, subscription, refreshSubscription: () => user && fetchSubscription(user.id) };
}

export async function signOut() {
  await supabase.auth.signOut();
}
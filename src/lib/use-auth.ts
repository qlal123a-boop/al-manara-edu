import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const SUPER_ADMIN_EMAIL = "qlal123a@gmail.com";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      // Log the event for flow debugging if needed
      if (event === "SIGNED_IN") {
        setLoading(false);
      }
    });

    // Check current session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const isSuperAdmin = !!user && user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

  return { 
    user, 
    loading, 
    isSuperAdmin,
    // Helper to determine if a user should be pushed to pricing
    needsOnboarding: user && !isSuperAdmin
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}
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
      
      // Ensure loading is handled during sign in events
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setLoading(false);
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
      }
    });

    // Check current session on mount
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
    /**
     * needsPlansRedirect: Boolean
     * Returns true if a regular user (not super admin) just logged in
     * and should be directed to the /plans selection page.
     */
    needsPlansRedirect: !!user && !isSuperAdmin,
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}
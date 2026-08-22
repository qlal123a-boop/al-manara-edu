import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Internal admin sections.
 * Rows are always visible inside the dashboard (admins bypass the filter via RLS),
 * but only rows with `public_visible = true` are rendered on the public site.
 */
export type AdminSection = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  position: number;
  public_visible: boolean;
  created_at?: string;
};

const TABLE = "admin_sections" as never;

/** Public-facing hook: returns ONLY the sections marked visible. */
export function usePublicSections() {
  const [items, setItems] = useState<AdminSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from(TABLE)
        .select("*")
        .eq("public_visible", true)
        .order("position", { ascending: true });
      if (!alive) return;
      setItems((data as never as AdminSection[]) || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { items, loading };
}

/** Dashboard hook: returns every section (admins only, enforced by RLS). */
export function useAdminSections() {
  const [items, setItems] = useState<AdminSection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from(TABLE)
      .select("*")
      .order("position", { ascending: true });
    setItems((data as never as AdminSection[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { items, loading, refresh };
}

export const adminSectionsTable = TABLE;

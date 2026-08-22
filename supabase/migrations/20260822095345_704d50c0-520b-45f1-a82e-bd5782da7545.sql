CREATE TABLE public.admin_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  image_url text,
  position integer NOT NULL DEFAULT 0,
  public_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_sections TO authenticated;
GRANT ALL ON public.admin_sections TO service_role;

ALTER TABLE public.admin_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_sections_public_read" ON public.admin_sections
  FOR SELECT USING (public_visible = true OR public.is_super_admin());

CREATE POLICY "admin_sections_admin_write" ON public.admin_sections
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE TRIGGER admin_sections_set_updated_at
  BEFORE UPDATE ON public.admin_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
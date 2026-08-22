import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminSectionsTable, useAdminSections, type AdminSection } from "@/lib/admin-sections";

type Draft = Pick<AdminSection, "title" | "content" | "image_url" | "position" | "public_visible">;
const empty: Draft = { title: "", content: "", image_url: "", position: 0, public_visible: false };

/**
 * Internal sections manager.
 * Every section lives inside the dashboard; the "عرض على الموقع" switch is the
 * only thing that publishes it to the public homepage.
 */
export function AdminSectionsTab() {
  const { items, loading, refresh } = useAdminSections();
  const [form, setForm] = useState<Draft>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const save = async () => {
    if (!form.title.trim()) { toast.error("العنوان مطلوب"); return; }
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      image_url: form.image_url?.trim() || null,
      position: Number(form.position) || 0,
      public_visible: form.public_visible,
    };
    const { error } = editing
      ? await supabase.from(adminSectionsTable).update(payload as never).eq("id", editing)
      : await supabase.from(adminSectionsTable).insert(payload as never);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "تم التحديث" : "تمت الإضافة");
    setForm(empty); setEditing(null); void refresh();
  };

  const toggleVisible = async (s: AdminSection) => {
    const { error } = await supabase
      .from(adminSectionsTable)
      .update({ public_visible: !s.public_visible } as never)
      .eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success(!s.public_visible ? "أصبح القسم ظاهرًا على الموقع" : "أصبح القسم داخليًا فقط");
    void refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا القسم؟")) return;
    const { error } = await supabase.from(adminSectionsTable).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف"); void refresh();
  };

  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-5">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-extrabold">
          <Plus className="h-5 w-5 text-gold" /> {editing ? "تعديل قسم" : "إنشاء قسم داخلي"}
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          الأقسام تُنشأ داخل لوحة التحكم فقط. لا تظهر لأي زائر إلا عند تفعيل «عرض على الموقع».
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-bold">
            العنوان
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="مثال: إعلان بدء الفصل الثاني" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold">
            رابط صورة (اختياري)
            <input value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="https://..." />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold md:col-span-2">
            المحتوى
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="min-h-[110px] rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold">
            الترتيب
            <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input type="checkbox" checked={form.public_visible}
              onChange={(e) => setForm({ ...form, public_visible: e.target.checked })} />
            عرض هذا القسم على الموقع العام
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-5 py-2 text-sm font-bold shadow-gold" style={{ color: "var(--royal-deep)" }}>
            <Save className="h-4 w-4" /> {editing ? "حفظ التعديلات" : "إنشاء"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(empty); }} className="rounded-lg border border-border px-4 py-2 text-sm font-bold">إلغاء</button>
          )}
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
          <Lock className="h-5 w-5 text-gold" /> الأقسام ({items.length})
        </h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد أقسام بعد.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold">{s.title}</span>
                    <span className={`pill ${s.public_visible ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {s.public_visible ? "ظاهر للجمهور" : "داخلي فقط"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{s.content}</p>
                </div>
                <button onClick={() => toggleVisible(s)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold">
                  {s.public_visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {s.public_visible ? "إخفاء" : "إظهار"}
                </button>
                <button
                  onClick={() => {
                    setEditing(s.id);
                    setForm({ title: s.title, content: s.content, image_url: s.image_url || "", position: s.position, public_visible: s.public_visible });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
                >
                  تعديل
                </button>
                <button onClick={() => remove(s.id)} className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Check,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  X,
  Calendar,
  Clock
} from "lucide-react";
import {
  deleteAdminPrompt,
  deleteFeatureFlag,
  decideProRequest,
  generateStructuredPrompt,
  saveAdminPrompt,
  saveFeatureFlag,
  savePlanTier,
  useAdminPrompts,
  useFeatureFlags,
  usePlanTiers,
  useProRequests,
  type FeatureFlag,
  type PlanTier,
  type TierKey,
} from "@/lib/plans";

const STATUS_AR: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

/* ========================= 1) Subscription requests ======================== */

export function SubscriptionRequestsTab() {
  const { rows, loading, refresh } = useProRequests();
  const [busy, setBusy] = useState<string | null>(null);

  const decide = async (id: string, approve: boolean) => {
    setBusy(id);
    const err = await decideProRequest(id, approve);
    setBusy(null);
    if (err) {
      toast.error("تعذّر تنفيذ الإجراء: " + err.message);
      return;
    }
    toast.success(approve ? "تمت الموافقة وتفعيل الحساب Pro ✨" : "تم رفض الطلب بنجاح");
    refresh();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">إدارة الاشتراكات وطلبات Pro</h2>
        <button onClick={refresh} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:border-gold">
          <RefreshCw className="h-3.5 w-3.5" /> تحديث القائمة
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm">جارٍ جلب الطلبات...</p>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          لا توجد طلبات اشتراك حالياً.
        </p>
      )}

      <div className="grid gap-4">
        {rows.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-extrabold">{r.display_name || r.email}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      r.status === "approved"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : r.status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-gold/15 text-gold"
                    }`}
                  >
                    {STATUS_AR[r.status] ?? r.status}
                  </span>
                </div>
                
                <p className="mt-1 text-xs text-muted-foreground">{r.email}</p>
                
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <span className="block text-[10px] text-muted-foreground">الصف الدراسي</span>
                    <span className="text-xs font-bold">{r.grade || "—" }</span>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <span className="block text-[10px] text-muted-foreground">مدة الاشتراك</span>
                    <span className="text-xs font-bold">{r.note?.includes("شهر") ? r.note : "غير محدد"}</span>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <span className="block text-[10px] text-muted-foreground">تاريخ الطلب</span>
                    <span className="flex items-center gap-1 text-xs font-bold">
                      <Calendar className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <span className="block text-[10px] text-muted-foreground">وقت الطلب</span>
                    <span className="flex items-center gap-1 text-xs font-bold">
                      <Clock className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {r.note && !r.note.includes("شهر") && (
                  <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 p-2 text-xs">
                    <span className="font-bold">ملاحظة إضافية:</span> {r.note}
                  </div>
                )}
              </div>

              <div className="flex flex-row gap-2 self-center sm:flex-col">
                <button
                  onClick={() => decide(r.id, true)}
                  disabled={busy === r.id || r.status === "approved"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-xs font-black shadow-gold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ color: "var(--royal-deep)" }}
                >
                  {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                  قبول الترقية
                </button>
                <button
                  onClick={() => decide(r.id, false)}
                  disabled={busy === r.id || r.status === "rejected"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold transition-all hover:border-destructive hover:text-destructive disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> رفض الطلب
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ====================== 2) Plans & feature flags editor ==================== */

export function PlansAdminTab() {
  const { tiers, loading, refresh } = usePlanTiers();
  const [draft, setDraft] = useState<Record<string, PlanTier>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const value = (t: PlanTier) => draft[t.tier] ?? t;
  const patch = (t: PlanTier, p: Partial<PlanTier>) =>
    setDraft((d) => ({ ...d, [t.tier]: { ...value(t), ...p } }));

  const save = async (t: PlanTier) => {
    setBusy(t.tier);
    const err = await savePlanTier(value(t));
    setBusy(null);
    if (err) return toast.error("تعذّر الحفظ: " + err.message);
    toast.success("تم حفظ إعدادات الخطة بنجاح");
    refresh();
  };

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-extrabold">إعدادات خصائص الخطط (Pro vs Free)</h2>
      {loading && <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {tiers.map((t0) => {
          const t = value(t0);
          return (
            <article key={t.tier} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gold uppercase tracking-wider">
                  {t.tier === "pro" ? "باقة منارة بلس (المدفوعة)" : "الباقة الأساسية (المجانية)"}
                </h3>
                {t.tier === "pro" && <BadgeCheck className="h-5 w-5 text-gold" />}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold">
                  اسم الخطة
                  <input className="input-field mt-1" value={t.title} onChange={(e) => patch(t0, { title: e.target.value })} />
                </label>
                <label className="text-xs font-bold">
                  تسمية السعر (مثلاً: 3 شيكل)
                  <input className="input-field mt-1" value={t.price_label} onChange={(e) => patch(t0, { price_label: e.target.value })} />
                </label>
                <label className="text-xs font-bold sm:col-span-2">
                  الوصف المختصر
                  <input className="input-field mt-1" value={t.subtitle} onChange={(e) => patch(t0, { subtitle: e.target.value })} />
                </label>
                <label className="text-xs font-bold sm:col-span-2">
                  حدّ أسئلة الذكاء الاصطناعي يومياً (‎-1 = بلا حدود)
                  <input
                    type="number"
                    className="input-field mt-1 font-mono"
                    value={t.daily_ai_limit}
                    onChange={(e) => patch(t0, { daily_ai_limit: Number(e.target.value) })}
                  />
                </label>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-extrabold">الميزات المشمولة</span>
                  <button
                    onClick={() => patch(t0, { features: [...t.features, { label: "ميزة جديدة", included: true }] })}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2 py-1 text-[11px] font-bold hover:border-gold transition-colors"
                  >
                    <Plus className="h-3 w-3" /> إضافة ميزة
                  </button>
                </div>
                <div className="space-y-2">
                  {t.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <button
                        onClick={() => {
                          const next = [...t.features];
                          next[i] = { ...f, included: !f.included };
                          patch(t0, { features: next });
                        }}
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${
                          f.included ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {f.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </button>
                      <input
                        className="input-field flex-1 text-sm"
                        value={f.label}
                        onChange={(e) => {
                          const next = [...t.features];
                          next[i] = { ...f, label: e.target.value };
                          patch(t0, { features: next });
                        }}
                      />
                      <button
                        onClick={() => patch(t0, { features: t.features.filter((_, j) => j !== i) })}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-destructive opacity-0 group-hover:opacity-100 hover:border-destructive transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => save(t0)}
                disabled={busy === t.tier}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-royal px-4 py-3 text-sm font-black text-gold shadow-luxury disabled:opacity-60"
              >
                {busy === t.tier ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
                حفظ تعديلات الخطة
              </button>
            </article>
          );
        })}
      </div>

      <FeatureFlagsEditor />
    </section>
  );
}

function FeatureFlagsEditor() {
  const { flags, loading, refresh } = useFeatureFlags();
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const update = async (f: FeatureFlag, p: Partial<FeatureFlag>) => {
    const err = await saveFeatureFlag({ ...f, ...p });
    if (err) return toast.error("تعذّر الحفظ: " + err.message);
    refresh();
  };

  const add = async () => {
    if (!newKey.trim() || !newLabel.trim()) return toast.error("أدخل المعرّف والاسم");
    const err = await saveFeatureFlag({
      key: newKey.trim(),
      label: newLabel.trim(),
      enabled: true,
      min_tier: "free",
      position: flags.length + 1,
    });
    if (err) return toast.error("تعذّر الإضافة: " + err.message);
    setNewKey("");
    setNewLabel("");
    toast.success("تمت إضافة القسم للنظام");
    refresh();
  };

  const remove = async (key: string) => {
    const err = await deleteFeatureFlag(key);
    if (err) return toast.error("تعذّر الحذف: " + err.message);
    toast.success("تم حذف القسم");
    refresh();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-2">
         <h3 className="text-sm font-black">التحكم في وصول الأقسام</h3>
         <span className="rounded-md bg-gold/10 px-2 py-0.5 text-[10px] text-gold">صلاحيات الميزات</span>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        يمكنك تحديد ما إذا كان القسم متاحاً للجميع أو مخصصاً حصرياً لمشتركي «منارة بلس».
      </p>

      {loading && <p className="mt-3 text-sm text-muted-foreground">جارٍ التحميل...</p>}

      <div className="mt-3 space-y-2">
        {flags.map((f) => (
          <div key={f.key} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/20">
            <div className="min-w-[150px] flex-1">
               <input
                 className="bg-transparent text-sm font-bold focus:outline-none w-full"
                 value={f.label}
                 onChange={(e) => update(f, { label: e.target.value })}
               />
               <code className="block text-[10px] text-muted-foreground mt-0.5">ID: {f.key}</code>
            </div>
            <select
              className="input-field w-40 text-xs font-bold"
              value={f.min_tier}
              onChange={(e) => update(f, { min_tier: e.target.value as TierKey })}
            >
              <option value="free">متاح لكافة المستخدمين</option>
              <option value="pro">حصري لمشتركي Pro</option>
            </select>
            <button
              onClick={() => update(f, { enabled: !f.enabled })}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition-all ${
                f.enabled ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
              }`}
            >
              {f.enabled ? "نشط" : "متوقف"}
            </button>
            <button
              onClick={() => remove(f.key)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border text-destructive hover:border-destructive hover:bg-destructive/5 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl bg-muted/30 p-4 border border-border/50">
        <label className="text-[11px] font-bold flex-1 min-w-[120px]">
          المعرّف التقني (مثلاً: courses)
          <input className="input-field mt-1" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="ID القسم" />
        </label>
        <label className="text-[11px] font-bold flex-2 min-w-[180px]">
          اسم القسم بالعربية
          <input className="input-field mt-1" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="اسم الميزة الظاهر" />
        </label>
        <button onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 text-xs font-black shadow-gold" style={{ color: "var(--royal-deep)" }}>
          <Plus className="h-4 w-4" /> إضافة للمنظومة
        </button>
      </div>
    </div>
  );
}

/* ========================= 3) AI prompt engineer ========================== */

export function PromptStudioTab() {
  const { rows, loading, refresh } = useAdminPrompts();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("feature");
  const [pages, setPages] = useState("");
  const [audience, setAudience] = useState("");
  const [raw, setRaw] = useState("");
  const [output, setOutput] = useState("");
  const [saving, setSaving] = useState(false);

  const generate = () => {
    if (!raw.trim()) return toast.error("اكتب وصف الطلب أولًا");
    setOutput(generateStructuredPrompt({ title, category, raw, pages, audience }));
    toast.success("تم صياغة الأمر التطويري بنجاح");
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم النسخ للحافظة");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  const store = async () => {
    if (!output) return toast.error("ولّد الأمر أولًا");
    setSaving(true);
    const err = await saveAdminPrompt({
      title: title.trim() || "طلب تطوير جديد",
      category,
      raw_request: raw,
      generated_prompt: output,
      status: "ready",
    });
    setSaving(false);
    if (err) return toast.error("تعذّر الحفظ: " + err.message);
    toast.success("تم حفظ الأمر في مكتبة التطوير");
    setTitle("");
    setRaw("");
    setOutput("");
    refresh();
  };

  const remove = async (id: string) => {
    const err = await deleteAdminPrompt(id);
    if (err) return toast.error("تعذّر الحذف: " + err.message);
    toast.success("تم حذف الأمر من المكتبة");
    refresh();
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gold/10 p-3 text-gold">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black">استوديو صياغة أوامر AI</h2>
          <p className="text-xs text-muted-foreground">حوّل أفكارك التطويرية إلى أوامر برمجية منظمة واحترافية.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold">
            عنوان التعديل
            <input className="input-field mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: إضافة نظام تقييم الكورسات" />
          </label>
          <label className="text-xs font-bold">
            تصنيف العمل
            <select className="input-field mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="feature">ميزة جديدة</option>
              <option value="fix">إصلاح خطأ (Bug)</option>
              <option value="design">تطوير الواجهة</option>
              <option value="content">محتوى تعليمي</option>
              <option value="performance">تحسين الأداء</option>
            </select>
          </label>
          <label className="text-xs font-bold">
            النطاق (الصفحات المعنية)
            <input className="input-field mt-1" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="مثل: صفحة الدرس، لوحة التحكم" />
          </label>
          <label className="text-xs font-bold">
            الجمهور المستهدف
            <input className="input-field mt-1" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="الطلاب، المعلمون، الزوار" />
          </label>
        </div>

        <label className="mt-4 block text-xs font-bold">
          اشرح التعديل المطلوب ببساطة
          <textarea
            className="input-field mt-1 min-h-[120px] text-sm leading-relaxed"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="اكتب هنا ما تريد تنفيذه باللغة العربية البسيطة..."
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={generate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-royal px-5 py-2.5 text-sm font-black text-gold shadow-luxury transition-all hover:scale-105">
            <Wand2 className="h-4 w-4" /> صياغة الأمر
          </button>
          {output && (
            <>
              <button onClick={() => copy(output)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold hover:border-gold transition-all">
                <Copy className="h-4 w-4" /> نسخ الكود
              </button>
              <button onClick={store} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-black shadow-gold transition-all" style={{ color: "var(--royal-deep)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ للمكتبة
              </button>
            </>
          )}
        </div>

        {output && (
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <div className="bg-secondary/50 px-4 py-2 text-[10px] font-black uppercase text-muted-foreground border-b border-border">
              الأمر المُحسّن (Optimized Prompt)
            </div>
            <pre className="max-h-96 overflow-auto bg-card p-5 text-[13px] leading-relaxed whitespace-pre-wrap font-mono text-royal-deep/90">
              {output}
            </pre>
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
           <h3 className="text-sm font-black">أرشيف الطلبات المحفوظة</h3>
           <button onClick={refresh} className="text-[11px] text-gold hover:underline">تحديث المكتبة</button>
        </div>
        
        {loading && <p className="py-12 text-center text-sm text-muted-foreground">جارٍ تحميل الأرشيف...</p>}
        {!loading && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center">
            <Ghost className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">لم تقم بحفظ أي أوامر تطويرية بعد.</p>
          </div>
        )}

        <div className="grid gap-4">
          {rows.map((p) => (
            <article key={p.id} className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-gold/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-base font-black">{p.title}</h4>
                  <div className="mt-1 flex gap-2">
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold">{p.category}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => copy(p.generated_prompt)} className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card transition-all hover:border-gold hover:text-gold">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(p.id)} className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-destructive transition-all hover:border-destructive hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <div className="relative">
                  <pre className="max-h-32 overflow-hidden rounded-lg bg-muted/40 p-4 text-[11px] leading-6 font-mono text-muted-foreground group-hover:max-h-96 transition-all duration-500">
                    {p.generated_prompt}
                  </pre>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
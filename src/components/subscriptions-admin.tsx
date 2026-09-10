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
    toast.success(approve ? "تمت الترقية إلى منارة بلس ✨" : "تم رفض الطلب");
    refresh();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">طلبات الاشتراك</h2>
        <button onClick={refresh} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:border-gold">
          <RefreshCw className="h-3.5 w-3.5" /> تحديث
        </button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>}
      {!loading && rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          لا توجد طلبات اشتراك حتى الآن.
        </p>
      )}

      <div className="grid gap-3">
        {rows.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-extrabold">{r.display_name || r.email}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{r.email}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="rounded-md bg-secondary px-2 py-0.5">الصف: <b className="text-royal-deep">{r.grade || "—"}</b></span>
                  <span className="rounded-md bg-secondary px-2 py-0.5">العمر: <b className="text-royal-deep">{r.age ?? "—"}</b></span>
                  <span>تاريخ الطلب: <b>{new Date(r.created_at).toLocaleDateString("ar")}</b></span>
                </div>
                {r.note && <p className="mt-2 rounded-lg bg-gold/5 p-2 text-xs italic text-muted-foreground border-s-2 border-gold">ملاحظة: {r.note}</p>}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
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

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => decide(r.id, true)}
                disabled={busy === r.id || r.status === "approved"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-3 py-2 text-xs font-extrabold shadow-gold disabled:opacity-50 transition-smooth hover:scale-[1.02]"
                style={{ color: "var(--royal-deep)" }}
              >
                {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                اعتماد منارة بلس
              </button>
              <button
                onClick={() => decide(r.id, false)}
                disabled={busy === r.id || r.status === "rejected"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:border-destructive hover:text-destructive disabled:opacity-50 transition-smooth"
              >
                <X className="h-3.5 w-3.5" /> رفض
              </button>
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
    toast.success("تم حفظ الخطة بنجاح");
    refresh();
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold">إدارة الخطط والمزايا</h2>
        <p className="text-xs text-muted-foreground">تحكم في أسعار ومزايا الخطط المجانية والمدفوعة للمستخدمين.</p>
      </div>
      
      {loading && <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {tiers.map((t0) => {
          const t = value(t0);
          return (
            <article key={t.tier} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                 <h3 className={`text-sm font-extrabold ${t.tier === "pro" ? "text-gold" : "text-muted-foreground"}`}>
                  {t.tier === "pro" ? "✨ منارة بلس (الخطة المدفوعة)" : "🌱 الخطة المجانية"}
                </h3>
                {t.tier === "pro" && <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-black text-royal-deep">PREMIUM</span>}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold">
                  اسم الخطة
                  <input className="input-field mt-1" value={t.title} onChange={(e) => patch(t0, { title: e.target.value })} />
                </label>
                <label className="text-xs font-bold">
                  تسمية السعر (نص)
                  <input className="input-field mt-1" value={t.price_label} onChange={(e) => patch(t0, { price_label: e.target.value })} placeholder="مثال: $1 / شهرياً" />
                </label>
                <label className="text-xs font-bold sm:col-span-2">
                  وصف الخطة القصير
                  <input className="input-field mt-1" value={t.subtitle} onChange={(e) => patch(t0, { subtitle: e.target.value })} />
                </label>
                <label className="text-xs font-bold sm:col-span-2">
                  حدّ أسئلة الذكاء الاصطناعي يومياً (استخدم -1 لغير محدود)
                  <input
                    type="number"
                    className="input-field mt-1 border-gold/30"
                    value={t.daily_ai_limit}
                    onChange={(e) => patch(t0, { daily_ai_limit: Number(e.target.value) })}
                  />
                </label>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-extrabold">قائمة المميزات (تظهر في صفحة الأسعار)</span>
                  <button
                    onClick={() => patch(t0, { features: [...t.features, { label: "ميزة جديدة", included: true }] })}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-bold hover:border-gold transition-colors"
                  >
                    <Plus className="h-3 w-3" /> إضافة
                  </button>
                </div>
                <div className="space-y-2">
                  {t.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <button
                        onClick={() => {
                          const next = [...t.features];
                          next[i] = { ...f, included: !f.included };
                          patch(t0, { features: next });
                        }}
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${
                          f.included ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground opacity-50"
                        }`}
                        title={f.included ? "متضمنة في الخطة" : "غير متضمنة (تظهر مشطوبة)"}
                      >
                        {f.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </button>
                      <input
                        className="input-field flex-1 h-8 text-xs"
                        value={f.label}
                        onChange={(e) => {
                          const next = [...t.features];
                          next[i] = { ...f, label: e.target.value };
                          patch(t0, { features: next });
                        }}
                      />
                      <button
                        onClick={() => patch(t0, { features: t.features.filter((_, j) => j !== i) })}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => save(t0)}
                disabled={busy === t.tier}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-royal py-2.5 text-xs font-extrabold text-gold shadow-luxury hover:scale-[1.01] transition-smooth disabled:opacity-60"
              >
                {busy === t.tier ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
                تحديث خطة {t.tier === 'pro' ? 'منارة بلس' : 'المجانية'}
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
  const [busy, setBusy] = useState(false);

  const update = async (f: FeatureFlag, p: Partial<FeatureFlag>) => {
    const err = await saveFeatureFlag({ ...f, ...p });
    if (err) return toast.error("تعذّر الحفظ: " + err.message);
    refresh();
  };

  const add = async () => {
    if (!newKey.trim() || !newLabel.trim()) return toast.error("أدخل المعرّف والاسم");
    setBusy(true);
    const err = await saveFeatureFlag({
      key: newKey.trim(),
      label: newLabel.trim(),
      enabled: true,
      min_tier: "free",
      position: flags.length + 1,
    });
    setBusy(false);
    if (err) return toast.error("تعذّر الإضافة: " + err.message);
    setNewKey("");
    setNewLabel("");
    toast.success("تمت إضافة القسم للنظام");
    refresh();
  };

  const remove = async (key: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم من نظام التصاريح؟")) return;
    const err = await deleteFeatureFlag(key);
    if (err) return toast.error("تعذّر الحذف: " + err.message);
    toast.success("تم الحذف بنجاح");
    refresh();
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-extrabold">أقسام الموقع الذكية (تشغيل/إيقاف وصلاحيات)</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          تحكم في ظهور الأقسام الرئيسية في الموقع بناءً على نوع اشتراك الطالب أو عطلها تماماً.
        </p>
      </div>

      {loading && <p className="mt-3 text-sm text-muted-foreground">جارٍ التحميل...</p>}

      <div className="mt-3 space-y-2">
        {flags.map((f) => (
          <div key={f.key} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-secondary/30 p-2.5 transition-all hover:border-gold/20">
            <div className="flex-1 min-w-[150px]">
              <input
                className="w-full bg-transparent text-sm font-bold border-none outline-none focus:ring-0"
                value={f.label}
                onChange={(e) => update(f, { label: e.target.value })}
              />
              <div className="text-[10px] text-muted-foreground font-mono">ID: {f.key}</div>
            </div>
            
            <select
              className="input-field w-36 text-xs"
              value={f.min_tier}
              onChange={(e) => update(f, { min_tier: e.target.value as TierKey })}
            >
              <option value="free">متاح للجميع</option>
              <option value="pro">✨ منارة بلس فقط</option>
            </select>

            <button
              onClick={() => update(f, { enabled: !f.enabled })}
              className={`rounded-xl px-3 py-2 text-[11px] font-black transition-smooth ${
                f.enabled ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
              }`}
            >
              {f.enabled ? "مُفعّل" : "مُعطّل"}
            </button>

            <button
              onClick={() => remove(f.key)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-2xl border border-dashed border-border">
        <h4 className="text-xs font-black mb-3 text-royal-deep/60">إضافة قسم جديد للنظام</h4>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold">
            المعرّف (Code)
            <input className="input-field mt-1" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="مثال: videos" />
          </label>
          <label className="min-w-[12rem] flex-1 text-xs font-bold">
            اسم القسم بالعربية
            <input className="input-field mt-1" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="مثال: دروس الفيديو" />
          </label>
          <button 
            onClick={add} 
            disabled={busy} 
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 text-xs font-extrabold shadow-gold transition-smooth hover:scale-105" 
            style={{ color: "var(--royal-deep)" }}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} 
            تثبيت القسم
          </button>
        </div>
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
    toast.success("تمت معالجة الفكرة وتوليد الأمر");
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
      title: title.trim() || "طلب تطوير بلا عنوان",
      category,
      raw_request: raw,
      generated_prompt: output,
      status: "ready",
    });
    setSaving(false);
    if (err) return toast.error("تعذّر الحفظ: " + err.message);
    toast.success("تم حفظ الأمر في مكتبة المنارة");
    setTitle("");
    setRaw("");
    setOutput("");
    refresh();
  };

  const remove = async (id: string) => {
    const err = await deleteAdminPrompt(id);
    if (err) return toast.error("تعذّر الحذف");
    refresh();
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-royal-deep">
          <Sparkles className="h-5 w-5 text-gold" /> مصنع أوامر التطوير الذكي
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          حول أفكارك وتعديلاتك إلى أوامر تقنية دقيقة تضمن أفضل جودة تنفيذ في المنارة.
        </p>
      </div>

      <div className="rounded-3xl border border-gold/20 bg-card p-5 shadow-luxury">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-royal-deep">
            عنوان التعديل
            <input className="input-field mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تحسين نظام الاشتراك" />
          </label>
          <label className="text-xs font-bold text-royal-deep">
            تصنيف العمل
            <select className="input-field mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="feature">ميزة جديدة ✨</option>
              <option value="fix">إصلاح خطأ 🛠️</option>
              <option value="design">تصميم وواجهة 🎨</option>
              <option value="content">محتوى تعليمي 📚</option>
              <option value="performance">سرعة وأداء ⚡</option>
            </select>
          </label>
          <label className="text-xs font-bold text-royal-deep">
            الصفحات المتأثرة
            <input className="input-field mt-1" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="صفحة الإعدادات، البروفايل" />
          </label>
          <label className="text-xs font-bold text-royal-deep">
            الفئة المستهدفة
            <input className="input-field mt-1" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="الطلاب، الإدارة" />
          </label>
        </div>

        <label className="mt-4 block text-xs font-bold text-royal-deep">
          اشرح التعديل المطلوب بلهجتك أو بالفصحى
          <textarea
            className="input-field mt-1 min-h-[150px] leading-relaxed"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="أريد إضافة زر في ملف الطالب يتيح له رؤية تاريخ انتهاء اشتراكه وتنبيهه قبل 3 أيام..."
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={generate} className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-gradient-royal px-5 py-3 text-sm font-extrabold text-gold shadow-luxury transition-smooth hover:scale-[1.01]">
            <Sparkles className="h-4 w-4" /> توليد الأمر التقني
          </button>
          <button onClick={() => copy(output)} disabled={!output} className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-bold hover:border-gold transition-smooth disabled:opacity-50">
            <Copy className="h-4 w-4" /> نسخ للهندس
          </button>
          <button onClick={store} disabled={!output || saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-extrabold shadow-gold transition-smooth hover:scale-[1.01] disabled:opacity-50" style={{ color: "var(--royal-deep)" }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ للأرشيف
          </button>
        </div>

        {output && (
          <div className="mt-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gold">Output Prompt (Ready)</span>
              <span className="text-[10px] text-muted-foreground">انقر للنسخ ثم أرسله للمبرمج الذكي</span>
            </div>
            <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-2xl bg-secondary/50 p-5 text-xs leading-relaxed border border-border/50 text-royal-deep/90">
              {output}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
           <h3 className="text-sm font-black">سجل أوامر التطوير</h3>
           <div className="h-px flex-1 bg-border/50"></div>
        </div>
        
        {loading && <p className="text-sm text-muted-foreground">جارٍ استرجاع الأرشيف...</p>}
        {!loading && rows.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
            <Wand2 className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground font-bold">
              لا توجد أوامر محفوظة في المكتبة بعد.
            </p>
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {rows.map((p) => (
            <article key={p.id} className="group relative rounded-2xl border border-border bg-card p-5 shadow-card transition-smooth hover:border-gold/30 hover:shadow-luxury">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                   <h4 className="truncate text-sm font-black text-royal-deep">{p.title}</h4>
                   <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleString('ar-EG')}</p>
                </div>
                <div className="flex shrink-0 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copy(p.generated_prompt)} className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background hover:border-gold hover:text-gold transition-colors">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(p.id)} className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 max-h-24 overflow-hidden mask-fade-bottom">
                <pre className="text-[11px] leading-relaxed text-muted-foreground">
                  {p.generated_prompt}
                </pre>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Wand2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 22 1-1" />
      <path d="m5 19 1-1" />
      <path d="m11.8 11.8 2.5-2.5a4.95 4.95 0 0 1 7 7l-2.5 2.5a4.95 4.95 0 0 1-7-7Z" />
      <path d="m15 15 2 2" />
      <path d="M11 6 9 2" />
      <path d="M8 4 4 3" />
      <path d="M14 9l4-4" />
      <path d="M17 5 21 4" />
    </svg>
  );
}
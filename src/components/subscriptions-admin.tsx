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
  User,
  ShieldCheck,
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
import { useProfile } from "@/lib/profile";

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
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>الصف: <b>{r.grade || "—"}</b></span>
                  <span>العمر: <b>{r.age ?? "—"}</b></span>
                  <span>التاريخ: <b>{new Date(r.created_at).toLocaleDateString("ar")}</b></span>
                </p>
                {r.note && <p className="mt-2 text-xs text-muted-foreground">{r.note}</p>}
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-3 py-2 text-xs font-extrabold shadow-gold disabled:opacity-50"
                style={{ color: "var(--royal-deep)" }}
              >
                {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                اعتماد منارة بلس
              </button>
              <button
                onClick={() => decide(r.id, false)}
                disabled={busy === r.id || r.status === "rejected"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:border-destructive hover:text-destructive disabled:opacity-50"
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
  const { profile } = useProfile();
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
    toast.success("تم حفظ الخطة");
    refresh();
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-6">
        <div className="rounded-2xl border border-gold/30 bg-gradient-royal p-5 text-gold shadow-luxury">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-royal-deep">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">نظام الاشتراكات الذكي</h2>
              <p className="text-[11px] text-gold/70">تحكم في الأسعار والمزايا وقيود الذكاء الاصطناعي لكل خطة.</p>
            </div>
          </div>
          {profile && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/5 p-3 text-xs">
              <User className="h-4 w-4" />
              <span>حالتك الحالية: <b className="text-primary-foreground">{profile.plan === "pro" ? "منارة بلس" : "خطة مجانية"}</b></span>
            </div>
          )}
        </div>

        <h2 className="text-lg font-extrabold">إدارة الخطط والمزايا</h2>
        {loading && <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          {tiers.map((t0) => {
            const t = value(t0);
            return (
              <article key={t.tier} className="relative flex flex-col rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-extrabold text-gold">
                    {t.tier === "pro" ? "منارة بلس (مدفوعة)" : "الخطة المجانية"}
                  </h3>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">{t.tier}</span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-bold">
                    الاسم
                    <input className="input-field mt-1" value={t.title} onChange={(e) => patch(t0, { title: e.target.value })} />
                  </label>
                  <label className="text-xs font-bold">
                    السعر
                    <input className="input-field mt-1" value={t.price_label} onChange={(e) => patch(t0, { price_label: e.target.value })} />
                  </label>
                  <label className="text-xs font-bold sm:col-span-2">
                    الوصف
                    <input className="input-field mt-1" value={t.subtitle} onChange={(e) => patch(t0, { subtitle: e.target.value })} />
                  </label>
                  <label className="text-xs font-bold sm:col-span-2">
                    حدّ أسئلة الذكاء الاصطناعي يوميًا (‎-1 = بلا حدود)
                    <input
                      type="number"
                      className="input-field mt-1"
                      value={t.daily_ai_limit}
                      onChange={(e) => patch(t0, { daily_ai_limit: Number(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="mt-4 flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-extrabold">المزايا</span>
                    <button
                      onClick={() => patch(t0, { features: [...t.features, { label: "ميزة جديدة", included: true }] })}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-bold hover:border-gold"
                    >
                      <Plus className="h-3 w-3" /> إضافة
                    </button>
                  </div>
                  <div className="space-y-2">
                    {t.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const next = [...t.features];
                            next[i] = { ...f, included: !f.included };
                            patch(t0, { features: next });
                          }}
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                            f.included ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                          }`}
                          title={f.included ? "متاحة" : "غير متاحة"}
                        >
                          {f.included ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </button>
                        <input
                          className="input-field flex-1"
                          value={f.label}
                          onChange={(e) => {
                            const next = [...t.features];
                            next[i] = { ...f, label: e.target.value };
                            patch(t0, { features: next });
                          }}
                        />
                        <button
                          onClick={() => patch(t0, { features: t.features.filter((_, j) => j !== i) })}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border text-destructive hover:border-destructive"
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
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-royal px-4 py-2 text-xs font-extrabold text-gold shadow-luxury disabled:opacity-60"
                >
                  {busy === t.tier ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ التعديلات
                </button>
              </article>
            );
          })}
        </div>
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
    toast.success("تمت إضافة القسم");
    refresh();
  };

  const remove = async (key: string) => {
    const err = await deleteFeatureFlag(key);
    if (err) return toast.error("تعذّر الحذف: " + err.message);
    toast.success("تم الحذف");
    refresh();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <h3 className="text-sm font-extrabold">أقسام الموقع — تشغيل / إيقاف وتحديد الخطة</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        أوقف أي قسم (مثل قسم الفيديوهات) عن كل الموقع، أو اجعله حصريًا لمشتركي «منارة بلس».
      </p>

      {loading && <p className="mt-3 text-sm text-muted-foreground">جارٍ التحميل...</p>}

      <div className="mt-3 space-y-2">
        {flags.map((f) => (
          <div key={f.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-2">
            <input
              className="input-field min-w-0 flex-1"
              value={f.label}
              onChange={(e) => update(f, { label: e.target.value })}
            />
            <select
              className="input-field w-36"
              value={f.min_tier}
              onChange={(e) => update(f, { min_tier: e.target.value as TierKey })}
            >
              <option value="free">متاح للجميع</option>
              <option value="pro">حصري لمنارة بلس</option>
            </select>
            <button
              onClick={() => update(f, { enabled: !f.enabled })}
              className={`rounded-lg px-3 py-2 text-xs font-extrabold ${
                f.enabled ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
              }`}
            >
              {f.enabled ? "مُفعّل" : "مُعطّل"}
            </button>
            <button
              onClick={() => remove(f.key)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border text-destructive hover:border-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-xs font-bold">
          المعرّف (إنجليزي)
          <input className="input-field mt-1" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="videos" />
        </label>
        <label className="min-w-[10rem] flex-1 text-xs font-bold">
          الاسم بالعربية
          <input className="input-field mt-1" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="قسم الفيديوهات" />
        </label>
        <button onClick={add} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-4 py-2 text-xs font-extrabold shadow-gold" style={{ color: "var(--royal-deep)" }}>
          <Plus className="h-3.5 w-3.5" /> إضافة قسم
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
    toast.success("تم توليد الأمر المُحسّن");
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم النسخ");
    } catch {
      toast.error("تعذّر النسخ من المتصفح");
    }
  };

  const store = async () => {
    if (!output) return toast.error("ولّد الأمر أولًا");
    setSaving(true);
    const err = await saveAdminPrompt({
      title: title.trim() || "طلب بدون عنوان",
      category,
      raw_request: raw,
      generated_prompt: output,
      status: "ready",
    });
    setSaving(false);
    if (err) return toast.error("تعذّر الحفظ: " + err.message);
    toast.success("تم حفظ الأمر في المكتبة");
    setTitle("");
    setRaw("");
    setOutput("");
    refresh();
  };

  const remove = async (id: string) => {
    const err = await deleteAdminPrompt(id);
    if (err) return toast.error("تعذّر الحذف: " + err.message);
    refresh();
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Sparkles className="h-5 w-5 text-gold" /> مولّد أوامر التطوير الذكي
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          اكتب فكرتك ببساطة، وسيحوّلها النظام إلى أمر تطوير منظّم واحترافي جاهز للنسخ — بدون أي تكلفة.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold">
            عنوان الطلب
            <input className="input-field mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="إضافة قسم الفيديوهات" />
          </label>
          <label className="text-xs font-bold">
            النوع
            <select className="input-field mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="feature">ميزة جديدة</option>
              <option value="fix">إصلاح خلل</option>
              <option value="design">تحسين تصميم</option>
              <option value="content">محتوى</option>
              <option value="performance">أداء</option>
            </select>
          </label>
          <label className="text-xs font-bold">
            الصفحات المتأثرة
            <input className="input-field mt-1" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="الصفحة الرئيسية، لوحة التحكم" />
          </label>
          <label className="text-xs font-bold">
            المستخدم المستهدف
            <input className="input-field mt-1" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="الطالب / المعلّم / المسؤول" />
          </label>
        </div>

        <label className="mt-3 block text-xs font-bold">
          وصف الطلب بالعربية
          <textarea
            className="input-field mt-1 min-h-32"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="أريد قسمًا للفيديوهات يظهر لمشتركي منارة بلس فقط، مع بحث وتصنيف حسب الصف..."
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={generate} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-royal px-4 py-2 text-xs font-extrabold text-gold shadow-luxury">
            <Sparkles className="h-3.5 w-3.5" /> توليد الأمر
          </button>
          <button onClick={() => copy(output)} disabled={!output} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-bold hover:border-gold disabled:opacity-50">
            <Copy className="h-3.5 w-3.5" /> نسخ
          </button>
          <button onClick={store} disabled={!output || saving} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-4 py-2 text-xs font-extrabold shadow-gold disabled:opacity-50" style={{ color: "var(--royal-deep)" }}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ في المكتبة
          </button>
        </div>

        {output && (
          <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-secondary p-4 text-xs leading-6">
            {output}
          </pre>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-extrabold">مكتبة الأوامر المحفوظة</h3>
        {loading && <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>}
        {!loading && rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            لا توجد أوامر محفوظة بعد.
          </p>
        )}
        <div className="grid gap-3">
          {rows.map((p) => (
            <article key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <h4 className="truncate text-sm font-extrabold">{p.title}</h4>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => copy(p.generated_prompt)} className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:border-gold">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(p.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:border-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-secondary p-3 text-[11px] leading-6">
                {p.generated_prompt}
              </pre>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
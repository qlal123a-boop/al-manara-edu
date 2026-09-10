import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  Bot,
  Check,
  Crown,
  Download,
  Gauge,
  Infinity as InfinityIcon,
  Loader2,
  Palette,
  Sparkles,
  X,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile";
import { useAuthUser } from "@/lib/use-auth";
import { createProRequest, buildWhatsAppLink } from "@/lib/plans";
import { useBrand } from "@/lib/site-settings";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "خطط الاشتراك — المنارة التعليمية" },
      {
        name: "description",
        content: "اختر خطتك في المنارة: خطة مجانية بأدوات أساسية، أو منارة بلس بدولار واحد شهريًا لمساعد ذكي غير محدود ولوح ذكي احترافي.",
      },
      { property: "og:title", content: "خطط الاشتراك — المنارة التعليمية" },
      { property: "og:description", content: "خطة مجانية أو منارة بلس بـ 1$ شهريًا: مساعد ذكي بلا حدود، مستشار دراسي، ولوح ذكي احترافي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const FREE_FEATURES = [
  { label: "المساعد الذكي — ٥ أسئلة يوميًا", ok: true },
  { label: "المستشار الدراسي — محادثة أساسية", ok: true },
  { label: "اللوح الذكي — قلم وألوان أساسية", ok: true },
  { label: "الملخصات وأوراق العمل — عدد محدود يوميًا", ok: true },
  { label: "المكتبة والدروس والقنوات التعليمية", ok: true },
  { label: "تنزيل PDF غير محدود", ok: false },
  { label: "تشخيص متقدّم ومتابعة مستمرة", ok: false },
  { label: "اللوح الذكي Pro (ملء الشاشة والفرش المتقدمة)", ok: false },
];

const PRO_FEATURES = [
  "المساعد الذكي بلا حدود — أسئلة غير محدودة",
  "المستشار الدراسي الكامل: تشخيص المشكلات ومتابعة مستمرة",
  "اللوح الذكي Pro: ملء الشاشة، فرش متقدمة، منتقي ألوان مخصّص",
  "توليد ملخصات وأوراق عمل واختبارات بلا حدود",
  "تنزيل وطباعة PDF بلا حدود",
  "صور ورسوم تعليمية مولّدة تلقائيًا حسب الدرس",
  "أولوية في السرعة ودعم أسرع",
  "شهادات إتمام بتصاميم مميّزة",
];

function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const { profile, plan, update } = useProfile();
  const { value: brand } = useBrand();
  const [busy, setBusy] = useState<"free" | "pro" | null>(null);
  const [proOpen, setProOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [age, setAge] = useState("");
  const [note, setNote] = useState("");

  const chooseFree = async () => {
    if (!user) {
      toast.info("سجّل دخولك أولًا لاختيار الخطة");
      navigate({ to: "/login" });
      return;
    }
    setBusy("free");
    try {
      await update.mutateAsync({ plan: "free", onboarded: true, plan_started_at: null });
      toast.success("تم المتابعة بالخطة المجانية");
      navigate({ to: "/" });
    } catch {
      toast.error("تعذّر حفظ الخطة، حاول مجددًا");
    } finally {
      setBusy(null);
    }
  };

  const openPro = () => {
    if (!user) {
      toast.info("سجّل دخولك أولًا لاختيار الخطة");
      navigate({ to: "/login" });
      return;
    }
    setProOpen(true);
  };

  const submitPro = async () => {
    if (!user) return;
    if (!grade.trim()) {
      toast.error("يرجى كتابة الصف الدراسي");
      return;
    }
    setBusy("pro");
    try {
      const { error } = await createProRequest({
        user_id: user.id,
        email: user.email ?? "",
        display_name: profile?.display_name ?? null,
        grade: grade.trim(),
        age: age ? Number(age) : null,
        note: note.trim() || undefined,
      });
      if (error) throw error;

      await update.mutateAsync({ onboarded: true }).catch(() => undefined);

      const msg = [
        "السلام عليكم، أرغب بالاشتراك في «منارة بلس».",
        `الاسم: ${profile?.display_name || user.email || "-"}`,
        `البريد: ${user.email ?? "-"}`,
        `الصف: ${grade.trim()}`,
        age ? `العمر: ${age}` : "",
        note.trim() ? `ملاحظة: ${note.trim()}` : "",
      ].filter(Boolean).join("\n");

      window.open(buildWhatsAppLink(brand.whatsapp || brand.contact_phone || "", msg), "_blank", "noopener");
      toast.success("تم إرسال طلبك — سيتم تفعيل الاشتراك بعد موافقة الإدارة");
      setProOpen(false);
    } catch {
      toast.error("تعذّر إرسال الطلب، حاول مجددًا");
    } finally {
      setBusy(null);
    }
  };


  return (
    <div className="page-shell py-10 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold">
          <Sparkles className="h-3.5 w-3.5" /> {profile && !profile.onboarded ? "الخطوة ٢ من ٢" : "خطط الاشتراك"}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">اختر رحلة تفوّقك</h1>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          ابدأ مجانًا اليوم، أو اطلق العنان لكامل قدراتك مع أدواتنا الذكية المتقدمة.
        </p>
        <div className="gold-divider mx-auto mt-5 w-24" />
      </header>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
        {/* Free Plan Card */}
        <section className="relative flex flex-col rounded-3xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-lg md:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
              <Gauge className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">الخطة المجانية</h2>
              <p className="text-xs text-muted-foreground">للبداية واستكشاف المنصة</p>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-2">
            <span className="text-5xl font-extrabold text-royal-deep">$0</span>
            <span className="pb-2 text-sm text-muted-foreground">/ شهريًا</span>
          </div>

          <div className="mt-6 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">المميزات المتوفرة</h3>
            <ul className="space-y-3.5 text-sm">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                      f.ok ? "bg-emerald-500/15 text-emerald-600" : "bg-muted/50 text-muted-foreground/50"
                    }`}
                  >
                    {f.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </span>
                  <span className={f.ok ? "font-medium" : "text-muted-foreground/60 line-through"}>{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={chooseFree}
            disabled={busy !== null}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-border py-3.5 text-sm font-extrabold transition-all hover:bg-secondary disabled:opacity-60"
          >
            {busy === "free" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            المتابعة كطالب مجاني
          </button>
          {plan === "free" && profile?.onboarded && (
            <p className="mt-3 text-center text-xs font-bold text-emerald-600">بساطك الحالي</p>
          )}
        </section>

        {/* Pro Plan Card (Highlighted) */}
        <section className="relative flex flex-col overflow-hidden rounded-[2.5rem] border-2 border-gold bg-gradient-royal p-6 text-primary-foreground shadow-luxury transform lg:scale-105 md:p-10">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-gradient-gold px-3 py-1 text-[11px] font-extrabold" style={{ color: "var(--royal-deep)" }}>
                القيمة الأعلى
              </span>
              <Zap className="h-5 w-5 text-gold animate-pulse" />
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-gold" style={{ color: "var(--royal-deep)" }}>
                <Crown className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gold">منارة بلس</h2>
                <p className="text-xs text-primary-foreground/80 font-bold">تجربة ذكاء اصطناعي كاملة</p>
              </div>
            </div>

            <div className="mt-8 flex items-end gap-2">
              <span className="text-6xl font-black text-gold">$1</span>
              <div className="flex flex-col pb-2">
                <span className="text-xs font-bold text-gold/80 line-through decoration-white/30 text-start">$10.00</span>
                <span className="text-sm font-bold text-primary-foreground/70">/ شهريًا فقط</span>
              </div>
            </div>

            <div className="mt-8 flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold/60 mb-4">مميزات القوة (Unlimited)</h3>
              <ul className="space-y-4 text-sm">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-royal-deep">
                      <Check className="h-3.5 w-3.5 font-bold" />
                    </div>
                    <span className="font-bold leading-tight">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <ShieldCheck className="mb-1 h-5 w-5 text-gold" />
                <span className="text-[10px] font-bold opacity-80">خصوصية كاملة</span>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <Palette className="mb-1 h-5 w-5 text-gold" />
                <span className="text-[10px] font-bold opacity-80">أدوات رسم Pro</span>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <Download className="mb-1 h-5 w-5 text-gold" />
                <span className="text-[10px] font-bold opacity-80">تحميل لا محدود</span>
              </div>
            </div>

            <button
              onClick={openPro}
              disabled={busy !== null}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-gold py-4 text-base font-black shadow-gold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{ color: "var(--royal-deep)" }}
            >
              {busy === "pro" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 animate-bounce" />}
              اشترك في منارة بلس
            </button>
            
            {plan === "pro" && (
              <div className="mt-4 flex items-center justify-center gap-2 text-gold">
                <BadgeCheck className="h-5 w-5" />
                <span className="text-xs font-black uppercase">أنت عضو متميز الآن</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {proOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4 py-8 backdrop-blur-sm" onClick={() => setProOpen(false)}>
          <div
            className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-gold/40 bg-card p-6 shadow-luxury animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold">الانضمام لعائلة «منارة بلس»</h3>
                <p className="mt-1 text-xs text-muted-foreground">أدخل بياناتك، وسنفتح لك محادثة واتساب لتأكيد الاشتراك.</p>
              </div>
              <button onClick={() => setProOpen(false)} aria-label="إغلاق" className="rounded-xl border border-border p-2 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">الصف الدراسي</label>
                <input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="مثال: الصف الثاني عشر (التوجيهي)"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-gold/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">العمر</label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder="مثال: 17"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-gold/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">رسالة للإدارة (اختياري)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="أي استفسار أو تفاصيل إضافية..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>

            <button
              onClick={submitPro}
              disabled={busy === "pro"}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-gold py-4 text-base font-black shadow-gold hover:opacity-90 disabled:opacity-60"
              style={{ color: "var(--royal-deep)" }}
            >
              {busy === "pro" ? <Loader2 className="h-5 w-5 animate-spin" /> : <InfinityIcon className="h-5 w-5" />}
              إرسال وتأكيد الطلب عبر واتساب
            </button>
            <p className="mt-4 text-center text-[11px] font-medium text-muted-foreground">
              بمجرد الإرسال، سيتواصل معك فريقنا لتفعيل حسابك فورًا.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto mt-16 max-w-2xl text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          نهدف في المنارة لتوفير تعليم ذكي متاح للجميع. سعر الاشتراك الرمزي يساعدنا على تغطية تكاليف الخوادم والذكاء الاصطناعي.
          <br />
          يمكنك تغيير خطتك في أي وقت، ولا توجد التزامات مخفية.
        </p>
      </div>
    </div>
  );
}
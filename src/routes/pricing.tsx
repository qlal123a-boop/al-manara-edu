import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  ArrowLeft,
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
        content: "اختر خطتك في المنارة: خطة مجانية بأدوات أساسية، أو منارة بلس لمساعد ذكي غير محدود ولوح ذكي احترافي.",
      },
      { property: "og:title", content: "خطط الاشتراك — المنارة التعليمية" },
      { property: "og:description", content: "خطة مجانية أو منارة بلس: مساعد ذكي بلا حدود، مستشار دراسي، ولوح ذكي احترافي." },
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [grade, setGrade] = useState("");
  const [age, setAge] = useState("");
  const [note, setNote] = useState("");

  const chooseFree = async () => {
    if (plan === "free") return;
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
    if (plan === "pro") return;
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

      const cycleText = billingCycle === "yearly" ? "(اشتراك سنوي)" : "(اشتراك شهري)";
      const msg = [
        `السلام عليكم، أرغب بالاشتراك في «منارة بلس» ${cycleText}.`,
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
          <Sparkles className="h-3.5 w-3.5" /> {profile && !profile.onboarded ? "أهلاً بك! اختر خطتك للبدء" : "خطط الاشتراك"}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">بوابتك نحو التفوّق الذكي</h1>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          اختر الخطة التي تناسب احتياجاتك الدراسية اليوم.
        </p>

        {/* Toggle Switch */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center rounded-xl bg-secondary p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg px-6 py-2 text-xs font-bold transition-all ${billingCycle === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              شهري
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-lg px-6 py-2 text-xs font-bold transition-all ${billingCycle === "yearly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              سنوي <span className="ms-1 text-[10px] text-emerald-500 font-extrabold">- خصم 20%</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-2">
        {/* Free Plan Card */}
        <section className="relative flex flex-col rounded-3xl border border-border bg-card p-6 shadow-card md:p-8 transition-all hover:border-muted-foreground/30">
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
            <span className="text-5xl font-extrabold">$0</span>
            <span className="pb-2 text-sm text-muted-foreground">/ للأبد</span>
          </div>

          <ul className="mt-8 flex-1 space-y-4 text-sm">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-start gap-2.5">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${f.ok ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {f.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </span>
                <span className={f.ok ? "" : "text-muted-foreground/60 line-through"}>{f.label}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={chooseFree}
            disabled={busy !== null || plan === "free"}
            className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-extrabold transition-smooth disabled:opacity-80 ${
              plan === "free" ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-600" : "border-border hover:border-gold"
            }`}
          >
            {busy === "free" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {plan === "free" ? "خطتك الحالية" : "متابعة بالمجاني"}
          </button>
        </section>

        {/* Pro Plan Card */}
        <section className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-gold bg-gradient-royal p-6 text-primary-foreground shadow-luxury md:p-8">
          <div className="absolute -end-8 top-6 rotate-45 bg-gradient-gold px-12 py-1 text-[10px] font-extrabold text-royal-deep">
            الأكثر شعبية
          </div>
          
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-gold text-royal-deep">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gold">منارة بلس (Pro)</h2>
              <p className="text-xs text-primary-foreground/70">لكل طالب يريد التفوّق فعلًا</p>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-2">
            <span className="text-5xl font-extrabold text-gold">{billingCycle === "yearly" ? "$10" : "$1"}</span>
            <span className="pb-2 text-sm text-primary-foreground/70">/ {billingCycle === "yearly" ? "سنويًا" : "شهريًا"}</span>
          </div>

          <ul className="mt-8 flex-1 space-y-4 text-sm">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/20 text-gold">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={openPro}
            disabled={busy !== null || plan === "pro"}
            className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold transition-smooth hover:scale-[1.01] disabled:opacity-80 ${
              plan === "pro" ? "bg-emerald-500 text-white" : "bg-gradient-gold text-royal-deep shadow-gold"
            }`}
          >
            {busy === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : (plan === "pro" ? <BadgeCheck className="h-4 w-4" /> : <InfinityIcon className="h-4 w-4" />)}
            {plan === "pro" ? "خطتك الحالية" : "ترقية الآن"}
          </button>
        </section>
      </div>

      {/* Navigation Footer */}
      <div className="mt-12 flex flex-col items-center gap-6">
        <Link 
          to="/" 
          className="group inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          المتابعة إلى لوحة التحكم 
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </Link>
        
        <p className="max-w-xl text-center text-xs text-muted-foreground/60">
          يمكنك تغيير خطتك في أي وقت من هذه الصفحة. جميع الاشتراكات تساعدنا في استمرار تطوير المنارة لخدمة الطلاب في فلسطين.
        </p>
      </div>

      {/* Checkout Modal */}
      {proOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-8 backdrop-blur-sm" onClick={() => setProOpen(false)}>
          <div
            className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-gold/40 bg-card p-6 shadow-luxury"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold">طلب اشتراك «منارة بلس»</h3>
                <p className="mt-1 text-xs text-muted-foreground">سيتم توجيهك للواتساب لإتمام عملية الدفع والتفعيل.</p>
              </div>
              <button onClick={() => setProOpen(false)} className="rounded-lg border border-border p-1.5 hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">الصف الدراسي</label>
                <input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="مثال: الحادي عشر (علمي)"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">العمر</label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder="مثال: 17"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">ملاحظات إضافية</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                  placeholder="هل لديك أي استفسار قبل الاشتراك؟"
                />
              </div>
            </div>

            <button
              onClick={submitPro}
              disabled={busy === "pro"}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 text-sm font-extrabold text-royal-deep shadow-gold disabled:opacity-60"
            >
              {busy === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              إرسال الطلب والتواصل واتساب
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
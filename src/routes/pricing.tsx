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
      { title: "اختيار خطة الاشتراك — المنارة" },
      {
        name: "description",
        content: "ابدأ رحلتك التعليمية باختيار الخطة المناسبة لك في منصة المنارة.",
      },
      { property: "og:title", content: "خطط الاشتراك — المنارة التعليمية" },
      { property: "og:type", content: "website" },
    ],
  }),
});

const FREE_FEATURES = [
  { label: "المساعد الذكي — ٥ أسئلة يوميًا", ok: true },
  { label: "المستشار الدراسي — محادثة أساسية", ok: true },
  { label: "اللوح الذكي — قلم وألوان أساسية", ok: true },
  { label: "تنزيل PDF غير محدود", ok: false },
  { label: "تشخيص متقدّم ومتابعة مستمرة", ok: false },
  { label: "اللوح الذكي Pro الاحترافي", ok: false },
];

const PRO_FEATURES = [
  "المساعد الذكي بلا حدود — أسئلة غير محدودة",
  "المستشار الدراسي الكامل مع تشخيص ذكي",
  "اللوح الذكي Pro: ملء الشاشة وفرش متقدمة",
  "توليد ملخصات واختبارات بلا حدود",
  "تنزيل وطباعة ملفات PDF بلا حدود",
  "أولوية في الدعم الفني والسرعة",
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
      toast.success("تم تفعيل الخطة المجانية بنجاح");
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
      ].filter(Boolean).join("\n");

      window.open(buildWhatsAppLink(brand.whatsapp || brand.contact_phone || "", msg), "_blank", "noopener");
      toast.success("تم إرسال طلبك — سيتم التواصل معك للتفعيل");
      setProOpen(false);
      navigate({ to: "/" });
    } catch {
      toast.error("تعذّر إرسال الطلب، حاول مجددًا");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page-shell py-10 md:py-16 animate-in fade-in duration-700">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold">
          <Sparkles className="h-3.5 w-3.5" /> {profile && !profile.onboarded ? "الخطوة الأخيرة" : "خطط الاشتراك"}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold md:text-5xl tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          اختر مسارك التعليمي
        </h1>
        <p className="mt-3 text-sm text-muted-foreground md:text-base max-w-lg mx-auto">
          قبل البدء، اختر الخطة التي تناسب احتياجاتك الدراسية. يمكنك دائمًا الترقية لاحقًا.
        </p>
        <div className="gold-divider mx-auto mt-6 w-24" />
      </header>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-2 px-4">
        {/* Free Plan Card */}
        <section className="group relative flex flex-col rounded-[2.5rem] border border-border bg-card p-8 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/30 blur-3xl group-hover:bg-secondary/50 transition-colors" />
          
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground group-hover:bg-secondary/80 transition-colors">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black">الخطة المجانية</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Basic Access</p>
            </div>
          </div>

          <div className="mt-8 flex items-baseline gap-1">
            <span className="text-6xl font-black tracking-tighter">$0</span>
            <span className="text-muted-foreground font-bold">/ للأبد</span>
          </div>

          <ul className="mt-8 flex-1 space-y-4">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${f.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {f.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </span>
                <span className={f.ok ? "font-medium" : "text-muted-foreground line-through"}>{f.label}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={chooseFree}
            disabled={busy !== null}
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-border py-4 text-sm font-black transition-all hover:bg-foreground hover:text-background hover:border-foreground disabled:opacity-50"
          >
            {busy === "free" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
            الاستمرار بالحساب المجاني
          </button>
        </section>

        {/* Pro Plan Card */}
        <section className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border-2 border-gold bg-gradient-royal p-8 text-primary-foreground shadow-luxury transition-all duration-300 hover:shadow-[0_20px_50px_rgba(212,175,55,0.3)] hover:-translate-y-1">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-gold text-royal-deep">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gold">منارة بلس</h2>
                <p className="text-xs font-bold text-gold/60 uppercase tracking-widest">Unlimited Pro</p>
              </div>
            </div>
            <span className="rounded-full bg-gold/20 px-3 py-1 text-[10px] font-black text-gold border border-gold/30 backdrop-blur-sm">
              الموصى به
            </span>
          </div>

          <div className="mt-8 flex items-baseline gap-1">
            <span className="text-6xl font-black tracking-tighter text-gold">$1</span>
            <span className="text-gold/60 font-bold">/ شهريًا</span>
          </div>

          <ul className="mt-8 flex-1 space-y-4">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/20 text-gold">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="font-bold">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[Bot, Palette, Download].map((Icon, i) => (
              <div key={i} className="rounded-2xl border border-gold/20 bg-white/5 p-3 text-center backdrop-blur-md">
                <Icon className="mx-auto h-5 w-5 text-gold" />
              </div>
            ))}
          </div>

          <button
            onClick={openPro}
            disabled={busy !== null}
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-gold py-4 text-sm font-black text-royal-deep shadow-gold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {busy === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : <InfinityIcon className="h-4 w-4" />}
            ترقية الحساب الآن
          </button>
        </section>
      </div>

      {proOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setProOpen(false)}>
          <div
            className="w-full max-w-md overflow-hidden rounded-[2rem] border border-gold/30 bg-card shadow-luxury animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-royal p-6 text-center">
              <Crown className="mx-auto h-10 w-10 text-gold" />
              <h3 className="mt-2 text-xl font-black text-gold">تفعيل المنارة بلس</h3>
              <p className="text-xs text-gold/70">أدخل بياناتك وسيتم توجيهك للمبيعات</p>
            </div>

            <div className="p-8">
              <label className="block text-xs font-black mb-1.5 uppercase tracking-tighter text-muted-foreground">الصف الدراسي</label>
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="مثال: الصف الثاني عشر"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-gold outline-none"
              />

              <label className="mt-5 block text-xs font-black mb-1.5 uppercase tracking-tighter text-muted-foreground">العمر</label>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="مثال: 17"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-gold outline-none"
              />

              <button
                onClick={submitPro}
                disabled={busy === "pro"}
                className="mt-8 w-full rounded-2xl bg-gradient-gold py-4 text-sm font-black text-royal-deep shadow-gold transition-all active:scale-95 disabled:opacity-50"
              >
                {busy === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد وإرسال عبر واتساب"}
              </button>
              
              <button onClick={() => setProOpen(false)} className="mt-4 w-full text-xs font-bold text-muted-foreground hover:text-foreground underline underline-offset-4">
                إلغاء الأمر
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-16 text-center">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
          Al-Manara Educational Portal • Safe & Secure
        </p>
      </footer>
    </div>
  );
}
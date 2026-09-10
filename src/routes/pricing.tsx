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
} from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile";
import { useAuthUser } from "@/lib/use-auth";
import { createProRequest, buildWhatsAppLink, usePlanTiers } from "@/lib/plans";
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

function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const { profile, plan, update } = useProfile();
  const { value: brand } = useBrand();
  const { tiers, loading: tiersLoading } = usePlanTiers();
  const [busy, setBusy] = useState<"free" | "pro" | null>(null);
  const [proOpen, setProOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [age, setAge] = useState("");
  const [note, setNote] = useState("");

  const freeTier = tiers.find((t) => t.tier === "free");
  const proTier = tiers.find((t) => t.tier === "pro");

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

  if (tiersLoading) {
    return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>;
  }

  return (
    <div className="page-shell py-10 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold">
          <Sparkles className="h-3.5 w-3.5" /> {profile && !profile.onboarded ? "الخطوة ٢ من ٢" : "خطط الاشتراك"}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">اختر خطتك المناسبة</h1>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          ابدأ مجانًا اليوم، أو افتح كل أدوات المنارة الذكية بأقل من فنجان قهوة شهريًا.
        </p>
        <div className="gold-divider mx-auto mt-5 w-24" />
      </header>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-2">
        {/* Free Plan from Database */}
        <section className="relative flex flex-col rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
              <Gauge className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{freeTier?.title || "الخطة المجانية"}</h2>
              <p className="text-xs text-muted-foreground">{freeTier?.subtitle || "للبداية واستكشاف المنصة"}</p>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-2">
            <span className="text-5xl font-extrabold">{freeTier?.price_label || "$0"}</span>
            <span className="pb-2 text-sm text-muted-foreground">/ شهريًا</span>
          </div>

          <ul className="mt-6 flex-1 space-y-3 text-sm">
            {(freeTier?.features || []).map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                    f.included ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {f.included ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </span>
                <span className={f.included ? "" : "text-muted-foreground line-through"}>{f.label}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={chooseFree}
            disabled={busy !== null}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl border border-border py-3.5 text-sm font-extrabold transition-smooth hover:border-gold disabled:opacity-60"
          >
            {busy === "free" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            متابعة بالمجاني
          </button>
          {plan === "free" && profile?.onboarded && (
            <p className="mt-3 text-center text-xs font-bold text-muted-foreground">خطتك الحالية</p>
          )}
        </section>

        {/* Pro Plan from Database */}
        <section className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-gold bg-gradient-royal p-6 text-primary-foreground shadow-luxury md:p-8">
          <span className="absolute end-6 top-6 rounded-full bg-gradient-gold px-3 py-1 text-[11px] font-extrabold" style={{ color: "var(--royal-deep)" }}>
            الأكثر اختيارًا
          </span>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-gold" style={{ color: "var(--royal-deep)" }}>
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gold">{proTier?.title || "منارة بلس"}</h2>
              <p className="text-xs text-primary-foreground/70">{proTier?.subtitle || "لكل طالب يريد التفوّق فعلًا"}</p>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-2">
            <span className="text-5xl font-extrabold text-gold">{proTier?.price_label || "$1"}</span>
            <span className="pb-2 text-sm text-primary-foreground/70">/ شهريًا</span>
          </div>

          <ul className="mt-6 flex-1 space-y-3 text-sm">
            {(proTier?.features || []).map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${f.included ? "bg-gold/20 text-gold" : "bg-white/10 text-white/40"}`}>
                  {f.included ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </span>
                <span className={f.included ? "" : "text-white/40 line-through"}>{f.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-primary-foreground/80">
            <div className="rounded-xl border border-gold/30 bg-white/5 p-2">
              <Bot className="mx-auto mb-1 h-4 w-4 text-gold" /> مساعد ذكي
            </div>
            <div className="rounded-xl border border-gold/30 bg-white/5 p-2">
              <Palette className="mx-auto mb-1 h-4 w-4 text-gold" /> لوح Pro
            </div>
            <div className="rounded-xl border border-gold/30 bg-white/5 p-2">
              <Download className="mx-auto mb-1 h-4 w-4 text-gold" /> PDF بلا حدود
            </div>
          </div>

          <button
            onClick={openPro}
            disabled={busy !== null}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3.5 text-sm font-extrabold shadow-gold transition-smooth hover:scale-[1.01] disabled:opacity-60"
            style={{ color: "var(--royal-deep)" }}
          >
            {busy === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : <InfinityIcon className="h-4 w-4" />}
            اشترك الآن
          </button>
          {plan === "pro" && (
            <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-center text-xs font-bold text-gold">
              <BadgeCheck className="h-4 w-4" /> اشتراكك فعّال
            </p>
          )}
        </section>
      </div>

      {proOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-8" onClick={() => setProOpen(false)}>
          <div
            className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-gold/40 bg-card p-6 shadow-luxury"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold">طلب الاشتراك في «منارة بلس»</h3>
                <p className="mt-1 text-xs text-muted-foreground">أدخل بياناتك، وسنفتح لك محادثة واتساب مع الإدارة لإتمام الاشتراك.</p>
              </div>
              <button onClick={() => setProOpen(false)} aria-label="إغلاق" className="rounded-lg border border-border p-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-5 block text-xs font-bold">الصف الدراسي</label>
            <input
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="مثال: الصف التاسع"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />

            <label className="mt-4 block text-xs font-bold">العمر</label>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="مثال: 15"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />

            <label className="mt-4 block text-xs font-bold">ملاحظة (اختياري)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />

            <button
              onClick={submitPro}
              disabled={busy === "pro"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3 text-sm font-extrabold shadow-gold disabled:opacity-60"
              style={{ color: "var(--royal-deep)" }}
            >
              {busy === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              إرسال الطلب عبر واتساب
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              يُحفظ طلبك في لوحة التحكم، ويُفعَّل الاشتراك فور موافقة الإدارة.
            </p>
          </div>
        </div>
      )}

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
        يمكنك تغيير خطتك في أي وقت من هذه الصفحة. الأسعار بالدولار الأمريكي وتشمل جميع التحديثات القادمة.
      </p>
    </div>
  );
}
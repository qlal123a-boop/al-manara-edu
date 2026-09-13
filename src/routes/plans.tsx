import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Crown, Zap, ShieldCheck } from "lucide-react";
import { useAuthUser } from "@/lib/use-auth";
import { useEffect, useState } from "react";
import { usePlanTiers } from "@/lib/plans";
import { SubscriptionForm } from "@/components/ui/subscription-form";

export const Route = createFileRoute("/plans")({
  component: PlansPage,
  head: () => ({
    meta: [
      { title: "خطط الاشتراك — المنارة" },
      { name: "description", content: "اختر الخطة المناسبة لك للبدء في استخدام منصة المنارة التعليمية." },
    ],
  }),
});

function PlansPage() {
  const { user, loading } = useAuthUser();
  const navigate = useNavigate();
  const { tiers, loading: tiersLoading } = usePlanTiers();
  const [showProForm, setShowProForm] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading || tiersLoading) return null;

  const handleSelectPlan = (tierKey: string) => {
    if (tierKey === "free") {
      // Directly set as free/basic if not already, then redirect
      navigate({ to: "/" });
    } else if (tierKey === "pro") {
      setShowProForm(true);
    }
  };

  if (showProForm) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="mx-auto max-w-xl">
          <button 
            onClick={() => setShowProForm(false)}
            className="mb-6 text-sm font-bold text-muted-foreground hover:text-royal-deep flex items-center gap-2"
          >
            ← العودة لاختيار الخطط
          </button>
          <SubscriptionForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl font-black bg-gradient-gold bg-clip-text text-transparent">
            اختر خطتك التعليمية
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
            انضم إلى آلاف الطلاب والمبدعين في رحلتهم نحو التميز. اختر الباقة التي تناسب احتياجاتك.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Rendering tiers from database configuration */}
          {tiers.map((t) => (
            <div 
              key={t.tier} 
              className={`relative group flex flex-col rounded-3xl border p-8 transition-smooth shadow-sm ${
                t.tier === "pro" 
                  ? "border-gold bg-gradient-royal ring-1 ring-gold/20 shadow-luxury-gold" 
                  : "border-border bg-card hover:border-gold/50"
              }`}
            >
              {t.tier === "pro" && (
                <div className="absolute -top-4 right-8 rounded-full bg-gradient-gold px-4 py-1 text-xs font-black text-royal-deep">
                  الأكثر طلباً
                </div>
              )}

              <div className="mb-8">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${
                  t.tier === "pro" ? "bg-gold/10 text-gold" : "bg-secondary text-muted-foreground"
                }`}>
                  {t.tier === "pro" ? <Crown className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                </div>
                <h2 className={`text-2xl font-bold ${t.tier === "pro" ? "text-white" : ""}`}>{t.title}</h2>
                <p className={`mt-1 text-sm ${t.tier === "pro" ? "text-gold/80" : "text-muted-foreground"}`}>
                  {t.subtitle}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${t.tier === "pro" ? "text-gold" : ""}`}>
                    {t.price_label}
                  </span>
                </div>
              </div>

              <div className={`flex-1 space-y-4 mb-10 text-sm ${t.tier === "pro" ? "text-white/90" : "text-muted-foreground"}`}>
                {t.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`rounded-full p-0.5 ${t.tier === "pro" ? "bg-gold/20" : ""}`}>
                      <Check className={`h-4 w-4 ${t.tier === "pro" ? "text-gold" : "text-emerald-500"}`} />
                    </div>
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleSelectPlan(t.tier)}
                className={`w-full rounded-xl py-4 font-bold transition-smooth ${
                  t.tier === "pro"
                    ? "bg-gradient-gold text-royal-deep shadow-gold hover:scale-[1.02]"
                    : "border border-border hover:bg-secondary"
                }`}
              >
                {t.tier === "pro" ? "ترقية الحساب الآن" : "الاستمرار بالحساب المجاني"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-center gap-4 text-center border-t border-border pt-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <span className="text-sm">دفع آمن وسهل عبر الواتساب — تفعيل فوري بعد التأكيد</span>
          </div>
        </div>
      </div>
    </div>
  );
}
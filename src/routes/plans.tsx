import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Crown, Zap, ShieldCheck } from "lucide-react";
import { useAuthUser } from "@/lib/use-auth";
import { useEffect } from "react";

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

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading) return null;

  const handleSelectPlan = (plan: 'free' | 'pro') => {
    if (plan === 'free') {
      navigate({ to: "/" });
    } else {
      // This would typically lead to a payment gateway
      console.log("Redirecting to payment...");
    }
  };

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
          {/* Free Plan */}
          <div className="relative group flex flex-col rounded-3xl border border-border bg-card p-8 transition-smooth hover:border-gold/50 shadow-sm">
            <div className="mb-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">الحساب المجاني</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black">0</span>
                <span className="text-muted-foreground">ر.س/شهر</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-10 text-sm">
              {[ "الوصول للمحتوى العام", "متابعة الدروس الأساسية", "تنبيهات البريد الإلكتروني", "دعم فني محدود" ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-muted-foreground">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleSelectPlan('free')}
              className="w-full rounded-xl border border-border py-4 font-bold transition-smooth hover:bg-secondary"
            >
              الاستمرار بالحساب المجاني
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative group flex flex-col rounded-3xl border border-gold bg-gradient-royal p-8 shadow-luxury-gold ring-1 ring-gold/20">
            <div className="absolute -top-4 right-8 rounded-full bg-gradient-gold px-4 py-1 text-xs font-black text-royal-deep">
              الأكثر طلباً
            </div>
            
            <div className="mb-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold mb-4">
                <Crown className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">الخطة الاحترافية (Pro)</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-gold">49</span>
                <span className="text-gold/70">ر.س/شهر</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-10 text-sm text-white/90">
              {[ 
                "الوصول الكامل لجميع الدروس والملفات", 
                "أدوات تحليل الأداء المتقدمة", 
                "تحميل المحتوى للمشاهدة بدون إنترنت", 
                "شهادات إتمام معتمدة",
                "أولوية الدعم الفني 24/7"
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="rounded-full bg-gold/20 p-0.5">
                    <Check className="h-3.5 w-3.5 text-gold" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleSelectPlan('pro')}
              className="w-full rounded-xl bg-gradient-gold py-4 font-bold text-royal-deep shadow-gold transition-smooth hover:scale-[1.02]"
            >
              ترقية الحساب الآن
            </button>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-center gap-4 text-center border-t border-border pt-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <span className="text-sm">دفع آمن 100% — إلغاء الاشتراك في أي وقت</span>
          </div>
        </div>
      </div>
    </div>
  );
}
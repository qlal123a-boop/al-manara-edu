import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Lock, LogIn, Sparkles } from "lucide-react";
import { useAuthUser } from "@/lib/use-auth";
import { useProfile } from "@/lib/profile";
import { useEffect } from "react";

export function RequireAuth({ children, title = "هذه الأداة للطلاب المسجّلين" }: { children: React.ReactNode; title?: string }) {
  const { user, loading } = useAuthUser();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to pricing if user is logged in but hasn't completed onboarding/plan selection
    // Only if they aren't already on the pricing page
    if (user && !profileLoading && profile && !profile.onboarded && location.pathname !== "/pricing") {
      navigate({ to: "/pricing" });
    }
  }, [user, profile, profileLoading, location.pathname, navigate]);

  if (loading || profileLoading) {
    return <div className="p-12 text-center text-muted-foreground">جارٍ التحقق من الجلسة...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-5">
        <div className="w-full rounded-3xl border border-gold/40 bg-card p-8 text-center shadow-luxury">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-royal text-gold">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            سجّل دخولك أو أنشئ حسابًا مجانيًا للوصول إلى أدوات المنارة التعليمية.
          </p>
          <Link
            to="/login"
            search={{ redirect: location.pathname } as never}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3 text-sm font-bold shadow-gold transition-smooth hover:scale-[1.02]"
            style={{ color: "var(--royal-deep)" }}
          >
            <LogIn className="h-4 w-4" /> الذهاب لتسجيل الدخول
          </Link>
          <Link to="/" className="mt-3 inline-block text-xs font-bold text-muted-foreground hover:text-primary">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // If user is authenticated but hasn't chosen a plan, show a redirecting state
  // This prevents content flash before the useEffect takes over
  if (profile && !profile.onboarded && location.pathname !== "/pricing") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-5 text-center">
        <div className="w-full space-y-4">
          <div className="mx-auto grid h-12 w-12 animate-pulse place-items-center rounded-full bg-gold/20 text-gold">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-muted-foreground">جارٍ توجيهك لاختيار خطة الاشتراك...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
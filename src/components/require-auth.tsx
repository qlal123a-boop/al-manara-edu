import { Link, useLocation } from "@tanstack/react-router";
import { Lock, LogIn } from "lucide-react";
import { useAuthUser } from "@/lib/use-auth";
import { useProfile } from "@/lib/profile";

export function RequireAuth({ children, title = "هذه الأداة للطلاب المسجّلين" }: { children: React.ReactNode; title?: string }) {
  const { user, loading: authLoading } = useAuthUser();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  const loading = authLoading || profileLoading;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-12 text-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
          <p className="text-sm font-bold">جارٍ التحقق من الجلسة...</p>
        </div>
      </div>
    );
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

  // إذا كان المستخدم مسجلاً ولكن لم يكمل اختيار الخطة بعد التسجيل (Onboarding)
  // نقوم بتوجيهه لصفحة الأسعار إذا لم يكن فيها بالفعل
  if (user && profile && !profile.onboarded && location.pathname !== "/pricing") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-5">
        <div className="w-full rounded-3xl border border-gold/40 bg-card p-8 text-center shadow-luxury">
          <h1 className="text-xl font-extrabold">اكتمل التسجيل!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            يرجى اختيار خطة الاشتراك الخاصة بك للمتابعة إلى المنصة.
          </p>
          <Link
            to="/pricing"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-royal py-3 text-sm font-bold text-gold shadow-luxury"
          >
            اختيار الخطة الآن
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
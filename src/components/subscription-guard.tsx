import React from "react";
import { Link } from "@tanstack/react-router";
import { Crown, Lock, Sparkles } from "lucide-react";
import { useAuthUser } from "@/lib/use-auth";

const LIMITS = {
  free: 5,
  pro: 9999,
};

type GuardProps = {
  actionType: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function SubscriptionGuard({ actionType, children, fallback }: GuardProps) {
  const { subscription, loading } = useAuthUser();

  if (loading) return <div className="animate-pulse rounded-xl bg-muted h-32 w-full" />;

  const tier = subscription?.tier || "free";
  const currentUsage = subscription?.dailyUsage[actionType] || 0;
  const limit = LIMITS[tier];
  const isLocked = currentUsage >= limit;

  if (isLocked) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="rounded-3xl border-2 border-dashed border-gold/40 bg-gold/5 p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-gold text-royal-deep shadow-gold">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-xl font-extrabold">وصلت للحد اليومي المجاني</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          لقد استخدمت الـ {limit} عمليات المتاحة لك اليوم. اشترك في «منارة بلس» للحصول على عمليات غير محدودة.
        </p>
        <Link
          to="/pricing"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-royal px-6 py-3 text-sm font-extrabold text-gold shadow-luxury transition-smooth hover:scale-105"
        >
          <Crown className="h-4 w-4" /> ترقية الحساب الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      {children}
      {tier === "free" && (
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground">
          <Sparkles className="h-3 w-3 text-gold" />
          الاستهلاك اليومي: {currentUsage} من {limit}
        </div>
      )}
    </div>
  );
}
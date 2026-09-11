import React, { useState } from 'react';
import { Check, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface PricingSectionProps {
  isUserLoggedIn?: boolean;
  userPlan?: 'free' | 'pro';
  onPlanSelect?: (plan: 'free' | 'pro', annual: boolean) => void;
}

export default function PricingSection({ 
  isUserLoggedIn = false, 
  userPlan = 'free', 
  onPlanSelect 
}: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();

  const handleAction = (plan: 'free' | 'pro') => {
    if (onPlanSelect) {
      onPlanSelect(plan, isAnnual);
      return;
    }

    if (!isUserLoggedIn) {
      navigate({ to: plan === 'free' ? '/register' : '/login', search: { redirect: '/pricing' } });
      return;
    }

    if (plan === 'pro') {
      // This logic will be handled by the parent component or default to a checkout route
      navigate({ to: '/pricing' });
    }
  };

  return (
    <section className="w-full py-12">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold mb-4">
          <Sparkles className="h-3 w-3" />
          خطط الأسعار والاشتراكات
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
          اختر الخطة المناسبة لك
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          اختر الخطة المناسبة لك للوصول إلى أدوات الذكاء الاصطناعي والملخصات الشاملة في منصة المنارة
        </p>

        {/* Toggle Switch */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            شهري
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
              isAnnual ? 'bg-gold' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isAnnual ? '-translate-x-8' : '-translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            سنوي
            <span className="mr-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs">
              توفير 20%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4">
        {/* Free Plan Card */}
        <div className="bg-card border border-border rounded-3xl p-8 flex flex-col shadow-sm">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-foreground mb-2">الخطة المجانية</h3>
            <p className="text-sm text-muted-foreground">
              تصفح المحتوى الأساسي والبدء في تجربة المساعد الذكي
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-foreground">$0</span>
              <span className="text-muted-foreground">/ مجاناً</span>
            </div>
          </div>

          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3 text-sm">
              <Check className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>الوصول للملخصات الأساسية</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Check className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>تجربة المساعد الذكي لمبيعات/استفسارات محدودة</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Check className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>دعم فني عبر المجتمع</span>
            </li>
          </ul>

          <button
            onClick={() => handleAction('free')}
            disabled={isUserLoggedIn && userPlan === 'free'}
            className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${
              isUserLoggedIn && userPlan === 'free'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            {isUserLoggedIn && userPlan === 'free' ? 'الخطة الحالية' : 'ابدأ مجاناً'}
          </button>
        </div>

        {/* Pro Plan Card (Highlighted) */}
        <div className="relative bg-gradient-royal border-2 border-gold rounded-3xl p-8 flex flex-col shadow-luxury text-white">
          {/* Popular Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-gold text-royal-deep text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
            الأكثر شعبية
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold mb-2">الخطة الاحترافية (Pro)</h3>
              <Zap className="h-5 w-5 text-gold fill-gold" />
            </div>
            <p className="text-sm text-blue-100/80">
              أفضل خيار للطلاب والمستفيدين الراغبين في أقصى أداء
            </p>
            <div className="mt-6 flex flex-col">
              <span className="text-4xl font-extrabold">
                {isAnnual ? '$7.99' : '$9.99'}
              </span>
              <span className="text-sm text-blue-100/60">
                {isAnnual ? '/ شهرياً (تُدفع سنوياً)' : '/ شهرياً'}
              </span>
            </div>
          </div>

          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3 text-sm">
              <Check className="h-5 w-5 text-gold shrink-0" />
              <span>استخدام غير محدود للمساعد الذكي</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Check className="h-5 w-5 text-gold shrink-0" />
              <span>توليد ملخصات واختبارات تلقائية</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Check className="h-5 w-5 text-gold shrink-0" />
              <span>دعم فني مباشر وسريع</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Check className="h-5 w-5 text-gold shrink-0" />
              <span>أولوية في التحديثات والمميزات الجديدة</span>
            </li>
          </ul>

          <button
            onClick={() => handleAction('pro')}
            disabled={isUserLoggedIn && userPlan === 'pro'}
            className={`w-full py-3.5 px-6 rounded-xl font-bold transition-all shadow-md ${
              isUserLoggedIn && userPlan === 'pro'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default shadow-none'
                : 'bg-gold hover:bg-gold/90 text-royal-deep hover:shadow-gold/20 hover:shadow-lg'
            }`}
          >
            {isUserLoggedIn && userPlan === 'pro' ? 'الخطة الحالية' : 'اشترك الآن'}
          </button>
        </div>
      </div>
    </section>
  );
}
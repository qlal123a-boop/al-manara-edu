import { createFileRoute } from "@tanstack/react-router";
import { useAuthUser } from "@lib/use-auth";
import { useProfile } from "@lib/profile";
import PricingSection from "@/components/pricing-section";

export const Route = createFileRoute("/pricing")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "خطط الأسعار والاشتراكات — المنارة" },
      {
        name: "description",
        content: "اختر الخطة المناسبة لك للوصول إلى أدوات الذكاء الاصطناعي والملخصات الشاملة في منصة المنارة. خطط مرنة تناسب احتياجاتك.",
      },
      { property: "og:title", content: "خطط الأسعار والاشتراكات — المنارة" },
      { property: "og:description", content: "اختر الخطة المناسبة لك للوصول إلى أدوات الذكاء الاصطناعي والملخصات الشاملة في منصة المنارة." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function RouteComponent() {
  const { user } = useAuthUser();
  const { plan } = useProfile();

  return (
    <div className="min-h-screen bg-background py-16">
      <PricingSection 
        isUserLoggedIn={!!user} 
        userPlan={plan as 'free' | 'pro'} 
      />
      
      <div className="mx-auto mt-12 max-w-3xl text-center px-4">
        <p className="text-sm text-muted-foreground">
          جميع الخطط تشمل تحديثات مستمرة ودعم فني. يمكنك إلغاء الاشتراك أو تغييره في أي وقت من إعدادات الحساب.
          <br />
          تُطبق الشروط والأحكام الخاصة بمنصة المنارة.
        </p>
      </div>
    </div>
  );
}
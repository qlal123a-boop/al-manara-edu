import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Check, Loader2, Sparkles, UserRound, GraduationCap, Calendar, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/require-auth";
import { AVATAR_PRESETS, useProfile } from "@/lib/profile";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "أهلًا بك في المنارة — تهيئة الحساب" },
      { name: "description", content: "أكمل بياناتك الشخصية واختر خطتك للبدء." },
      { property: "og:title", content: "أهلًا بك في المنارة — تهيئة الحساب" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function OnboardingPage() {
  return (
    <RequireAuth title="أنشئ حسابك لبدء التهيئة">
      <OnboardingInner />
    </RequireAuth>
  );
}

async function toAvatarDataUrl(file: File): Promise<string> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image"));
      el.src = bitmapUrl;
    });
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    const side = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

function OnboardingInner() {
  const navigate = useNavigate();
  const { profile, update } = useProfile();
  
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string | null>(profile?.avatar_url ?? null);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploaded = selected?.startsWith("data:") ? selected : null;

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("الرجاء اختيار ملف صورة");
    try {
      setSelected(await toAvatarDataUrl(f));
      toast.success("تم اختيار صورتك الشخصية");
    } catch {
      toast.error("تعذّر معالجة الصورة");
    }
  };

  const submitProfile = async () => {
    if (!selected) return toast.error("اختر صورة رمزية أولًا");
    if (!name.trim()) return toast.error("يرجى كتابة اسمك");
    
    setSaving(true);
    try {
      await update.mutateAsync({ avatar_url: selected, display_name: name.trim() });
      navigate({ to: "/pricing" });
    } catch {
      toast.error("تعذّر حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 w-10 rounded-full transition-all ${step >= i ? "bg-gold shadow-gold" : "bg-muted"}`} 
              />
            ))}
          </div>
          <h1 className="text-3xl font-extrabold md:text-4xl">
            {step === 1 ? "لنبدأ بتجهيز ملفك" : "اكتملت الخطوة الأولى"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {step === 1 
              ? "اختر اسمك وصورتك لنميزك في منصة المنارة"
              : "أحسنت! الآن سننتقل لاختيار الخطة المناسبة لك"}
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-gold/30 bg-card p-5 shadow-luxury md:p-8">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-extrabold">الاسم الظاهر</label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                    className="w-full bg-transparent py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-extrabold">اختر صورتك الرمزية</h2>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {AVATAR_PRESETS.map((p) => {
                    const value = `preset:${p.id}`;
                    const active = selected === value;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelected(value)}
                        className={`relative aspect-square grid place-items-center rounded-2xl bg-gradient-to-br ${p.ring} text-3xl transition-smooth hover:scale-105 ${active ? "ring-4 ring-gold" : "ring-1 ring-border"}`}
                      >
                        <span>{p.emoji}</span>
                        {active && (
                          <span className="absolute -top-1 -end-1 grid h-6 w-6 place-items-center rounded-full bg-gradient-royal text-gold shadow-sm">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gold/40 p-5 sm:flex-row">
                <div className="flex items-center gap-3">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-secondary">
                    {uploaded ? (
                      <img src={uploaded} alt="Uploaded" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">أو ارفع صورتك الخاصة</div>
                    <div className="text-xs text-muted-foreground">JPG/PNG - مربع 256px</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="ms-auto rounded-xl border border-gold/50 px-4 py-2 text-xs font-extrabold text-gold hover:bg-gold/10"
                >
                  رفع صورة
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </div>

              <button
                onClick={submitProfile}
                disabled={saving || !selected || !name.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 text-sm font-extrabold shadow-gold transition-smooth hover:scale-[1.01] disabled:opacity-50"
                style={{ color: "var(--royal-deep)" }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                متابعة لاختيار الخطة
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Check className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold">رائع، تم حفظ بياناتك!</h2>
              <p className="mt-2 text-muted-foreground">لننتقل الآن لتحديد الخطة التعليمية التي تناسبك.</p>
              
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-royal py-4 text-sm font-extrabold text-gold shadow-luxury"
                >
                  تصفح الخطط والأسعار
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <button onClick={prevStep} className="text-xs font-bold text-muted-foreground hover:text-foreground">
                  تعديل البيانات السابقة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Check, Loader2, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/require-auth";
import { AVATAR_PRESETS, useProfile } from "@/lib/profile";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "أهلًا بك في المنارة — اختر صورتك" },
      { name: "description", content: "اختر صورتك الرمزية واسمك الظاهر لبدء رحلتك التعليمية في منصة المنارة." },
      { property: "og:title", content: "أهلًا بك في المنارة — اختر صورتك" },
      { property: "og:description", content: "خطوة سريعة لتخصيص حسابك قبل اختيار خطة الاشتراك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

/** Downscale any uploaded image to a 256px square data URL (no storage bucket needed). */
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
  const [selected, setSelected] = useState<string | null>(profile?.avatar_url ?? null);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploaded = selected?.startsWith("data:") ? selected : null;

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("الرجاء اختيار ملف صورة");
    if (f.size > 6_000_000) return toast.error("حجم الصورة كبير — اختر صورة أصغر من 6 ميغابايت");
    try {
      setSelected(await toAvatarDataUrl(f));
      toast.success("تم اختيار صورتك");
    } catch {
      toast.error("تعذّر قراءة الصورة، جرّب صورة أخرى");
    }
  };

  const submit = async () => {
    if (!selected) return toast.error("اختر صورة رمزية أولًا");
    setSaving(true);
    try {
      await update.mutateAsync({ avatar_url: selected, display_name: name.trim() || null });
      navigate({ to: "/pricing" });
    } catch {
      toast.error("تعذّر حفظ البيانات، حاول مجددًا");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold">
            <Sparkles className="h-3.5 w-3.5" /> الخطوة ١ من ٢
          </span>
          <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">أهلًا بك في المنارة التعليمية</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            اختر صورتك الرمزية واسمك الظاهر — ستظهر في شهاداتك ولوحة تقدّمك.
          </p>
          <div className="gold-divider mx-auto mt-4 w-24" />
        </div>

        <div className="mt-8 rounded-3xl border border-gold/30 bg-card p-5 shadow-luxury md:p-8">
          <label className="block text-sm font-extrabold">الاسم الظاهر</label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-background px-3">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: عبد الهادي"
              maxLength={40}
              className="w-full bg-transparent py-3 text-sm outline-none"
            />
          </div>

          <h2 className="mt-7 text-sm font-extrabold">اختر صورتك الرمزية</h2>
          <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {AVATAR_PRESETS.map((p) => {
              const value = `preset:${p.id}`;
              const active = selected === value;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(value)}
                  title={p.label}
                  aria-label={p.label}
                  aria-pressed={active}
                  className={`relative grid aspect-square place-items-center rounded-2xl bg-gradient-to-br ${p.ring} text-3xl transition-smooth hover:scale-105 ${
                    active ? "ring-4 ring-gold" : "ring-1 ring-border"
                  }`}
                >
                  <span>{p.emoji}</span>
                  {active && (
                    <span className="absolute -top-1 -end-1 grid h-6 w-6 place-items-center rounded-full bg-gradient-royal text-gold">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gold/40 p-5 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-secondary">
                {uploaded ? (
                  <img src={uploaded} alt="صورتك المرفوعة" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-center sm:text-start">
                <div className="text-sm font-extrabold">أو ارفع صورتك الشخصية</div>
                <div className="text-xs text-muted-foreground">JPG / PNG — تُقصّ تلقائيًا لمربع 256px</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-gold/50 px-4 py-2.5 text-xs font-extrabold text-gold transition-smooth hover:bg-gold/10"
            >
              اختيار صورة من الجهاز
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={submit}
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3.5 text-sm font-extrabold shadow-gold transition-smooth hover:scale-[1.01] disabled:opacity-60"
              style={{ color: "var(--royal-deep)" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              متابعة إلى اختيار الخطة
            </button>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3.5 text-sm font-bold text-muted-foreground transition-smooth hover:border-gold hover:text-foreground"
            >
              تخطّي الآن
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { BookOpen, Sparkles, Lock, Crown } from "lucide-react";
import { useVersesList } from "@/components/quranic-verses";
import { useQuotes } from "@/lib/storage";
import { useProfile } from "@/lib/profile";
import { Link } from "@tanstack/react-router";

/**
 * Premium glassmorphism banner that alternates between a Quranic verse
 * (calligraphy font) and an inspirational quote. 
 * Now tailored to the user's subscription tier: 
 * - Pro: Full access to all slides.
 * - Free: Shows only the first 2 samples with a call to upgrade.
 */
export function PremiumVersesBar() {
  const { plan } = useProfile();
  const isPro = plan === "pro";
  const verses = useVersesList();
  const { items: quotes } = useQuotes();
  const [i, setI] = useState(0);

  const allSlides = [
    ...verses.map((v) => ({ kind: "verse" as const, text: v })),
    ...quotes.map((q) => ({ kind: "quote" as const, text: q })),
  ];

  // Limit content for free users to encourage subscription
  const slides = isPro ? allSlides : allSlides.slice(0, 2);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;
  const slide = slides[i % slides.length];
  const isVerse = slide.kind === "verse";

  return (
    <div className="relative">
      <div
        className={`relative overflow-hidden rounded-2xl px-4 py-4 md:rounded-3xl md:px-8 md:py-6 transition-smooth ${
          isPro ? "glass-gold border-gold/30" : "bg-secondary/40 border-border border"
        }`}
        aria-live="polite"
      >
        {/* Decorative blobs - only visible for Pro or more intense for Pro */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
        {isPro && (
          <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
        )}

        <div className="relative flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold backdrop-blur ${
              isPro 
                ? "border-gold/50 bg-white/40 text-royal-deep"
                : "border-border bg-background/50 text-muted-foreground"
            }`}>
              {isVerse ? <BookOpen className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isVerse ? "آية اليوم" : "اقتباس ملهم"}
            </span>
            
            {!isPro && (
              <Link 
                to="/pricing"
                className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold hover:bg-gold/20"
              >
                <Lock className="h-3 w-3" />
                تفعيل النسخة الكاملة
              </Link>
            )}
            {isPro && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <Crown className="h-3 w-3" />
                باقة بلس
              </span>
            )}
          </div>

          <p
            key={`${slide.kind}-${i}`}
            dir="rtl"
            className={`animate-fade-in leading-loose ${
              isPro ? "text-royal-deep" : "text-foreground/80"
            } ${isVerse ? "font-quran font-bold" : "font-extrabold"}`}
            style={{ fontSize: isVerse ? "clamp(1.05rem, 2.6vw, 1.9rem)" : "clamp(0.95rem, 2vw, 1.4rem)" }}
          >
            {isVerse ? `﴿ ${slide.text} ﴾` : `« ${slide.text} »`}
          </p>

          <div className="mt-1 flex items-center gap-1.5">
            {slides.map((_, n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full transition-smooth ${
                  n === i % slides.length 
                    ? (isPro ? "w-6 bg-gold" : "w-6 bg-muted-foreground") 
                    : (isPro ? "w-1.5 bg-royal-deep/20" : "w-1.5 bg-border")
                }`}
              />
            ))}
          </div>

          {!isPro && slides.length > 0 && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              هذه عينة محدودة. اشترك في <span className="font-bold text-gold">منارة بلس</span> للحصول على محتوى متجدد يومياً.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
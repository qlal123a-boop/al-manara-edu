import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, GraduationCap, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { QuotesTicker } from "./quotes-ticker";
import { useI18n } from "@/lib/i18n";
import { academicYear, clockTime, fullDate, hijriDate } from "@/lib/date-utils";

const LINKS = {
  المنصة: [
    { to: "/grades" as const, label: "الصفوف المدرسية" },
    { to: "/library" as const, label: "المكتبة الإلكترونية" },
    { to: "/courses" as const, label: "الكورسات" },
    { to: "/store" as const, label: "متجر كنز المنارة" },
  ],
  "أدوات ذكية": [
    { to: "/tutor" as const, label: "روبوت المنارة" },
    { to: "/summaries" as const, label: "الملخصات" },
    { to: "/worksheets" as const, label: "أوراق العمل" },
    { to: "/quiz-generator" as const, label: "مولّد الاختبارات" },
  ],
  المنارة: [
    { to: "/about" as const, label: "من نحن" },
    { to: "/moderator-request" as const, label: "انضم كمشرف" },
    { to: "/schedule" as const, label: "الجدول المدرسي" },
    { to: "/admin" as const, label: "لوحة الإدارة" },
  ],
};

/** Live date/day strip — rendered after hydration to avoid SSR time mismatch. */
function FooterDateStrip() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <div className="h-10" aria-hidden />;
  const hijri = hijriDate(now);
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-gold/25 bg-white/5 p-3 text-xs font-semibold sm:grid-cols-4">
      {[
        { icon: CalendarDays, value: fullDate(now, "ar") },
        { icon: Moon, value: hijri || "—" },
        { icon: Clock, value: clockTime(now, "ar") },
        { icon: GraduationCap, value: `العام الدراسي ${academicYear(now).label}` },
      ].map(({ icon: Icon, value }) => (
        <span key={value} className="flex items-center justify-center gap-2 text-center text-primary-foreground/85">
          <Icon className="h-4 w-4 shrink-0 text-gold" aria-hidden />
          <span className="truncate">{value}</span>
        </span>
      ))}
    </div>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-16">
      <QuotesTicker />
      <div className="text-primary-foreground" style={{ backgroundColor: "var(--royal-deep)" }}>
        <div className="page-shell py-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr_repeat(3,1fr)]">
            <div>
              <p className="text-lg font-extrabold text-gold">المنارة التعليمية</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-primary-foreground/70">
                منصة فلسطينية مجانية تجمع الملخصات وأوراق العمل والدروس المرئية والأدوات الذكية في مكان واحد.
              </p>
            </div>
            {Object.entries(LINKS).map(([group, links]) => (
              <nav key={group} aria-label={group}>
                <p className="mb-3 text-sm font-extrabold text-gold/90">{group}</p>
                <ul className="space-y-2 text-xs text-primary-foreground/75">
                  {links.map((l) => (
                    <li key={l.to + l.label}>
                      <Link to={l.to} className="transition-colors hover:text-gold">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-8">
            <FooterDateStrip />
          </div>

          <div className="mt-6 border-t border-gold/20 pt-4 text-center text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} {t("footer.rights")}
          </div>
        </div>
      </div>
    </footer>
  );
}

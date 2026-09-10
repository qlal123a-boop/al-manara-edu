import { usePublicSections } from "@/lib/admin-sections";
import { Crown, Sparkles } from "lucide-react";

/**
 * Renders the admin-authored sections that were explicitly switched to
 * "visible on the public site". Internal-only sections never reach this list
 * (filtered in the query AND by row-level security).
 */
export function PublicSections() {
  const { items } = usePublicSections();
  if (!items.length) return null;

  return (
    <section className="bg-secondary/40 section-y">
      <div className="page-shell">
        <div className="mb-8">
          <p className="pill bg-gold/20 text-royal-deep">من إدارة المنارة</p>
          <h2 className="section-title mt-3">أقسام وإعلانات</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((s) => (
            <article key={s.id} className="surface-card group relative overflow-hidden">
              {/* Premium Badge for restricted content (if logic applies) or visual cue */}
              <div className="absolute start-4 top-4 z-10 flex gap-2">
                {s.content.includes("بلس") || s.title.includes("بلس") ? (
                  <span className="flex items-center gap-1 rounded-full bg-gradient-royal px-2.5 py-1 text-[10px] font-bold text-gold shadow-luxury">
                    <Crown className="h-3 w-3" />
                    باقة بلس
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
                    <Sparkles className="h-3 w-3" />
                    عام
                  </span>
                )}
              </div>

              {s.image_url && (
                <div className="relative h-44 w-full overflow-hidden">
                  <img 
                    src={s.image_url} 
                    alt={s.title} 
                    loading="lazy" 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-extrabold text-royal-deep group-hover:text-gold transition-colors">{s.title}</h3>
                <p className="card-desc mt-2 whitespace-pre-wrap">{s.content}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
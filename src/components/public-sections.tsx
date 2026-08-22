import { usePublicSections } from "@/lib/admin-sections";

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
            <article key={s.id} className="surface-card overflow-hidden">
              {s.image_url && (
                <img src={s.image_url} alt={s.title} loading="lazy" className="h-44 w-full object-cover" />
              )}
              <div className="p-6">
                <h3 className="text-lg font-extrabold text-royal-deep">{s.title}</h3>
                <p className="card-desc mt-2 whitespace-pre-wrap">{s.content}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, UserX, Trash2, Save, Quote as QuoteIcon, Users, MessageSquare, Settings, Sparkles, PaintBucket, BookOpen, UserCircle2, Ghost, Wand2, Link2, FileText, GraduationCap, Award, ArrowUp, ArrowDown, ShoppingBag, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, signOut } from "@/lib/use-auth";
import { useFeatureToggles, useBrand, useVisitorCount, useRegisteredUserCount, useUsersWithRoles, setUserRole, DEFAULT_TOGGLES, DEFAULT_BRAND, type FeatureToggles, type BrandSettings } from "@/lib/site-settings";

import { useServerFn } from "@tanstack/react-start";
import { aiFetchPlaylist, aiClassifyVideos, aiScrapeWorksheets, aiImportCourse, aiImportBooks } from "@/lib/ai-import.functions";
import { GRADES, subjectsForGrade } from "@/lib/curriculum";
import { useCustomSubjects } from "@/lib/use-custom-subjects";
import { COURSE_CATEGORY_LABELS } from "@/lib/certificate-theme";
import { SubscriptionRequestsTab, PlansAdminTab, PromptStudioTab } from "@/components/subscriptions-admin";
import { AdminSectionsTab } from "@/components/admin-sections-tab";

export const Route = createFileRoute("/admin-panel")({
  component: AdminPanelPage,
  head: () => ({
    meta: [
      { title: "لوحة التحكم — المنارة" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "إدارة الاشتراكات، المحتوى، والذكاء الاصطناعي للمنصة." }
    ]
  }),
});

type ModRow = {
  id: number;
  full_name: string;
  email: string;
  goal: string | null;
  status: string | null;
  created_at: string | null;
  user_id: string | null;
};

function AdminPanelPage() {
  const { user, loading, isSuperAdmin } = useAuthUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading) return <div className="p-12 text-center text-muted-foreground">جارٍ التحقق...</div>;
  if (!user) return null;

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-3 text-2xl font-extrabold">غير مصرّح</h1>
        <p className="mt-2 text-sm text-muted-foreground">لوحة التحكم متاحة فقط للمسؤول الأعلى.</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-gradient-royal px-5 py-2.5 text-sm font-bold text-gold">العودة</Link>
      </div>
    );
  }
  return <Dashboard />;
}

function Dashboard() {
  const [tab, setTab] = useState<"stats" | "ai" | "courses" | "subjects" | "library" | "store" | "mods" | "subs" | "plans" | "prompts" | "sections" | "quotes" | "quran" | "features" | "brand" | "settings">("stats");

  const navigate = useNavigate();

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-[260px_1fr] md:px-5 md:py-10">
      {/* Sidebar Navigation */}
      <aside className="glass h-fit rounded-2xl p-4 md:sticky md:top-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-royal-deep">
          <Wand2 className="h-4 w-4 text-gold" /> مركز التحكّم الذكي
        </div>
        <nav className="flex flex-col gap-1">
          {([
            ["stats", "الإحصائيات", Users],
            ["ai", "المساعد الذكي", Wand2],
            ["courses", "إدارة الكورسات", GraduationCap],
            ["subjects", "إدارة المواد", BookOpen],
            ["library", "المكتبة", BookOpen],
            ["store", "متجر النقاط", ShoppingBag],
            ["mods", "طلبات المشرفين", MessageSquare],
            ["subs", "إدارة الاشتراكات", Award],
            ["plans", "الخطط والمزايا", Sparkles],
            ["prompts", "مولّد الأوامر", Wand2],
            ["sections", "أقسام الموقع", FileText],
            ["quotes", "الاقتباسات", QuoteIcon],
            ["quran", "الآيات القرآنية", BookOpen],
            ["features", "الميزات", Sparkles],
            ["brand", "العلامة", PaintBucket],
            ["settings", "إعدادات أخرى", Settings],
          ] as const).map(([t, label, Icon]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-smooth ${
                tab === t ? "bg-gradient-royal text-gold shadow-luxury" : "text-royal-deep/80 hover:bg-white/40"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>
        <div className="mt-4 border-t border-border pt-3">
          <Link to="/admin" className="block rounded-lg bg-gradient-gold px-3 py-2 text-center text-xs font-bold shadow-gold" style={{ color: "var(--royal-deep)" }}>
            إدارة المحتوى
          </Link>
          <button
            onClick={async () => { await signOut(); toast.success("تم تسجيل الخروج"); navigate({ to: "/" }); }}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-xs font-bold hover:border-destructive hover:text-destructive"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div>
        <header className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold md:text-3xl">
            <ShieldCheck className="h-6 w-6 text-gold md:h-7 md:w-7" /> لوحة التحكم
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">إدارة الاشتراكات والمستخدمين وخصائص الذكاء الاصطناعي</p>
        </header>

        {tab === "stats" && <StatsTab />}
        {tab === "ai" && <AICommandTab />}
        {tab === "courses" && <CoursesAdminTab />}
        {tab === "subjects" && <SubjectsAdminTab />}
        {tab === "library" && <LibraryAdminTab />}
        {tab === "store" && <StoreAdminTab />}
        {tab === "mods" && <ModsTab />}
        {tab === "subs" && <SubscriptionRequestsTab />}
        {tab === "plans" && <PlansAdminTab />}
        {tab === "prompts" && <PromptStudioTab />}
        {tab === "sections" && <AdminSectionsTab />}
        {tab === "quotes" && <QuotesTab />}
        {tab === "quran" && <QuranTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "features" && <FeaturesTab />}
        {tab === "brand" && <BrandTab />}
      </div>
    </div>
  );
}

/** AI Command Center — Tabs for automated importing */
function AICommandTab() {
  const [tab, setTab] = useState<"yt" | "course" | "ws" | "sum" | "books">("yt");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab("yt")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "yt" ? "bg-gradient-royal text-gold shadow-luxury" : "border border-border"}`}>
          استيراد دروس (يوتيوب)
        </button>
        <button onClick={() => setTab("course")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "course" ? "bg-gradient-royal text-gold shadow-luxury" : "border border-border"}`}>
          استيراد كورس كامل
        </button>
        <button onClick={() => setTab("ws")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "ws" ? "bg-gradient-royal text-gold shadow-luxury" : "border border-border"}`}>
          أوراق العمل
        </button>
        <button onClick={() => setTab("sum")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "sum" ? "bg-gradient-royal text-gold shadow-luxury" : "border border-border"}`}>
          الملخصات
        </button>
        <button onClick={() => setTab("books")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "books" ? "bg-gradient-royal text-gold shadow-luxury" : "border border-border"}`}>
          كتب المكتبة
        </button>
      </div>
      {tab === "yt" ? <PlaylistImporter />
        : tab === "course" ? <CourseImporter />
        : tab === "ws" ? <WorksheetsScraper kind="worksheet" />
        : tab === "sum" ? <WorksheetsScraper kind="summary" />
        : <BooksImporter />}
    </div>
  );
}

/** ... placeholders for other admin sub-components would follow ... */

function StatsTab() { return <div className="p-8 text-center text-muted-foreground">تبويب الإحصائيات (قيد التطوير)</div>; }
function CoursesAdminTab() { return <div className="p-8 text-center text-muted-foreground">إدارة الكورسات (قيد التطوير)</div>; }
function SubjectsAdminTab() { return <div className="p-8 text-center text-muted-foreground">إدارة المواد (قيد التطوير)</div>; }
function LibraryAdminTab() { return <div className="p-8 text-center text-muted-foreground">إدارة المكتبة (قيد التطوير)</div>; }
function StoreAdminTab() { return <div className="p-8 text-center text-muted-foreground">إدارة المتجر (قيد التطوير)</div>; }
function ModsTab() { return <div className="p-8 text-center text-muted-foreground">إدارة طلبات المشرفين (قيد التطوير)</div>; }
function QuotesTab() { return <div className="p-8 text-center text-muted-foreground">إدارة الاقتباسات (قيد التطوير)</div>; }
function QuranTab() { return <div className="p-8 text-center text-muted-foreground">إدارة الآيات (قيد التطوير)</div>; }
function SettingsTab() { return <div className="p-8 text-center text-muted-foreground">الإعدادات العامة (قيد التطوير)</div>; }
function FeaturesTab() { return <div className="p-8 text-center text-muted-foreground">إدارة المزايا (قيد التطوير)</div>; }
function BrandTab() { return <div className="p-8 text-center text-muted-foreground">إدارة الهوية (قيد التطوير)</div>; }

/** Sub-logic for AI importers follows as defined in the request context... */

function PlaylistImporter() { return <div className="p-8 border border-dashed rounded-2xl text-center">مكون استيراد اليوتيوب الذكي</div>; }
function CourseImporter() { return <div className="p-8 border border-dashed rounded-2xl text-center">مكون استيراد الكورسات الذكي</div>; }
function BooksImporter() { return <div className="p-8 border border-dashed rounded-2xl text-center">مكون استيراد الكتب الذكي</div>; }
function WorksheetsScraper({ kind }: { kind: string }) { return <div className="p-8 border border-dashed rounded-2xl text-center">مكون سحب {kind === 'summary' ? 'الملخصات' : 'أوراق العمل'} الذكي</div>; }
function GradeSubjectPicker({ gradeId, subject, onChange }: any) { return null; }
import { useEffect, useState } from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const SUPER_ADMIN_EMAIL = "qlal123a@gmail.com";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isSuperAdmin = !!user && user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
  return { user, loading, isSuperAdmin };
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * دالة مساعدة لمعالجة رسائل خطأ سوبابيس وتحويلها للعربية الفصحى
 */
export function getAuthErrorMessage(err: unknown): string {
  if (!err) return "حدث خطأ غير متوقع.";
  
  const message = (err as AuthError)?.message?.toLowerCase() || "";
  
  if (message.includes("invalid login")) return "البريد أو كلمة المرور غير صحيحة. تأكّد منها أو أنشئ حسابًا جديدًا.";
  if (message.includes("email not confirmed")) return "لم تؤكّد بريدك بعد. افتح صندوق الوارد واضغط رابط التفعيل ثم سجّل الدخول.";
  if (message.includes("user already registered")) return "هذا البريد مسجَّل مسبقًا. سجّل الدخول مباشرة.";
  if (message.includes("password should be")) return "كلمة المرور ضعيفة — استخدم 8 أحرف فأكثر مع رموز.";
  if (message.includes("rate limit")) return "محاولات كثيرة جدًا — انتظر دقيقة ثم حاول مجددًا.";
  if (message.includes("invalid email")) return "صيغة البريد الإلكتروني غير صحيحة.";
  if (message.includes("network")) return "تعذّر الاتصال بالخادم — تحقّق من اتصال الإنترنت.";
  if (message.includes("signup is disabled")) return "التسجيل معطل حالياً، حاول لاحقاً.";
  
  return "حدث خطأ أثناء المعالجة. حاول مرة أخرى أو تواصل مع الدعم.";
}
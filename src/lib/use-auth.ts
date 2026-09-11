import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const SUPER_ADMIN_EMAIL = "qlal123a@gmail.com";

/**
 * تحويل رسائل خطأ Supabase إلى اللغة العربية بشكل مفهوم للمستخدم.
 */
export function translateAuthError(message: string): string {
  const s = message.toLowerCase();
  console.error("[Auth Error Log]:", message);

  if (s.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (s.includes("email not confirmed")) return "لم يتم تأكيد بريدك الإلكتروني بعد. يرجى مراجعة صندوق الوارد.";
  if (s.includes("user already registered")) return "هذا البريد الإلكتروني مسجل بالفعل. حاول تسجيل الدخول.";
  if (s.includes("password should be")) return "كلمة المرور ضعيفة جداً. يجب أن تتكون من 8 أحرف على الأقل.";
  if (s.includes("rate limit")) return "محاولات كثيرة جداً. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.";
  if (s.includes("invalid email")) return "صيغة البريد الإلكتروني غير صحيحة.";
  if (s.includes("network")) return "خطأ في الاتصال بالشبكة. تأكد من اتصالك بالإنترنت.";
  
  return "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";
}

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
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("SignOut Error:", error.message);
    throw new Error(translateAuthError(error.message));
  }
}
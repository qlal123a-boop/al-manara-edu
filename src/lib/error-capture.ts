// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

/**
 * سجل الأخطاء الشائعة من Supabase وترجمتها للعربية
 */
export const AUTH_ERRORS_MAP: Record<string, string> = {
  "invalid login credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.",
  "email not confirmed": "لم يتم تأكيد بريدك الإلكتروني بعد. يرجى التحقق من الرسائل الواردة وتفعيل الحساب.",
  "user already registered": "هذا البريد الإلكتروني مسجل بالفعل. حاول تسجيل الدخول بدلاً من ذلك.",
  "password should be at least 6 characters": "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
  "password should be at least 8 characters": "كلمة المرور ضعيفة. يرجى استخدام 8 أحرف أو أكثر لزيادة الأمان.",
  "invalid email": "صيغة البريد الإلكتروني غير صحيحة.",
  "rate limit exceeded": "محاولات كثيرة جداً. يرجى الانتظار دقيقة قبل المحاولة مرة أخرى.",
  "network error": "خطأ في الاتصال بالشبكة. يرجى التحقق من جودة الإنترنت لديك.",
  "signup requires email confirmation": "تم إنشاء الحساب، ولكن يجب عليك تفعيله من بريدك الإلكتروني أولاً.",
  "user not found": "المستخدم غير موجود.",
};

/**
 * دالة لتحويل رسائل الخطأ الإنجليزية من الواجهة الخلفية إلى العربية
 */
export function translateError(error: unknown): string {
  if (!error) return "حدث خطأ غير متوقع.";
  
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  // ابحث عن تطابق في القاموس
  const entry = Object.entries(AUTH_ERRORS_MAP).find(([key]) => 
    lowerMessage.includes(key)
  );

  if (entry) return entry[1];

  // إذا كان الخطأ غير معروف، اطبع الأصل في الكونسول للمطورين
  console.error("[Auth Error Log]:", message);
  return "حدث خطأ، حاول مرة أخرى.";
}

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Send, Loader2, Info, Calculator, User, GraduationCap, Calendar } from "lucide-react";
import { createProRequest, buildWhatsAppLink } from "@/lib/plans";
import { useAuthUser } from "@/lib/use-auth";
import { GRADES } from "@/lib/curriculum";

interface SubscriptionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PRICE_PER_MONTH = 3; // 3 شيكل شهرياً
const ADMIN_PHONE = "970590000000"; // سيتم جلبها من الإعدادات لاحقاً

export function SubscriptionForm({ onSuccess, onCancel }: SubscriptionFormProps) {
  const { user } = useAuthUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || "",
    grade: "",
    duration: "1",
    note: "",
  });

  const totalPrice = useMemo(() => {
    return Number(formData.duration) * PRICE_PER_MONTH;
  }, [formData.duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("يجب تسجيل الدخول أولاً");
    if (!formData.grade) return toast.error("يرجى اختيار الصف الدراسي");

    setLoading(true);
    try {
      const { error } = await createProRequest({
        user_id: user.id,
        email: user.email || "",
        display_name: formData.fullName,
        grade: formData.grade,
        age: null,
        note: `المدة: ${formData.duration} شهر - السعر: ${totalPrice} شيكل. ${formData.note}`,
      });

      if (error) throw error;

      const message = `مرحباً إدارة المنارة، أود الاشتراك في الخطة المدفوعة (Pro):\n\n` +
        `👤 الاسم: ${formData.fullName}\n` +
        `📚 الصف: ${formData.grade}\n` +
        `⏳ مدة الاشتراك: ${formData.duration} شهر\n` +
        `💰 المبلغ المستحق: ${totalPrice} شيكل\n` +
        `📧 البريد: ${user.email}\n` +
        (formData.note ? `📝 ملاحظات: ${formData.note}` : "");

      const waLink = buildWhatsAppLink(ADMIN_PHONE, message);
      
      toast.success("تم حفظ طلبك، يرجى إتمام العملية عبر الواتساب");
      window.open(waLink, "_blank");
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error("حدث خطأ أثناء إرسال الطلب: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl border border-border bg-card p-6 shadow-luxury-gold sm:p-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-black text-royal-deep">طلب اشتراك جديد</h2>
        <p className="text-sm text-muted-foreground mt-1">املأ البيانات التالية لتفعيل حساب Pro الخاص بك</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold">
            <User className="h-4 w-4 text-gold" /> الاسم الكامل
          </label>
          <input
            required
            className="input-field w-full"
            placeholder="أدخل اسمك كما تحب أن يظهر"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold">
            <GraduationCap className="h-4 w-4 text-gold" /> الصف الدراسي
          </label>
          <select
            required
            className="input-field w-full"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          >
            <option value="">اختر الصف...</option>
            {GRADES.map((g) => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold">
            <Calendar className="h-4 w-4 text-gold" /> مدة الاشتراك
          </label>
          <select
            className="input-field w-full"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          >
            <option value="1">شهر واحد</option>
            <option value="3">3 أشهر (خصم بسيط)</option>
            <option value="6">6 أشهر</option>
            <option value="12">سنة كاملة</option>
          </select>
        </div>

        <div className="rounded-2xl bg-secondary/30 p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold">
              <Calculator className="h-4 w-4 text-gold" /> السعر الإجمالي
            </div>
            <div className="text-xl font-black text-emerald-600">
              {totalPrice} <span className="text-xs">شيكل</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" /> يتم الدفع عن طريق التحويل البنكي أو المحافظ الإلكترونية بعد التواصل.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold">ملاحظات إضافية (اختياري)</label>
          <textarea
            className="input-field min-h-[80px] w-full py-3"
            placeholder="أي تفاصيل إضافية تود إخبارنا بها..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 font-black text-royal-deep shadow-gold transition-smooth hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            إرسال الطلب عبر الواتساب
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
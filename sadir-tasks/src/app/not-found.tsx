import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6" dir="rtl">
      <p className="text-6xl font-bold text-primary/20 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">الصفحة غير موجودة</h1>
      <p className="text-gray-500 mb-8">لم نتمكن من إيجاد الصفحة التي تبحث عنها.</p>
      <Link href="/dashboard">
        <Button>العودة للرئيسية</Button>
      </Link>
    </div>
  );
}

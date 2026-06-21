# سدير مهام — منصة إدارة المشاريع والمهام الداخلية

منصة ويب داخلية عربية RTL لإدارة وإصدار وتتبع المهام والمشاريع.

---

## المتطلبات

- Node.js 18+
- PostgreSQL 14+
- حساب SMTP لإرسال البريد الإلكتروني

---

## التشغيل

### 1. نسخ المشروع وتثبيت الحزم

```bash
cd sadir-tasks
npm install
```

### 2. إعداد المتغيرات البيئية

```bash
cp .env.example .env.local
```

عدّل `.env.local` وضع البيانات الصحيحة:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sadir_tasks"
NEXTAUTH_SECRET="مفتاح-سري-طويل-وعشوائي"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASS="app-password"
SMTP_FROM="سدير مهام <your@gmail.com>"
```

### 3. إعداد قاعدة البيانات

```bash
# إنشاء جداول قاعدة البيانات
npm run db:push

# إدراج البيانات الافتراضية (مدير النظام والقوالب)
npm run db:seed
```

### 4. تشغيل المشروع

```bash
npm run dev
```

افتح المتصفح على: http://localhost:3000

---

## بيانات الدخول الافتراضية

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير النظام | admin@sadir-tasks.com | Admin@2024 |
| مدير المشروع | pm@sadir-tasks.com | Manager@2024 |
| منفذ | exec@sadir-tasks.com | Exec@2024 |

---

## البنية التقنية

- **Next.js 15** App Router
- **TypeScript**
- **Tailwind CSS** + تصميم RTL عربي
- **Prisma ORM** + PostgreSQL
- **NextAuth** للمصادقة
- **Zod** للتحقق من البيانات
- **Nodemailer** للبريد الإلكتروني
- **shadcn/ui** مكونات مخصصة

---

## الميزات

- ✅ نظام أدوار كامل (مدير النظام / مدير المشروع / مشرف / منفذ / قارئ)
- ✅ إدارة المشاريع والأعضاء
- ✅ إنشاء المهام وحفظها كمسودة
- ✅ إصدار المهام مع إرسال إشعار بريدي
- ✅ حقول مخصصة (9 أنواع) بدون تعديل Schema
- ✅ قوالب مشاريع جاهزة (4 قوالب)
- ✅ تعليقات ومرفقات
- ✅ سجل نشاط تفصيلي
- ✅ لوحة تحكم حسب الدور
- ✅ تقارير وتصدير CSV
- ✅ واجهة عربية RTL كاملة

---

## الأوامر المتاحة

```bash
npm run dev         # تشغيل محلي
npm run build       # بناء الإنتاج
npm run db:push     # تحديث قاعدة البيانات
npm run db:seed     # إدراج البيانات الافتراضية
npm run db:studio   # فتح Prisma Studio
npm run db:reset    # إعادة ضبط قاعدة البيانات
```

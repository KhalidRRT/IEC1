import { PrismaClient, UserRole, ProjectStatus, CustomFieldType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء تهيئة قاعدة البيانات...");

  // إنشاء مدير النظام الافتراضي
  const hashedPassword = await bcrypt.hash("Admin@2024", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sadir-tasks.com" },
    update: {},
    create: {
      name: "مدير النظام",
      email: "admin@sadir-tasks.com",
      password: hashedPassword,
      role: UserRole.SYSTEM_ADMIN,
    },
  });

  console.log(`✅ تم إنشاء مدير النظام: ${admin.email}`);

  // إنشاء مستخدمين تجريبيين
  const projectManagerPassword = await bcrypt.hash("Manager@2024", 12);
  const projectManager = await prisma.user.upsert({
    where: { email: "pm@sadir-tasks.com" },
    update: {},
    create: {
      name: "مدير المشروع",
      email: "pm@sadir-tasks.com",
      password: projectManagerPassword,
      role: UserRole.PROJECT_MANAGER,
    },
  });

  const executorPassword = await bcrypt.hash("Exec@2024", 12);
  const executor = await prisma.user.upsert({
    where: { email: "exec@sadir-tasks.com" },
    update: {},
    create: {
      name: "المنفذ التجريبي",
      email: "exec@sadir-tasks.com",
      password: executorPassword,
      role: UserRole.EXECUTOR,
    },
  });

  console.log(`✅ تم إنشاء المستخدمين التجريبيين`);

  // ─── إنشاء قوالب المشاريع الافتراضية ─────────────────────────────

  // قالب إدارة المحتوى
  const contentTemplate = await prisma.projectTemplate.upsert({
    where: { id: "template-content" },
    update: {},
    create: {
      id: "template-content",
      name: "قالب إدارة المحتوى",
      description: "قالب مخصص لمشاريع إدارة المحتوى والنشر",
      isDefault: true,
      fields: {
        create: [
          { name: "نوع المحتوى", type: CustomFieldType.SINGLE_SELECT, order: 1, isFilterable: true, options: JSON.stringify(["مقال", "فيديو", "إنفوجرافيك", "بودكاست", "تغريدة"]) },
          { name: "المنصة", type: CustomFieldType.SINGLE_SELECT, order: 2, isFilterable: true, options: JSON.stringify(["تويتر", "لينكدإن", "إنستغرام", "يوتيوب", "موقع إلكتروني"]) },
          { name: "الكاتب", type: CustomFieldType.PERSON, order: 3 },
          { name: "المصمم", type: CustomFieldType.PERSON, order: 4 },
          { name: "حالة التصميم", type: CustomFieldType.SINGLE_SELECT, order: 5, options: JSON.stringify(["لم يبدأ", "قيد التصميم", "مكتمل", "بانتظار المراجعة"]) },
          { name: "تاريخ النشر", type: CustomFieldType.DATE, order: 6, isFilterable: true },
          { name: "رابط المنشور", type: CustomFieldType.URL, order: 7 },
          { name: "هل تم النشر؟", type: CustomFieldType.YES_NO, order: 8, isFilterable: true },
        ],
      },
    },
  });

  // قالب الهاكاثون
  const hackathonTemplate = await prisma.projectTemplate.upsert({
    where: { id: "template-hackathon" },
    update: {},
    create: {
      id: "template-hackathon",
      name: "قالب إدارة هاكاثون",
      description: "قالب مخصص لإدارة فعاليات الهاكاثون والمسابقات",
      isDefault: true,
      fields: {
        create: [
          { name: "اسم الفريق", type: CustomFieldType.SHORT_TEXT, order: 1, isRequired: true },
          { name: "قائد الفريق", type: CustomFieldType.PERSON, order: 2 },
          { name: "المرحلة", type: CustomFieldType.SINGLE_SELECT, order: 3, isFilterable: true, options: JSON.stringify(["التسجيل", "التطوير", "التقديم", "التحكيم", "الختام"]) },
          { name: "المرشد", type: CustomFieldType.PERSON, order: 4 },
          { name: "رابط العرض", type: CustomFieldType.URL, order: 5 },
          { name: "حالة العرض", type: CustomFieldType.SINGLE_SELECT, order: 6, options: JSON.stringify(["لم يُقدَّم", "قيد الإعداد", "مُقدَّم", "مقبول", "مرفوض"]) },
          { name: "تقييم الجاهزية", type: CustomFieldType.NUMBER, order: 7 },
          { name: "ملاحظات التحكيم", type: CustomFieldType.LONG_TEXT, order: 8, isExecutorEditable: false },
        ],
      },
    },
  });

  // قالب المشروع التقني
  const techTemplate = await prisma.projectTemplate.upsert({
    where: { id: "template-tech" },
    update: {},
    create: {
      id: "template-tech",
      name: "قالب مشروع تقني",
      description: "قالب مخصص للمشاريع التقنية والبرمجية",
      isDefault: true,
      fields: {
        create: [
          { name: "نوع المهمة", type: CustomFieldType.SINGLE_SELECT, order: 1, isFilterable: true, options: JSON.stringify(["ميزة جديدة", "إصلاح خطأ", "تحسين", "اختبار", "توثيق"]) },
          { name: "رابط GitHub", type: CustomFieldType.URL, order: 2 },
          { name: "البيئة", type: CustomFieldType.SINGLE_SELECT, order: 3, isFilterable: true, options: JSON.stringify(["تطوير", "اختبار", "إنتاج"]) },
          { name: "الأولوية التقنية", type: CustomFieldType.SINGLE_SELECT, order: 4, options: JSON.stringify(["P0", "P1", "P2", "P3"]) },
          { name: "حالة الاختبار", type: CustomFieldType.SINGLE_SELECT, order: 5, options: JSON.stringify(["لم يُختبر", "قيد الاختبار", "ناجح", "فاشل"]) },
          { name: "رقم الإصدار", type: CustomFieldType.SHORT_TEXT, order: 6 },
        ],
      },
    },
  });

  // قالب المبادرة أو البرنامج
  const initiativeTemplate = await prisma.projectTemplate.upsert({
    where: { id: "template-initiative" },
    update: {},
    create: {
      id: "template-initiative",
      name: "قالب مبادرة أو برنامج",
      description: "قالب مخصص للمبادرات والبرامج المجتمعية",
      isDefault: true,
      fields: {
        create: [
          { name: "المرحلة", type: CustomFieldType.SINGLE_SELECT, order: 1, isFilterable: true, options: JSON.stringify(["التخطيط", "التنفيذ", "المتابعة", "الإغلاق"]) },
          { name: "الجهة المستفيدة", type: CustomFieldType.SHORT_TEXT, order: 2 },
          { name: "عدد المستفيدين", type: CustomFieldType.NUMBER, order: 3 },
          { name: "تاريخ التنفيذ", type: CustomFieldType.DATE, order: 4, isFilterable: true },
          { name: "حالة التنسيق", type: CustomFieldType.SINGLE_SELECT, order: 5, options: JSON.stringify(["لم يبدأ", "قيد التنسيق", "مؤكد", "ملغى"]) },
          { name: "المرفقات الرسمية", type: CustomFieldType.YES_NO, order: 6 },
        ],
      },
    },
  });

  console.log(`✅ تم إنشاء ${4} قوالب مشاريع افتراضية`);

  // إنشاء مشروع تجريبي
  const demoProject = await prisma.project.upsert({
    where: { id: "demo-project" },
    update: {},
    create: {
      id: "demo-project",
      name: "مشروع تجريبي",
      description: "مشروع لاختبار المنصة والتعرف على مزاياها",
      status: ProjectStatus.ACTIVE,
      ownerId: admin.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      members: {
        create: [
          { userId: projectManager.id, role: UserRole.PROJECT_MANAGER },
          { userId: executor.id, role: UserRole.EXECUTOR },
        ],
      },
    },
  });

  console.log(`✅ تم إنشاء المشروع التجريبي`);

  console.log("\n🎉 تم إعداد قاعدة البيانات بنجاح!\n");
  console.log("═══════════════════════════════════════");
  console.log("📧 بيانات تسجيل الدخول:");
  console.log("───────────────────────────────────────");
  console.log("👑 مدير النظام:");
  console.log("   البريد: admin@sadir-tasks.com");
  console.log("   كلمة المرور: Admin@2024");
  console.log("───────────────────────────────────────");
  console.log("📋 مدير المشروع:");
  console.log("   البريد: pm@sadir-tasks.com");
  console.log("   كلمة المرور: Manager@2024");
  console.log("───────────────────────────────────────");
  console.log("⚙️  المنفذ:");
  console.log("   البريد: exec@sadir-tasks.com");
  console.log("   كلمة المرور: Exec@2024");
  console.log("═══════════════════════════════════════\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ خطأ في تهيئة قاعدة البيانات:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

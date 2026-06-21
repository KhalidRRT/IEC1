import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

interface TaskEmailData {
  taskId: string;
  taskTitle: string;
  projectName: string;
  priority: string;
  dueDate: Date | null;
  description: string | null;
  issuerName: string;
  assigneeName: string;
  assigneeEmail: string;
  taskUrl: string;
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "عالية",
  URGENT: "عاجلة",
};

function createTransporter() {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function buildTaskIssuedEmail(data: TaskEmailData): string {
  const priorityLabel = PRIORITY_LABELS[data.priority] || data.priority;
  const dueDateText = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "غير محدد";

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مهمة جديدة - سدير مهام</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; direction: rtl; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3d4ee6 0%, #2f3ccb 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .header p { color: #c7d5fe; font-size: 14px; }
    .body { padding: 32px 24px; }
    .greeting { font-size: 18px; color: #1a1f52; font-weight: 600; margin-bottom: 16px; }
    .intro { color: #4b5563; font-size: 14px; line-height: 1.8; margin-bottom: 24px; }
    .task-card { background: #f8faff; border: 1px solid #c7d5fe; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
    .task-title { font-size: 18px; font-weight: 700; color: #2933a4; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #e0e9ff; }
    .field-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .field-label { color: #6b7280; font-size: 13px; width: 130px; flex-shrink: 0; padding-top: 2px; }
    .field-value { color: #111827; font-size: 14px; font-weight: 500; flex: 1; }
    .priority-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .priority-URGENT { background: #fee2e2; color: #991b1b; }
    .priority-HIGH { background: #ffedd5; color: #9a3412; }
    .priority-MEDIUM { background: #fef9c3; color: #854d0e; }
    .priority-LOW { background: #dcfce7; color: #166534; }
    .description-box { background: #f9fafb; border-right: 3px solid #3d4ee6; border-radius: 4px; padding: 12px 16px; margin-top: 12px; color: #374151; font-size: 14px; line-height: 1.8; }
    .cta-section { text-align: center; margin: 24px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #3d4ee6 0%, #2f3ccb 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; }
    .footer { background: #f8faff; padding: 20px 24px; text-align: center; border-top: 1px solid #e0e9ff; }
    .footer p { color: #9ca3af; font-size: 12px; line-height: 1.8; }
    .footer strong { color: #3d4ee6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 مهمة جديدة بانتظارك</h1>
      <p>منصة سدير مهام | الإدارة الداخلية</p>
    </div>

    <div class="body">
      <p class="greeting">مرحبًا ${data.assigneeName}،</p>
      <p class="intro">
        تم تكليفك بمهمة جديدة داخل منصة <strong>سدير مهام</strong>.
        يرجى الاطلاع على تفاصيل المهمة والبدء في تنفيذها في أقرب وقت ممكن.
      </p>

      <div class="task-card">
        <div class="task-title">📌 ${data.taskTitle}</div>

        <div class="field-row">
          <span class="field-label">المشروع:</span>
          <span class="field-value">${data.projectName}</span>
        </div>

        <div class="field-row">
          <span class="field-label">الأولوية:</span>
          <span class="field-value">
            <span class="priority-badge priority-${data.priority}">${priorityLabel}</span>
          </span>
        </div>

        <div class="field-row">
          <span class="field-label">تاريخ الاستحقاق:</span>
          <span class="field-value">${dueDateText}</span>
        </div>

        <div class="field-row">
          <span class="field-label">صادرة من:</span>
          <span class="field-value">${data.issuerName}</span>
        </div>

        ${
          data.description
            ? `
        <div class="field-row" style="flex-direction: column;">
          <span class="field-label">الوصف:</span>
          <div class="description-box">${data.description.substring(0, 500)}${data.description.length > 500 ? "..." : ""}</div>
        </div>
        `
            : ""
        }
      </div>

      <div class="cta-section">
        <a href="${data.taskUrl}" class="cta-button">
          عرض تفاصيل المهمة وتحديث حالتها
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
        إذا لم يعمل الزر، انسخ الرابط التالي في المتصفح:<br>
        <span style="color: #3d4ee6;">${data.taskUrl}</span>
      </p>
    </div>

    <div class="footer">
      <p>
        هذا البريد مُرسَل تلقائيًا من <strong>منصة سدير مهام</strong><br>
        نظام إدارة المشاريع والمهام الداخلي
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendTaskIssuedEmail(data: TaskEmailData): Promise<boolean> {
  // إنشاء سجل الإشعار أولاً
  const notificationLog = await prisma.notificationLog.create({
    data: {
      taskId: data.taskId,
      recipientId: await getRecipientId(data.assigneeEmail),
      type: "TASK_ISSUED",
      status: "PENDING",
      subject: `تم تكليفك بمهمة جديدة: ${data.taskTitle}`,
    },
  });

  try {
    // التحقق من إعدادات SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("إعدادات SMTP غير مكتملة");
    }

    const transporter = createTransporter();
    const htmlContent = buildTaskIssuedEmail(data);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `سدير مهام <${process.env.SMTP_USER}>`,
      to: data.assigneeEmail,
      subject: `تم تكليفك بمهمة جديدة: ${data.taskTitle}`,
      html: htmlContent,
    });

    // تحديث حالة الإشعار إلى "مُرسَل"
    await prisma.notificationLog.update({
      where: { id: notificationLog.id },
      data: { status: "SENT", sentAt: new Date() },
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";

    // تسجيل الخطأ
    await prisma.notificationLog.update({
      where: { id: notificationLog.id },
      data: { status: "FAILED", error: errorMessage },
    });

    console.error(`[Email] فشل إرسال البريد إلى ${data.assigneeEmail}:`, errorMessage);
    return false;
  }
}

async function getRecipientId(email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email } });
  return user?.id || "";
}

export async function sendBulkTaskIssuedEmails(
  recipients: { email: string; name: string }[],
  taskData: Omit<TaskEmailData, "assigneeEmail" | "assigneeName">
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };

  for (const recipient of recipients) {
    const success = await sendTaskIssuedEmail({
      ...taskData,
      assigneeEmail: recipient.email,
      assigneeName: recipient.name,
    });

    if (success) {
      results.success.push(recipient.email);
    } else {
      results.failed.push(recipient.email);
    }
  }

  return results;
}

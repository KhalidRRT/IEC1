import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/permissions";
import { sendBulkTaskIssuedEmails } from "@/lib/email";
import { getTaskUrl } from "@/lib/utils";

// POST /api/tasks/[id]/issue — إصدار المهمة
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (!Permissions.canIssueTask(session.user.role)) {
    return NextResponse.json({ error: "لا تملك صلاحية إصدار المهام" }, { status: 403 });
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, name: true } },
      primaryAssignee: { select: { id: true, name: true, email: true } },
      assignees: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!task) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });

  if (task.status !== "DRAFT") {
    return NextResponse.json(
      { error: "لا يمكن إصدار مهمة ليست في حالة مسودة" },
      { status: 400 }
    );
  }

  // إصدار المهمة
  const issuedTask = await prisma.task.update({
    where: { id: params.id },
    data: {
      status: "NEW",
      issuedAt: new Date(),
      issuedById: session.user.id,
    },
  });

  // جمع جميع المكلفين
  const recipients: { email: string; name: string }[] = [];

  if (task.primaryAssignee) {
    recipients.push({
      email: task.primaryAssignee.email,
      name: task.primaryAssignee.name,
    });
  }

  task.assignees.forEach((assignee) => {
    if (!recipients.some((r) => r.email === assignee.user.email)) {
      recipients.push({ email: assignee.user.email, name: assignee.user.name });
    }
  });

  // تسجيل النشاط
  const assigneeNames = recipients.map((r) => r.name).join("، ");
  await prisma.activityLog.create({
    data: {
      type: "TASK_ISSUED",
      userId: session.user.id,
      taskId: params.id,
      projectId: task.projectId,
      description: `تم إصدار المهمة "${task.title}" بواسطة ${session.user.name} إلى ${assigneeNames || "لا أحد"}`,
    },
  });

  // إرسال الإيميلات (لا تفشل عملية الإصدار إن فشل الإيميل)
  let emailResults = { success: [] as string[], failed: [] as string[] };
  if (recipients.length > 0) {
    try {
      emailResults = await sendBulkTaskIssuedEmails(recipients, {
        taskId: params.id,
        taskTitle: task.title,
        projectName: task.project.name,
        priority: task.priority,
        dueDate: task.dueDate,
        description: task.description,
        issuerName: session.user.name || "مدير النظام",
        taskUrl: getTaskUrl(params.id),
      });
    } catch (emailError) {
      console.error("[Issue Task] خطأ في إرسال الإيميلات:", emailError);
    }
  }

  return NextResponse.json({
    task: issuedTask,
    emailResults,
    message: "تم إصدار المهمة بنجاح",
    emailWarning: emailResults.failed.length > 0
      ? `المهمة أُصدرت لكن فشل إرسال البريد إلى: ${emailResults.failed.join("، ")}`
      : null,
  });
}

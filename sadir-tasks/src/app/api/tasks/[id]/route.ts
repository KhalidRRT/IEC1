import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permissions } from "@/lib/permissions";

const updateTaskSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["DRAFT", "NEW", "IN_PROGRESS", "PENDING_REVIEW", "COMPLETED", "OVERDUE", "ON_HOLD"]).optional(),
  dueDate: z.string().optional().nullable(),
  primaryAssigneeId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  customFieldValues: z.array(z.object({
    customFieldId: z.string(),
    textValue: z.string().optional().nullable(),
    numberValue: z.number().optional().nullable(),
    dateValue: z.string().optional().nullable(),
    boolValue: z.boolean().optional().nullable(),
    selectedOptions: z.array(z.string()).optional(),
    personUserId: z.string().optional().nullable(),
  })).optional(),
});

// GET /api/tasks/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      project: {
        select: { id: true, name: true, ownerId: true },
      },
      primaryAssignee: { select: { id: true, name: true, image: true } },
      issuedBy: { select: { id: true, name: true } },
      assignees: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      customFieldValues: {
        include: {
          customField: { select: { id: true, name: true, type: true } },
          personUser: { select: { id: true, name: true } },
        },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, image: true } },
          attachments: {
            include: { uploadedBy: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        where: { commentId: null },
        include: { uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      activityLogs: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!task) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });

  // التحقق من الوصول
  const isAssignee =
    task.primaryAssigneeId === session.user.id ||
    task.assignees.some((a) => a.userId === session.user.id);
  const isProjectOwner = task.project.ownerId === session.user.id;

  if (
    session.user.role === "EXECUTOR" &&
    !isAssignee
  ) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  return NextResponse.json(task);
}

// PATCH /api/tasks/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { ownerId: true } },
      assignees: { select: { userId: true } },
    },
  });

  if (!task) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });

  const isAssignee =
    task.primaryAssigneeId === session.user.id ||
    task.assignees.some((a) => a.userId === session.user.id);
  const isProjectOwner = task.project.ownerId === session.user.id;

  // فحص الصلاحية
  if (
    session.user.role === "EXECUTOR" &&
    !isAssignee
  ) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صحيحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const { assigneeIds, customFieldValues, ...taskData } = parsed.data;

  // بناء بيانات التحديث
  const updateData: any = {
    ...taskData,
    dueDate: taskData.dueDate ? new Date(taskData.dueDate) : taskData.dueDate === null ? null : undefined,
  };

  // تحديث المنفذين إن وجد
  if (assigneeIds !== undefined) {
    await prisma.taskAssignee.deleteMany({ where: { taskId: params.id } });
    if (assigneeIds.length > 0) {
      await prisma.taskAssignee.createMany({
        data: assigneeIds.map((userId) => ({ taskId: params.id, userId })),
        skipDuplicates: true,
      });
    }
  }

  // تحديث قيم الحقول المخصصة
  if (customFieldValues) {
    for (const cfv of customFieldValues) {
      await prisma.taskCustomFieldValue.upsert({
        where: { taskId_customFieldId: { taskId: params.id, customFieldId: cfv.customFieldId } },
        create: {
          taskId: params.id,
          customFieldId: cfv.customFieldId,
          textValue: cfv.textValue,
          numberValue: cfv.numberValue,
          dateValue: cfv.dateValue ? new Date(cfv.dateValue) : null,
          boolValue: cfv.boolValue,
          selectedOptions: cfv.selectedOptions || [],
          personUserId: cfv.personUserId,
        },
        update: {
          textValue: cfv.textValue,
          numberValue: cfv.numberValue,
          dateValue: cfv.dateValue ? new Date(cfv.dateValue) : null,
          boolValue: cfv.boolValue,
          selectedOptions: cfv.selectedOptions || [],
          personUserId: cfv.personUserId,
        },
      });
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id: params.id },
    data: updateData,
  });

  // تسجيل تغيير الحالة
  if (taskData.status && taskData.status !== task.status) {
    const statusLabels: Record<string, string> = {
      NEW: "جديدة", IN_PROGRESS: "قيد التنفيذ", PENDING_REVIEW: "بانتظار مراجعة",
      COMPLETED: "مكتملة", ON_HOLD: "معلقة",
    };
    await prisma.activityLog.create({
      data: {
        type: taskData.status === "COMPLETED" ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
        userId: session.user.id,
        taskId: params.id,
        projectId: (await prisma.task.findUnique({ where: { id: params.id }, select: { projectId: true } }))?.projectId,
        description: `تم تغيير حالة المهمة إلى "${statusLabels[taskData.status] || taskData.status}"`,
      },
    });
  }

  return NextResponse.json(updatedTask);
}

// DELETE /api/tasks/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (!Permissions.canDeleteTask(session.user.role)) {
    return NextResponse.json({ error: "لا تملك صلاحية حذف المهام" }, { status: 403 });
  }

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });

  await prisma.task.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "تم حذف المهمة بنجاح" });
}

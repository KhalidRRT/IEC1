import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permissions } from "@/lib/permissions";

const createTaskSchema = z.object({
  title: z.string().min(2, "عنوان المهمة مطلوب").max(200),
  description: z.string().optional(),
  projectId: z.string().min(1, "المشروع مطلوب"),
  primaryAssigneeId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  isDraft: z.boolean().default(true),
  customFieldValues: z
    .array(
      z.object({
        customFieldId: z.string(),
        textValue: z.string().optional(),
        numberValue: z.number().optional(),
        dateValue: z.string().optional(),
        boolValue: z.boolean().optional(),
        selectedOptions: z.array(z.string()).optional(),
        personUserId: z.string().optional(),
      })
    )
    .optional(),
});

// GET /api/tasks
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assigneeId = searchParams.get("assigneeId");
  const search = searchParams.get("search");
  const overdue = searchParams.get("overdue");
  const myTasks = searchParams.get("myTasks");

  const isExecutor = ["EXECUTOR", "READER"].includes(session.user.role);

  const where: any = {
    ...(projectId && { projectId }),
    ...(status && { status: status as any }),
    ...(priority && { priority: priority as any }),
    ...(search && { title: { contains: search, mode: "insensitive" } }),
    ...(overdue === "true" && {
      dueDate: { lt: new Date() },
      status: { notIn: ["COMPLETED", "DRAFT"] },
    }),
    ...(isExecutor || myTasks === "true"
      ? {
          OR: [
            { primaryAssigneeId: session.user.id },
            { assignees: { some: { userId: session.user.id } } },
          ],
        }
      : {}),
    ...(assigneeId && {
      OR: [
        { primaryAssigneeId: assigneeId },
        { assignees: { some: { userId: assigneeId } } },
      ],
    }),
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      primaryAssignee: { select: { id: true, name: true, image: true } },
      assignees: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      issuedBy: { select: { id: true, name: true } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات غير صحيحة", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    title,
    description,
    projectId,
    primaryAssigneeId,
    assigneeIds,
    priority,
    dueDate,
    isDraft,
    customFieldValues,
  } = parsed.data;

  // التحقق من أن المستخدم عضو في المشروع
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!project && session.user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "لا تملك صلاحية إضافة مهام لهذا المشروع" }, { status: 403 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      primaryAssigneeId: primaryAssigneeId || null,
      priority: priority as any,
      status: isDraft ? "DRAFT" : "NEW",
      dueDate: dueDate ? new Date(dueDate) : null,
      assignees: {
        create: (assigneeIds || []).map((userId) => ({ userId })),
      },
      customFieldValues: {
        create: (customFieldValues || []).map((cfv) => ({
          customFieldId: cfv.customFieldId,
          textValue: cfv.textValue,
          numberValue: cfv.numberValue,
          dateValue: cfv.dateValue ? new Date(cfv.dateValue) : null,
          boolValue: cfv.boolValue,
          selectedOptions: cfv.selectedOptions || [],
          personUserId: cfv.personUserId,
        })),
      },
    },
    include: {
      project: { select: { id: true, name: true } },
      primaryAssignee: { select: { id: true, name: true } },
    },
  });

  // تسجيل النشاط
  await prisma.activityLog.create({
    data: {
      type: isDraft ? "TASK_SAVED_AS_DRAFT" : "TASK_CREATED",
      userId: session.user.id,
      projectId,
      taskId: task.id,
      description: isDraft
        ? `تم حفظ المهمة "${title}" كمسودة`
        : `تم إنشاء المهمة "${title}"`,
    },
  });

  return NextResponse.json(task, { status: 201 });
}

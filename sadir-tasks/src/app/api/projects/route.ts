import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permissions } from "@/lib/permissions";

const createProjectSchema = z.object({
  name: z.string().min(2, "اسم المشروع يجب أن يكون حرفين على الأقل").max(100),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  templateId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

// GET /api/projects
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const isExecutor = ["EXECUTOR", "READER"].includes(session.user.role);
  const isPM = session.user.role === "PROJECT_MANAGER";

  const where: any = {
    ...(status && { status: status as any }),
    ...(search && { name: { contains: search, mode: "insensitive" } }),
    ...(isExecutor && { members: { some: { userId: session.user.id } } }),
    ...(isPM && {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    }),
  };

  const projects = await prisma.project.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, image: true } },
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

// POST /api/projects
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (!Permissions.canCreateProject(session.user.role)) {
    return NextResponse.json({ error: "لا تملك صلاحية إنشاء مشروع" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات غير صحيحة", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description, startDate, endDate, templateId, memberIds } = parsed.data;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      ownerId: session.user.id,
      templateId: templateId || null,
      members: {
        create: [
          { userId: session.user.id, role: session.user.role },
          ...(memberIds || []).map((userId) => ({
            userId,
            role: "EXECUTOR" as any,
          })),
        ],
      },
    },
    include: {
      owner: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  // إذا اختار قالبًا، نسخ الحقول المخصصة
  if (templateId) {
    const templateFields = await prisma.projectTemplateField.findMany({
      where: { templateId },
      orderBy: { order: "asc" },
    });

    for (const field of templateFields) {
      const options = field.options ? (field.options as string[]) : [];

      const customField = await prisma.customField.create({
        data: {
          projectId: project.id,
          name: field.name,
          type: field.type,
          description: field.description,
          isRequired: field.isRequired,
          showInTable: field.showInTable,
          showInReport: field.showInReport,
          isExecutorEditable: field.isExecutorEditable,
          isFilterable: field.isFilterable,
          order: field.order,
        },
      });

      // إنشاء خيارات الحقل إن وجدت
      if (options.length > 0 && (field.type === "SINGLE_SELECT" || field.type === "MULTI_SELECT")) {
        await prisma.customFieldOption.createMany({
          data: options.map((label: string, idx: number) => ({
            customFieldId: customField.id,
            label,
            order: idx,
          })),
        });
      }
    }
  }

  // تسجيل النشاط
  await prisma.activityLog.create({
    data: {
      type: "PROJECT_CREATED",
      userId: session.user.id,
      projectId: project.id,
      description: `تم إنشاء المشروع "${name}"`,
    },
  });

  return NextResponse.json(project, { status: 201 });
}

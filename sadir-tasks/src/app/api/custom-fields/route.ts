import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permissions } from "@/lib/permissions";

const createFieldSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1, "اسم الحقل مطلوب").max(100),
  type: z.enum(["SHORT_TEXT", "LONG_TEXT", "NUMBER", "DATE", "SINGLE_SELECT", "MULTI_SELECT", "PERSON", "URL", "YES_NO"]),
  description: z.string().optional(),
  isRequired: z.boolean().default(false),
  showInTable: z.boolean().default(true),
  showInReport: z.boolean().default(true),
  isExecutorEditable: z.boolean().default(true),
  isFilterable: z.boolean().default(false),
  order: z.number().default(0),
  options: z.array(z.string()).optional(),
});

// POST /api/custom-fields
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const parsed = createFieldSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صحيحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const { options, projectId, ...fieldData } = parsed.data;

  // التحقق من الصلاحية
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const isOwner = project.ownerId === session.user.id;
  if (!Permissions.canManageProjectCustomFields(session.user.role, isOwner)) {
    return NextResponse.json({ error: "لا تملك صلاحية إضافة حقول مخصصة" }, { status: 403 });
  }

  const customField = await prisma.customField.create({
    data: {
      ...fieldData,
      projectId,
      options: options && options.length > 0
        ? {
            create: options.map((label, idx) => ({ label, order: idx })),
          }
        : undefined,
    },
    include: { options: { orderBy: { order: "asc" } } },
  });

  await prisma.activityLog.create({
    data: {
      type: "CUSTOM_FIELD_ADDED",
      userId: session.user.id,
      projectId,
      description: `تم إضافة الحقل المخصص "${fieldData.name}" للمشروع`,
    },
  });

  return NextResponse.json(customField, { status: 201 });
}

// DELETE /api/custom-fields?fieldId=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fieldId = searchParams.get("fieldId");
  if (!fieldId) return NextResponse.json({ error: "معرف الحقل مطلوب" }, { status: 400 });

  const field = await prisma.customField.findUnique({
    where: { id: fieldId },
    include: { project: { select: { ownerId: true } } },
  });
  if (!field) return NextResponse.json({ error: "الحقل غير موجود" }, { status: 404 });

  const isOwner = field.project.ownerId === session.user.id;
  if (!Permissions.canManageProjectCustomFields(session.user.role, isOwner)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  await prisma.customField.delete({ where: { id: fieldId } });

  return NextResponse.json({ message: "تم حذف الحقل بنجاح" });
}

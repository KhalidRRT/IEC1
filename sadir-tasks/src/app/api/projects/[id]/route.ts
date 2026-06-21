import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permissions } from "@/lib/permissions";

const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  completionRate: z.number().min(0).max(100).optional(),
});

// GET /api/projects/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, image: true, role: true } } },
      },
      customFields: {
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
  }

  // التحقق من الوصول
  const isMember = project.members.some((m) => m.userId === session.user.id);
  if (!isMember && session.user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  return NextResponse.json(project);
}

// PATCH /api/projects/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const isOwner = project.ownerId === session.user.id;
  if (!Permissions.canEditProject(session.user.role, isOwner)) {
    return NextResponse.json({ error: "لا تملك صلاحية تعديل هذا المشروع" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : parsed.data.startDate === null ? null : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : parsed.data.endDate === null ? null : undefined,
    },
  });

  await prisma.activityLog.create({
    data: {
      type: "PROJECT_UPDATED",
      userId: session.user.id,
      projectId: params.id,
      description: `تم تحديث المشروع "${updated.name}"`,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/projects/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (!Permissions.canDeleteProject(session.user.role)) {
    return NextResponse.json({ error: "لا تملك صلاحية حذف المشاريع" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  await prisma.project.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "تم حذف المشروع بنجاح" });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/permissions";

// GET /api/reports?type=project&projectId=xxx&format=json
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "tasks";
  const projectId = searchParams.get("projectId");
  const assigneeId = searchParams.get("assigneeId");
  const status = searchParams.get("status");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  const where: any = {
    ...(projectId && { projectId }),
    ...(status && { status: status as any }),
    ...(assigneeId && {
      OR: [
        { primaryAssigneeId: assigneeId },
        { assignees: { some: { userId: assigneeId } } },
      ],
    }),
    ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
    ...(toDate && {
      createdAt: {
        ...(fromDate ? { gte: new Date(fromDate) } : {}),
        lte: new Date(toDate),
      },
    }),
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      primaryAssignee: { select: { id: true, name: true } },
      assignees: {
        include: { user: { select: { id: true, name: true } } },
      },
      customFieldValues: {
        include: {
          customField: { select: { id: true, name: true, type: true, showInReport: true } },
          personUser: { select: { id: true, name: true } },
        },
      },
      issuedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // إحصائيات
  const stats = {
    total: tasks.length,
    byStatus: Object.fromEntries(
      ["DRAFT", "NEW", "IN_PROGRESS", "PENDING_REVIEW", "COMPLETED", "OVERDUE", "ON_HOLD"].map(
        (s) => [s, tasks.filter((t) => t.status === s).length]
      )
    ),
    byPriority: Object.fromEntries(
      ["LOW", "MEDIUM", "HIGH", "URGENT"].map(
        (p) => [p, tasks.filter((t) => t.priority === p).length]
      )
    ),
    overdue: tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETED"
    ).length,
  };

  return NextResponse.json({ tasks, stats });
}

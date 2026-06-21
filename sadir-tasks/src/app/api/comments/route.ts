import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCommentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1, "محتوى التعليق مطلوب").max(2000),
});

// POST /api/comments
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const parsed = createCommentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  }

  const { taskId, content } = parsed.data;

  // التحقق من وجود المهمة والوصول إليها
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignees: { select: { userId: true } } },
  });

  if (!task) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });

  const isAssignee =
    task.primaryAssigneeId === session.user.id ||
    task.assignees.some((a) => a.userId === session.user.id);

  if (session.user.role === "EXECUTOR" && !isAssignee) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const comment = await prisma.comment.create({
    data: {
      taskId,
      authorId: session.user.id,
      content,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      attachments: {
        include: { uploadedBy: { select: { id: true, name: true } } },
      },
    },
  });

  // تسجيل النشاط
  await prisma.activityLog.create({
    data: {
      type: "COMMENT_ADDED",
      userId: session.user.id,
      taskId,
      projectId: task.projectId,
      description: `أضاف ${session.user.name} تعليقًا على المهمة`,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

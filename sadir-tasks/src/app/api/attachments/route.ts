import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
];

// POST /api/attachments
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (session.user.role === "READER") {
    return NextResponse.json({ error: "لا تملك صلاحية رفع الملفات" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const taskId = formData.get("taskId") as string;
    const commentId = formData.get("commentId") as string | null;

    if (!file) return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
    if (!taskId) return NextResponse.json({ error: "معرف المهمة مطلوب" }, { status: 400 });

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "حجم الملف يتجاوز الحد الأقصى (10MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم" }, { status: 400 });
    }

    // التحقق من وجود المهمة
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: { select: { userId: true } } },
    });
    if (!task) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });

    // إنشاء مجلد التخزين
    const uploadDir = join(process.cwd(), "public", "uploads", taskId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // حفظ الملف
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_؀-ۿ]/g, "_");
    const fileName = `${timestamp}_${safeName}`;
    const filePath = join(uploadDir, fileName);
    const storagePath = `/uploads/${taskId}/${fileName}`;

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // حفظ في قاعدة البيانات
    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        commentId: commentId || null,
        uploadedById: session.user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        type: "ATTACHMENT_UPLOADED",
        userId: session.user.id,
        taskId,
        projectId: task.projectId,
        description: `رفع ${session.user.name} مرفقًا: ${file.name}`,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("[Attachment Upload] خطأ:", error);
    return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// GET /api/attachments/[id] — تحميل مرفق
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const attachment = await prisma.attachment.findUnique({
    where: { id: params.id },
  });

  if (!attachment) {
    return NextResponse.json({ error: "المرفق غير موجود" }, { status: 404 });
  }

  const filePath = join(process.cwd(), "public", attachment.storagePath);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "الملف غير موجود على الخادم" }, { status: 404 });
  }

  const fileBuffer = await readFile(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
      "Content-Length": attachment.fileSize.toString(),
    },
  });
}

// DELETE /api/attachments/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const attachment = await prisma.attachment.findUnique({
    where: { id: params.id },
  });

  if (!attachment) return NextResponse.json({ error: "المرفق غير موجود" }, { status: 404 });

  const isOwner = attachment.uploadedById === session.user.id;
  const isAdmin = session.user.role === "SYSTEM_ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "غير مصرح بحذف هذا المرفق" }, { status: 403 });
  }

  await prisma.attachment.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "تم حذف المرفق" });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { TaskStatus, TaskPriority } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة", NEW: "جديدة", IN_PROGRESS: "قيد التنفيذ",
  PENDING_REVIEW: "بانتظار المراجعة", ON_HOLD: "معلقة",
  COMPLETED: "مكتملة", OVERDUE: "متأخرة",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "منخفضة", MEDIUM: "متوسطة", HIGH: "عالية", URGENT: "عاجلة",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (!["SYSTEM_ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const assigneeId = searchParams.get("assigneeId");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {
    ...(projectId && { projectId }),
    ...(assigneeId && { primaryAssigneeId: assigneeId }),
    ...(status && { status: status as TaskStatus }),
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) }),
          },
        }
      : {}),
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { name: true } },
      primaryAssignee: { select: { name: true } },
      issuedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "سدير مهام";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("المهام", {
    views: [{ rightToLeft: true }],
  });

  sheet.columns = [
    { header: "العنوان",         key: "title",     width: 40 },
    { header: "المشروع",         key: "project",   width: 22 },
    { header: "المسؤول",         key: "assignee",  width: 20 },
    { header: "الأولوية",        key: "priority",  width: 14 },
    { header: "الحالة",          key: "status",    width: 20 },
    { header: "تاريخ الاستحقاق", key: "dueDate",   width: 16 },
    { header: "تاريخ الإصدار",   key: "issuedAt",  width: 16 },
    { header: "أصدرها",          key: "issuedBy",  width: 18 },
    { header: "تاريخ الإنشاء",   key: "createdAt", width: 16 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B5998" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  headerRow.height = 24;

  const arabicDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("ar-SA") : "";

  tasks.forEach((task) => {
    const row = sheet.addRow({
      title: task.title,
      project: task.project?.name || "",
      assignee: task.primaryAssignee?.name || "",
      priority: PRIORITY_LABELS[task.priority] || task.priority,
      status: STATUS_LABELS[task.status] || task.status,
      dueDate: arabicDate(task.dueDate),
      issuedAt: arabicDate(task.issuedAt),
      issuedBy: task.issuedBy?.name || "",
      createdAt: arabicDate(task.createdAt),
    });
    row.alignment = { readingOrder: "rtl", vertical: "middle" };
    row.height = 20;
  });

  // Alternate row colors
  sheet.eachRow((row, rowNum) => {
    if (rowNum > 1 && rowNum % 2 === 0) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F7FF" } };
    }
  });

  sheet.autoFilter = { from: "A1", to: "I1" };

  const buffer = await workbook.xlsx.writeBuffer();

  const filename = encodeURIComponent(`تقرير-المهام-${new Date().toLocaleDateString("ar-SA")}.xlsx`);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}

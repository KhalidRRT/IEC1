import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, LayoutList, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Permissions } from "@/lib/permissions";
import {
  TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS,
  formatDate,
} from "@/lib/utils";
import { TaskStatus } from "@prisma/client";
import KanbanBoard from "@/components/tasks/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: {
    projectId?: string;
    status?: string;
    priority?: string;
    overdue?: string;
    view?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isExecutor = ["EXECUTOR", "READER"].includes(session.user.role);
  const view = searchParams.view === "kanban" ? "kanban" : "table";

  const where: any = {
    ...(searchParams.projectId && { projectId: searchParams.projectId }),
    ...(searchParams.status && { status: searchParams.status as TaskStatus }),
    ...(searchParams.priority && { priority: searchParams.priority as any }),
    ...(searchParams.overdue === "true" && {
      dueDate: { lt: new Date() },
      status: { notIn: ["COMPLETED", "DRAFT"] },
    }),
    ...(isExecutor && {
      OR: [
        { primaryAssigneeId: session.user.id },
        { assignees: { some: { userId: session.user.id } } },
      ],
    }),
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      primaryAssignee: { select: { id: true, name: true } },
      assignees: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const canCreate = Permissions.canCreateTask(session.user.role);

  // Build filter href preserving other params
  function filterHref(extra: Record<string, string>) {
    const p = new URLSearchParams();
    if (searchParams.view) p.set("view", searchParams.view);
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return `/tasks?${p.toString()}`;
  }

  function viewHref(v: string) {
    const p = new URLSearchParams();
    p.set("view", v);
    if (searchParams.status) p.set("status", searchParams.status);
    if (searchParams.projectId) p.set("projectId", searchParams.projectId);
    if (searchParams.overdue) p.set("overdue", searchParams.overdue);
    return `/tasks?${p.toString()}`;
  }

  const QUICK_FILTERS = [
    { label: "الكل",             href: filterHref({}) },
    { label: "جديدة",            href: filterHref({ status: "NEW" }) },
    { label: "قيد التنفيذ",      href: filterHref({ status: "IN_PROGRESS" }) },
    { label: "بانتظار مراجعة",   href: filterHref({ status: "PENDING_REVIEW" }) },
    { label: "المتأخرة",          href: filterHref({ overdue: "true" }) },
    { label: "مكتملة",           href: filterHref({ status: "COMPLETED" }) },
  ];

  return (
    <div className="p-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المهام</h1>
          <p className="text-gray-500 text-sm mt-1">{tasks.length} مهمة</p>
        </div>
        <div className="flex items-center gap-2">
          {/* تبديل العرض */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <Link
              href={viewHref("table")}
              className={`p-2 transition-colors ${
                view === "table" ? "bg-primary text-white" : "hover:bg-gray-50 text-gray-500"
              }`}
              title="عرض جدول"
            >
              <LayoutList className="h-4 w-4" />
            </Link>
            <Link
              href={viewHref("kanban")}
              className={`p-2 transition-colors ${
                view === "kanban" ? "bg-primary text-white" : "hover:bg-gray-50 text-gray-500"
              }`}
              title="عرض كانبان"
            >
              <LayoutGrid className="h-4 w-4" />
            </Link>
          </div>
          {canCreate && (
            <Link href="/tasks/new">
              <Button>
                <Plus className="h-4 w-4" />
                مهمة جديدة
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* فلاتر سريعة */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {QUICK_FILTERS.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:border-primary hover:text-primary transition-colors bg-white"
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* المحتوى */}
      {tasks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">لا توجد مهام</p>
          {canCreate && (
            <Link href="/tasks/new" className="mt-4 inline-block">
              <Button variant="outline">
                <Plus className="h-4 w-4" />
                إنشاء مهمة
              </Button>
            </Link>
          )}
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard tasks={tasks} />
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">عنوان المهمة</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">المشروع</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">المسؤول</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الأولوية</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الحالة</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الاستحقاق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== "COMPLETED";

                  return (
                    <tr key={task.id} className="table-row-hover">
                      <td className="px-5 py-3">
                        <Link href={`/tasks/${task.id}`} className="group">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          {task._count.comments > 0 && (
                            <span className="text-xs text-gray-400">
                              {task._count.comments} تعليق
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{task.project.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        {task.primaryAssignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-primary">
                                {task.primaryAssignee.name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600">{task.primaryAssignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${TASK_PRIORITY_COLORS[task.priority as keyof typeof TASK_PRIORITY_COLORS]}`}>
                          {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS]}`}>
                          {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {task.dueDate ? (
                          <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-500"}`}>
                            {formatDate(task.dueDate)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

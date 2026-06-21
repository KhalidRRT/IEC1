import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardList, AlertCircle, Clock, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS,
  formatDate,
} from "@/lib/utils";

export default async function MyTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const myTasksWhere = {
    OR: [
      { primaryAssigneeId: session.user.id },
      { assignees: { some: { userId: session.user.id } } },
    ],
    status: { not: "DRAFT" as any },
  };

  const [overdueTasks, todayTasks, upcomingTasks, completedTasks] = await Promise.all([
    // المتأخرة
    prisma.task.findMany({
      where: {
        ...myTasksWhere,
        dueDate: { lt: new Date() },
        status: { notIn: ["COMPLETED", "DRAFT"] },
      },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
    }),

    // اليوم
    prisma.task.findMany({
      where: {
        ...myTasksWhere,
        dueDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: { notIn: ["COMPLETED", "DRAFT"] },
      },
      include: { project: { select: { id: true, name: true } } },
    }),

    // القادمة (7 أيام)
    prisma.task.findMany({
      where: {
        ...myTasksWhere,
        dueDate: {
          gt: new Date(new Date().setHours(23, 59, 59, 999)),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        status: { notIn: ["COMPLETED", "DRAFT"] },
      },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
    }),

    // المكتملة (آخر 30 يوم)
    prisma.task.findMany({
      where: {
        ...myTasksWhere,
        status: "COMPLETED",
        updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const sections = [
    { title: "مهام متأخرة", tasks: overdueTasks, icon: AlertCircle, color: "text-red-500", count: overdueTasks.length },
    { title: "مهام اليوم", tasks: todayTasks, icon: Clock, color: "text-amber-500", count: todayTasks.length },
    { title: "مهام هذا الأسبوع", tasks: upcomingTasks, icon: Calendar, color: "text-blue-500", count: upcomingTasks.length },
    { title: "مكتملة مؤخرًا", tasks: completedTasks, icon: CheckCircle2, color: "text-green-500", count: completedTasks.length },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">مهامي</h1>
        <p className="text-gray-500 text-sm mt-1">المهام المسندة إليك</p>
      </div>

      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`h-4.5 w-4.5 ${section.color}`} size={18} />
              <h2 className="font-semibold text-gray-800">{section.title}</h2>
              {section.count > 0 && (
                <span className="badge bg-gray-100 text-gray-600 text-xs">
                  {section.count}
                </span>
              )}
            </div>

            {section.tasks.length === 0 ? (
              <p className="text-sm text-gray-400 pr-6">لا توجد مهام</p>
            ) : (
              <div className="space-y-2">
                {section.tasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{task.project.name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`badge text-xs ${TASK_PRIORITY_COLORS[task.priority]}`}>
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </span>
                          <span className={`badge text-xs ${TASK_STATUS_COLORS[task.status]}`}>
                            {TASK_STATUS_LABELS[task.status]}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-400 hidden sm:block">
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

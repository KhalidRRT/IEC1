import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskStatus, UserRole } from "@prisma/client";
import {
  FolderKanban, CheckSquare, Clock, TrendingUp,
  AlertCircle, CheckCircle2, Layers, Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  formatDate, TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS
} from "@/lib/utils";

async function getDashboardData(userId: string, userRole: UserRole) {
  const isAdmin = userRole === "SYSTEM_ADMIN";
  const isPM = userRole === "PROJECT_MANAGER";
  const isExecutor = userRole === "EXECUTOR" || userRole === "READER";

  // فلتر المهام حسب الدور
  const taskWhere = isExecutor
    ? {
        OR: [
          { primaryAssigneeId: userId },
          { assignees: { some: { userId } } },
        ],
      }
    : isPM
    ? {
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      }
    : {};

  const [
    totalProjects,
    totalTasks,
    tasksByStatus,
    recentTasks,
    overdueTasksCount,
  ] = await Promise.all([
    // إجمالي المشاريع
    prisma.project.count({
      where: isExecutor
        ? { members: { some: { userId } } }
        : isPM
        ? { OR: [{ ownerId: userId }, { members: { some: { userId } } }] }
        : {},
    }),

    // إجمالي المهام
    prisma.task.count({ where: taskWhere }),

    // المهام حسب الحالة
    prisma.task.groupBy({
      by: ["status"],
      where: taskWhere,
      _count: true,
    }),

    // أحدث المهام
    prisma.task.findMany({
      where: taskWhere,
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        primaryAssignee: { select: { id: true, name: true } },
      },
    }),

    // المهام المتأخرة
    prisma.task.count({
      where: {
        ...taskWhere,
        dueDate: { lt: new Date() },
        status: { notIn: ["COMPLETED", "DRAFT"] },
      },
    }),
  ]);

  // بناء إحصائيات الحالات
  const statusStats = Object.fromEntries(
    tasksByStatus.map((s) => [s.status, s._count])
  ) as Record<TaskStatus, number>;

  const completedTasks = statusStats.COMPLETED || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalProjects,
    totalTasks,
    statusStats,
    completionRate,
    recentTasks,
    overdueTasksCount,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const data = await getDashboardData(session.user.id, session.user.role);

  const statCards = [
    {
      label: "إجمالي المشاريع",
      value: data.totalProjects,
      icon: FolderKanban,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/projects",
    },
    {
      label: "إجمالي المهام",
      value: data.totalTasks,
      icon: CheckSquare,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/tasks",
    },
    {
      label: "قيد التنفيذ",
      value: data.statusStats.IN_PROGRESS || 0,
      icon: Layers,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/tasks?status=IN_PROGRESS",
    },
    {
      label: "المهام المتأخرة",
      value: data.overdueTasksCount,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      href: "/tasks?overdue=true",
    },
    {
      label: "بانتظار مراجعة",
      value: data.statusStats.PENDING_REVIEW || 0,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/tasks?status=PENDING_REVIEW",
    },
    {
      label: "مكتملة",
      value: data.statusStats.COMPLETED || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/tasks?status=COMPLETED",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* الترحيب */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            أهلاً، {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString("ar-SA", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        {/* نسبة الإنجاز */}
        <Card className="border-0 bg-gradient-to-l from-primary to-sadir-700 text-white shadow-lg">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke="white" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - data.completionRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {data.completionRate}%
              </span>
            </div>
            <div>
              <p className="text-white/80 text-xs">نسبة الإنجاز</p>
              <p className="text-white font-semibold text-sm">الإجمالية</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* المهام الأخيرة */}
      <Card className="border-0 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800">آخر المهام</h2>
          <Link
            href="/tasks"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            عرض الكل
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {data.recentTasks.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>لا توجد مهام بعد</p>
            </div>
          ) : (
            data.recentTasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-primary transition-colors">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.project.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge text-xs ${TASK_STATUS_COLORS[task.status]}`}>
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, ArrowRight, Users, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Permissions } from "@/lib/permissions";
import {
  PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS,
  TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS,
  formatDate,
} from "@/lib/utils";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      customFields: {
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
      tasks: {
        include: {
          primaryAssignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      activityLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { tasks: true, members: true } },
    },
  });

  if (!project) notFound();

  const isMember = project.members.some((m) => m.userId === session.user.id);
  if (!isMember && session.user.role !== "SYSTEM_ADMIN") {
    redirect("/projects");
  }

  const isOwner = project.ownerId === session.user.id;
  const canEdit = Permissions.canEditProject(session.user.role, isOwner);
  const canManageFields = Permissions.canManageProjectCustomFields(session.user.role, isOwner);

  // إحصائيات المهام
  const taskStats = project.tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      {/* المسار */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/projects" className="hover:text-primary transition-colors">
          المشاريع
        </Link>
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        <span className="text-gray-800 font-medium">{project.name}</span>
      </div>

      {/* رأس المشروع */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={`badge ${PROJECT_STATUS_COLORS[project.status]}`}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="text-gray-500 max-w-2xl">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
            <span>المدير: {project.owner.name}</span>
            {project.startDate && <span>البداية: {formatDate(project.startDate)}</span>}
            {project.endDate && <span>النهاية: {formatDate(project.endDate)}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {canManageFields && (
            <Link href={`/projects/${project.id}/custom-fields`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                الحقول المخصصة
              </Button>
            </Link>
          )}
          <Link href={`/tasks/new?projectId=${project.id}`}>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              مهمة جديدة
            </Button>
          </Link>
        </div>
      </div>

      {/* نسبة الإنجاز */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">نسبة الإنجاز الكلية</span>
            <span className="text-lg font-bold text-primary">{project.completionRate}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${project.completionRate}%` }}
            />
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs text-gray-500">
            <span>إجمالي المهام: {project._count.tasks}</span>
            <span>مكتملة: {taskStats.COMPLETED || 0}</span>
            <span>قيد التنفيذ: {taskStats.IN_PROGRESS || 0}</span>
            <span>متأخرة: {taskStats.OVERDUE || 0}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* آخر المهام */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800">المهام</h2>
              <Link
                href={`/tasks?projectId=${project.id}`}
                className="text-sm text-primary hover:text-primary/80"
              >
                عرض الكل
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {project.tasks.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  لا توجد مهام في هذا المشروع
                </div>
              ) : (
                project.tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate group-hover:text-primary">
                        {task.title}
                      </p>
                      {task.primaryAssignee && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {task.primaryAssignee.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge text-xs ${TASK_PRIORITY_COLORS[task.priority]}`}>
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </span>
                      <span className={`badge text-xs ${TASK_STATUS_COLORS[task.status]}`}>
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* الأعضاء وسجل النشاط */}
        <div className="space-y-4">
          {/* الأعضاء */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800 text-sm">الأعضاء ({project._count.members})</h2>
            </div>
            <div className="p-4 space-y-2">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {member.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{member.user.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* سجل النشاط */}
          <Card className="border-0 shadow-sm">
            <div className="p-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800 text-sm">سجل النشاط</h2>
            </div>
            <div className="p-4 space-y-3">
              {project.activityLogs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">لا يوجد نشاط</p>
              ) : (
                project.activityLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">{log.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {log.user.name} • {new Date(log.createdAt).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

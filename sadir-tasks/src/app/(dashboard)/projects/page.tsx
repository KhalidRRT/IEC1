import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FolderKanban, Calendar, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Permissions } from "@/lib/permissions";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  formatDate,
} from "@/lib/utils";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isExecutor = ["EXECUTOR", "READER"].includes(session.user.role);
  const isPM = session.user.role === "PROJECT_MANAGER";

  const projects = await prisma.project.findMany({
    where: isExecutor
      ? { members: { some: { userId: session.user.id } } }
      : isPM
      ? {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        }
      : {},
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const canCreate = Permissions.canCreateProject(session.user.role);

  return (
    <div className="p-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المشاريع</h1>
          <p className="text-gray-500 text-sm mt-1">
            {projects.length} مشروع {projects.length !== 1 ? "" : ""}
          </p>
        </div>
        {canCreate && (
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4" />
              مشروع جديد
            </Button>
          </Link>
        )}
      </div>

      {/* قائمة المشاريع */}
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="h-14 w-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500">لا توجد مشاريع بعد</h3>
          <p className="text-gray-400 text-sm mt-1">
            {canCreate ? "ابدأ بإنشاء مشروعك الأول" : "لم يتم إسنادك إلى أي مشروع"}
          </p>
          {canCreate && (
            <Link href="/projects/new" className="mt-4 inline-block">
              <Button>
                <Plus className="h-4 w-4" />
                إنشاء مشروع
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base truncate">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`badge mr-2 flex-shrink-0 ${PROJECT_STATUS_COLORS[project.status]}`}
                    >
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                  </div>

                  {/* نسبة الإنجاز */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">الإنجاز</span>
                      <span className="text-xs font-medium text-gray-700">
                        {project.completionRate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${project.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* التفاصيل */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {project._count.tasks} مهمة
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {project._count.members} عضو
                    </span>
                    {project.endDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(project.endDate)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      المدير: {project.owner.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

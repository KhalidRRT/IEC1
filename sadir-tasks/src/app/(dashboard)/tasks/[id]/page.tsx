import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, MessageSquare, Clock, Paperclip } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TaskActions, CommentBox } from "@/components/tasks/TaskDetailClient";
import AttachmentUploader from "@/components/tasks/AttachmentUploader";
import {
  TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS,
  formatDate, formatRelativeTime,
} from "@/lib/utils";

// نجعل الصفحة تعيد الجلب عند كل طلب
export const dynamic = "force-dynamic";

async function getTask(id: string, userId: string, userRole: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, ownerId: true } },
      primaryAssignee: { select: { id: true, name: true, image: true } },
      issuedBy: { select: { id: true, name: true } },
      assignees: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      customFieldValues: {
        include: {
          customField: { select: { id: true, name: true, type: true } },
          personUser: { select: { id: true, name: true } },
        },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, image: true } },
          attachments: {
            include: { uploadedBy: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        where: { commentId: null },
        include: { uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      activityLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 15,
      },
    },
  });
  return task;
}

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const task = await getTask(params.id, session.user.id, session.user.role);
  if (!task) notFound();

  // التحقق من الوصول للمنفذين
  const isAssignee =
    task.primaryAssigneeId === session.user.id ||
    task.assignees.some((a) => a.userId === session.user.id);

  if (session.user.role === "EXECUTOR" && !isAssignee) {
    redirect("/tasks");
  }

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "COMPLETED";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* المسار */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/tasks" className="hover:text-primary transition-colors">المهام</Link>
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        <span className="text-gray-800 font-medium truncate max-w-xs">{task.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المحتوى الرئيسي */}
        <div className="lg:col-span-2 space-y-5">

          {/* رأس المهمة */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{task.title}</h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${TASK_PRIORITY_COLORS[task.priority]}`}>
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
              </div>

              <span className={`badge ${TASK_STATUS_COLORS[task.status]} mb-4 inline-flex`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>

              {task.description && (
                <div className="mt-4 text-gray-600 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                  {task.description}
                </div>
              )}

              {/* أزرار الإجراءات — تأتي من client component */}
              <TaskActions
                taskId={task.id}
                taskStatus={task.status}
              />
            </CardContent>
          </Card>

          {/* الحقول المخصصة */}
          {task.customFieldValues.filter((v) => v.customField).length > 0 && (
            <Card className="border-0 shadow-sm">
              <div className="p-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-800 text-sm">الحقول المخصصة</h2>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {task.customFieldValues
                    .filter((v) => v.customField)
                    .map((cfv) => {
                      let displayValue = "—";
                      if (cfv.textValue) displayValue = cfv.textValue;
                      else if (cfv.numberValue != null) displayValue = String(cfv.numberValue);
                      else if (cfv.dateValue) displayValue = formatDate(cfv.dateValue);
                      else if (cfv.boolValue != null) displayValue = cfv.boolValue ? "نعم ✓" : "لا ✗";
                      else if (cfv.selectedOptions?.length) displayValue = cfv.selectedOptions.join("، ");
                      else if (cfv.personUser) displayValue = cfv.personUser.name;

                      return (
                        <div key={cfv.id}>
                          <p className="text-xs text-gray-400 mb-0.5">{cfv.customField.name}</p>
                          <p className="text-sm text-gray-800 font-medium">{displayValue}</p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* المرفقات */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b border-gray-50">
              <Paperclip className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-800 text-sm">
                المرفقات ({task.attachments.length})
              </h2>
            </div>
            <CardContent className="p-4 space-y-3">
              {session.user.role !== "READER" && (
                <AttachmentUploader taskId={task.id} />
              )}
              {task.attachments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">لا توجد مرفقات بعد</p>
              ) : (
                <div className="space-y-2">
                  {task.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={`/api/attachments/${att.id}`}
                          className="text-sm font-medium text-primary hover:underline truncate block"
                          download={att.fileName}
                        >
                          {att.fileName}
                        </a>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {att.uploadedBy.name} • {formatDate(att.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* التعليقات */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b border-gray-50">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-800 text-sm">
                التعليقات ({task.comments.length})
              </h2>
            </div>
            <CardContent className="p-4 space-y-4">
              {/* صندوق التعليق — client component */}
              {session.user.role !== "READER" && (
                <CommentBox taskId={task.id} />
              )}

              {/* قائمة التعليقات */}
              {task.comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">لا توجد تعليقات بعد</p>
              ) : (
                <div className="space-y-4 mt-4">
                  {task.comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {c.author.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800">{c.author.name}</span>
                          <span className="text-xs text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-4">
          {/* تفاصيل المهمة */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-50 pb-2">
                تفاصيل المهمة
              </h2>

              <div>
                <p className="text-xs text-gray-400 mb-0.5">المشروع</p>
                <Link
                  href={`/projects/${task.project.id}`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  {task.project.name}
                </Link>
              </div>

              {task.primaryAssignee && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">المسؤول الرئيسي</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {task.primaryAssignee.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{task.primaryAssignee.name}</span>
                  </div>
                </div>
              )}

              {task.assignees.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">المشاركون</p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.assignees.map((a) => (
                      <div
                        key={a.userId}
                        className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2 py-0.5"
                        title={a.user.name}
                      >
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary" style={{ fontSize: "9px" }}>
                            {a.user.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">{a.user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {task.dueDate && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">تاريخ الاستحقاق</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span className={`text-sm font-medium ${isOverdue ? "text-red-500" : "text-gray-700"}`}>
                      {formatDate(task.dueDate)}
                      {isOverdue && " ⚠️ متأخرة"}
                    </span>
                  </div>
                </div>
              )}

              {task.issuedAt && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">تاريخ الإصدار</p>
                  <p className="text-sm text-gray-700">{formatDate(task.issuedAt)}</p>
                </div>
              )}

              {task.issuedBy && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">أصدرها</p>
                  <p className="text-sm text-gray-700 font-medium">{task.issuedBy.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* سجل النشاط */}
          <Card className="border-0 shadow-sm">
            <div className="p-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800 text-sm">سجل النشاط</h2>
            </div>
            <CardContent className="p-4 space-y-3">
              {task.activityLogs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">لا يوجد نشاط</p>
              ) : (
                task.activityLogs.map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600 leading-relaxed">{log.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {log.user.name} · {formatRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

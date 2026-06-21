"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowRight, Send, Loader2, MessageSquare, Paperclip,
  Clock, CheckCircle2, AlertCircle, Play, Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS,
  formatDate, formatDateTime, formatRelativeTime,
} from "@/lib/utils";

const NEXT_STATUS_OPTIONS: Record<string, { label: string; value: string; icon: any }[]> = {
  DRAFT: [{ label: "إصدار المهمة", value: "issue", icon: Send }],
  NEW: [{ label: "بدء التنفيذ", value: "IN_PROGRESS", icon: Play }],
  IN_PROGRESS: [
    { label: "إرسال للمراجعة", value: "PENDING_REVIEW", icon: Send },
    { label: "تعليق", value: "ON_HOLD", icon: Pause },
  ],
  PENDING_REVIEW: [
    { label: "اعتماد وإكمال", value: "COMPLETED", icon: CheckCircle2 },
    { label: "إعادة للتنفيذ", value: "IN_PROGRESS", icon: Play },
  ],
  ON_HOLD: [{ label: "استئناف التنفيذ", value: "IN_PROGRESS", icon: Play }],
  COMPLETED: [],
  OVERDUE: [{ label: "استئناف التنفيذ", value: "IN_PROGRESS", icon: Play }],
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  async function loadTask() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("المهمة غير موجودة");
      const data = await res.json();
      setTask(data);
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      router.push("/tasks");
    } finally {
      setIsLoading(false);
    }
  }

  async function issueTask() {
    setIsIssuing(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/issue`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "حدث خطأ");

      toast({
        title: "تم إصدار المهمة بنجاح",
        description: data.emailWarning || `تم إرسال إشعار بريدي للمكلفين`,
        variant: data.emailWarning ? "destructive" : "default",
      });
      loadTask();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsIssuing(false);
    }
  }

  async function changeStatus(newStatus: string) {
    setIsChangingStatus(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("فشل تغيير الحالة");
      toast({ title: "تم تحديث حالة المهمة" });
      loadTask();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function submitComment() {
    if (!comment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, content: comment }),
      });
      if (!res.ok) throw new Error("فشل إرسال التعليق");
      setComment("");
      toast({ title: "تم إضافة التعليق" });
      loadTask();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) return null;

  const nextOptions = NEXT_STATUS_OPTIONS[task.status] || [];
  const canIssue = task.status === "DRAFT" &&
    ["SYSTEM_ADMIN", "PROJECT_MANAGER"].includes(session?.user?.role || "");
  const canChangeStatus = session?.user?.role !== "READER";

  const customFieldValues = task.customFieldValues || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* المسار */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/tasks" className="hover:text-primary">المهام</Link>
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        <span className="text-gray-800 font-medium truncate">{task.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المحتوى الرئيسي */}
        <div className="lg:col-span-2 space-y-5">
          {/* رأس المهمة */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${TASK_STATUS_COLORS[task.status]}`}>
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                    <span className={`badge ${TASK_PRIORITY_COLORS[task.priority]}`}>
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>
                </div>
              </div>

              {task.description && (
                <div className="prose prose-sm text-gray-600 max-w-none">
                  <p className="whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {/* أزرار تغيير الحالة */}
              {canChangeStatus && nextOptions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 flex-wrap">
                  {canIssue ? (
                    <Button
                      onClick={issueTask}
                      disabled={isIssuing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isIssuing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      إصدار المهمة وإرسال الإشعار
                    </Button>
                  ) : (
                    nextOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <Button
                          key={opt.value}
                          variant="outline"
                          size="sm"
                          onClick={() => changeStatus(opt.value)}
                          disabled={isChangingStatus}
                        >
                          <Icon className="h-4 w-4" />
                          {opt.label}
                        </Button>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* الحقول المخصصة */}
          {customFieldValues.filter((v: any) => v.customField).length > 0 && (
            <Card className="border-0 shadow-sm">
              <div className="p-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-800 text-sm">الحقول المخصصة</h2>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {customFieldValues
                    .filter((v: any) => v.customField)
                    .map((cfv: any) => {
                      let displayValue = "—";
                      if (cfv.textValue) displayValue = cfv.textValue;
                      else if (cfv.numberValue !== null && cfv.numberValue !== undefined)
                        displayValue = String(cfv.numberValue);
                      else if (cfv.dateValue) displayValue = formatDate(cfv.dateValue);
                      else if (cfv.boolValue !== null && cfv.boolValue !== undefined)
                        displayValue = cfv.boolValue ? "نعم" : "لا";
                      else if (cfv.selectedOptions?.length > 0)
                        displayValue = cfv.selectedOptions.join("، ");
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

          {/* التعليقات */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b border-gray-50">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-800 text-sm">
                التعليقات ({task.comments?.length || 0})
              </h2>
            </div>
            <CardContent className="p-4 space-y-4">
              {/* إضافة تعليق */}
              <div className="space-y-2">
                <Textarea
                  placeholder="أضف تعليقًا..."
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={submitComment}
                  disabled={!comment.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  إرسال التعليق
                </Button>
              </div>

              {/* قائمة التعليقات */}
              {task.comments?.map((c: any) => (
                <div key={c.id} className="flex gap-3 pt-3 border-t border-gray-50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {c.author.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">{c.author.name}</span>
                      <span className="text-xs text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-4">
          {/* تفاصيل المهمة */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold text-gray-800 text-sm pb-2 border-b border-gray-50">
                تفاصيل المهمة
              </h2>

              <div>
                <p className="text-xs text-gray-400 mb-0.5">المشروع</p>
                <Link href={`/projects/${task.project?.id}`} className="text-sm text-primary hover:underline">
                  {task.project?.name}
                </Link>
              </div>

              {task.primaryAssignee && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">المسؤول الرئيسي</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {task.primaryAssignee.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{task.primaryAssignee.name}</span>
                  </div>
                </div>
              )}

              {task.assignees?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">المشاركون</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {task.assignees.map((a: any) => (
                      <div
                        key={a.userId}
                        className="w-7 h-7 rounded-full bg-sadir-100 flex items-center justify-center"
                        title={a.user.name}
                      >
                        <span className="text-xs font-semibold text-sadir-700">
                          {a.user.name.charAt(0)}
                        </span>
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
                    <span className={`text-sm ${
                      new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"
                        ? "text-red-500 font-medium"
                        : "text-gray-700"
                    }`}>
                      {formatDate(task.dueDate)}
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
                  <p className="text-sm text-gray-700">{task.issuedBy.name}</p>
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
              {task.activityLogs?.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">لا يوجد نشاط</p>
              ) : (
                task.activityLogs?.slice(0, 8).map((log: any) => (
                  <div key={log.id} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">{log.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {log.user.name} • {formatRelativeTime(log.createdAt)}
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

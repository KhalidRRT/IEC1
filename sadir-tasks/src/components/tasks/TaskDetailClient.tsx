"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Send, Loader2, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const NEXT_STATUS_OPTIONS: Record<string, { label: string; value: string }[]> = {
  NEW: [{ label: "بدء التنفيذ", value: "IN_PROGRESS" }],
  IN_PROGRESS: [
    { label: "إرسال للمراجعة", value: "PENDING_REVIEW" },
    { label: "تعليق المهمة", value: "ON_HOLD" },
  ],
  PENDING_REVIEW: [
    { label: "اعتماد وإكمال", value: "COMPLETED" },
    { label: "إعادة للتنفيذ", value: "IN_PROGRESS" },
  ],
  ON_HOLD: [{ label: "استئناف التنفيذ", value: "IN_PROGRESS" }],
  OVERDUE: [{ label: "استئناف التنفيذ", value: "IN_PROGRESS" }],
};

interface TaskActionsProps {
  taskId: string;
  taskStatus: string;
}

export function TaskActions({ taskId, taskStatus }: TaskActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isIssuing, setIsIssuing] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const canIssue =
    taskStatus === "DRAFT" &&
    ["SYSTEM_ADMIN", "PROJECT_MANAGER"].includes(session?.user?.role || "");
  const nextOptions = NEXT_STATUS_OPTIONS[taskStatus] || [];
  const canChangeStatus = session?.user?.role !== "READER";

  async function issueTask() {
    setIsIssuing(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/issue`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      toast({
        title: "تم إصدار المهمة بنجاح",
        description: data.emailWarning || "تم إرسال إشعار بريدي للمكلفين",
        variant: data.emailWarning ? "destructive" : "default",
      });
      router.refresh();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setIsIssuing(false);
    }
  }

  async function changeStatus(newStatus: string) {
    setIsChanging(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("فشل تغيير الحالة");
      toast({ title: "تم تحديث حالة المهمة" });
      router.refresh();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setIsChanging(false);
    }
  }

  if (!canIssue && nextOptions.length === 0) return null;
  if (!canChangeStatus) return null;

  return (
    <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-gray-100">
      {canIssue && (
        <Button
          onClick={issueTask}
          disabled={isIssuing}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isIssuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          إصدار المهمة وإرسال الإشعار
        </Button>
      )}
      {canChangeStatus &&
        nextOptions.map((opt) => (
          <Button
            key={opt.value}
            variant="outline"
            size="sm"
            onClick={() => changeStatus(opt.value)}
            disabled={isChanging}
          >
            {opt.label}
          </Button>
        ))}
    </div>
  );
}

interface CommentBoxProps {
  taskId: string;
}

export function CommentBox({ taskId }: CommentBoxProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitComment() {
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, content: comment }),
      });
      if (!res.ok) throw new Error("فشل إرسال التعليق");
      setComment("");
      toast({ title: "تم إضافة التعليق" });
      router.refresh();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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
        disabled={!comment.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageSquare className="h-4 w-4" />
        )}
        إرسال التعليق
      </Button>
    </div>
  );
}

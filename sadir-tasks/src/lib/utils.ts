import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TaskStatus, TaskPriority, ProjectStatus } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return formatDate(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} ج.ب`;
}

// أسماء الحالات بالعربية
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  DRAFT: "مسودة",
  NEW: "جديدة",
  IN_PROGRESS: "قيد التنفيذ",
  PENDING_REVIEW: "بانتظار مراجعة",
  COMPLETED: "مكتملة",
  OVERDUE: "متأخرة",
  ON_HOLD: "معلقة",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "عالية",
  URGENT: "عاجلة",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "مخطط",
  ACTIVE: "نشط",
  ON_HOLD: "معلق",
  COMPLETED: "مكتمل",
  ARCHIVED: "مؤرشف",
};

// ألوان الحالات
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  PENDING_REVIEW: "bg-purple-100 text-purple-700 border-purple-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  OVERDUE: "bg-red-100 text-red-700 border-red-200",
  ON_HOLD: "bg-slate-100 text-slate-700 border-slate-200",
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNED: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export function isTaskOverdue(dueDate: Date | null, status: TaskStatus): boolean {
  if (!dueDate || status === "COMPLETED") return false;
  return new Date(dueDate) < new Date();
}

export function getTaskUrl(taskId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/tasks/${taskId}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

"use client";

import Link from "next/link";
import { Clock, User } from "lucide-react";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  formatDate,
} from "@/lib/utils";

const KANBAN_COLUMNS = [
  { status: "DRAFT",          color: "bg-gray-100",   header: "bg-gray-200",  dot: "bg-gray-400"  },
  { status: "NEW",            color: "bg-blue-50",    header: "bg-blue-100",  dot: "bg-blue-500"  },
  { status: "IN_PROGRESS",    color: "bg-yellow-50",  header: "bg-yellow-100",dot: "bg-yellow-500"},
  { status: "PENDING_REVIEW", color: "bg-purple-50",  header: "bg-purple-100",dot: "bg-purple-500"},
  { status: "ON_HOLD",        color: "bg-orange-50",  header: "bg-orange-100",dot: "bg-orange-400"},
  { status: "COMPLETED",      color: "bg-green-50",   header: "bg-green-100", dot: "bg-green-500" },
];

interface KanbanTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  primaryAssignee: { id: string; name: string } | null;
  project: { id: string; name: string };
}

interface KanbanBoardProps {
  tasks: KanbanTask[];
}

export default function KanbanBoard({ tasks }: KanbanBoardProps) {
  const grouped = Object.fromEntries(
    KANBAN_COLUMNS.map((col) => [
      col.status,
      tasks.filter((t) => t.status === col.status),
    ])
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" dir="rtl">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = grouped[col.status] || [];
        return (
          <div key={col.status} className="flex-shrink-0 w-64">
            {/* رأس العمود */}
            <div className={`${col.header} rounded-t-lg px-3 py-2 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-gray-700">
                  {TASK_STATUS_LABELS[col.status as keyof typeof TASK_STATUS_LABELS] || col.status}
                </span>
              </div>
              <span className="text-xs text-gray-500 bg-white rounded-full px-1.5 py-0.5 font-medium">
                {colTasks.length}
              </span>
            </div>

            {/* بطاقات المهام */}
            <div className={`${col.color} rounded-b-lg min-h-[200px] p-2 space-y-2`}>
              {colTasks.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">لا توجد مهام</p>
              ) : (
                colTasks.map((task) => (
                  <KanbanCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ task }: { task: KanbanTask }) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "COMPLETED";

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-2">
        <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-2">{task.title}</p>

        <div className="flex items-center justify-between gap-2">
          <span className={`badge text-xs ${TASK_PRIORITY_COLORS[task.priority as keyof typeof TASK_PRIORITY_COLORS]}`}>
            {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}
          </span>
          <span className="text-xs text-gray-400 truncate">{task.project.name}</span>
        </div>

        {task.dueDate && (
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{formatDate(task.dueDate)}</span>
            {isOverdue && <span>⚠️</span>}
          </div>
        )}

        {task.primaryAssignee && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold" style={{ fontSize: "9px" }}>
                {task.primaryAssignee.name.charAt(0)}
              </span>
            </div>
            <span className="text-xs text-gray-500 truncate">{task.primaryAssignee.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

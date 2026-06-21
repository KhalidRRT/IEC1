"use client";

import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, Filter, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TASK_STATUS_LABELS, TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS, TASK_PRIORITY_COLORS,
  formatDate,
} from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ReportData {
  tasks: any[];
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
  };
}

export default function ReportsPage() {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({
    projectId: "",
    assigneeId: "",
    status: "",
    from: "",
    to: "",
  });
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()).catch(() => []),
    ]).then(([p, u]) => {
      setProjects(Array.isArray(p) ? p : []);
      setUsers(Array.isArray(u) ? u : []);
    });
  }, []);

  async function loadReport() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.projectId && filters.projectId !== "all") params.set("projectId", filters.projectId);
      if (filters.assigneeId && filters.assigneeId !== "all") params.set("assigneeId", filters.assigneeId);
      if (filters.status && filters.status !== "all") params.set("status", filters.status);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);

      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error("فشل تحميل التقرير");
      setData(await res.json());
    } catch {
      toast({ title: "خطأ في تحميل التقرير", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  function exportExcel() {
    if (!data) return;
    const params = new URLSearchParams();
    if (filters.projectId && filters.projectId !== "all") params.set("projectId", filters.projectId);
    if (filters.assigneeId && filters.assigneeId !== "all") params.set("assigneeId", filters.assigneeId);
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    window.location.href = `/api/reports/export?${params}`;
    toast({ title: "جارٍ تحميل ملف Excel..." });
  }

  function exportCSV() {
    if (!data) return;
    const headers = ["العنوان", "المشروع", "المسؤول", "الأولوية", "الحالة", "تاريخ الاستحقاق", "تاريخ الإصدار"];
    const rows = data.tasks.map((t) => [
      t.title,
      t.project?.name || "",
      t.primaryAssignee?.name || "",
      TASK_PRIORITY_LABELS[t.priority] || t.priority,
      TASK_STATUS_LABELS[t.status] || t.status,
      t.dueDate ? formatDate(t.dueDate) : "",
      t.issuedAt ? formatDate(t.issuedAt) : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير-المهام-${new Date().toLocaleDateString("ar-SA")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "تم تصدير التقرير بنجاح" });
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
        <p className="text-gray-500 text-sm mt-1">تقارير المهام والمشاريع</p>
      </div>

      {/* الفلاتر */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            فلاتر التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">المشروع</Label>
              <Select
                value={filters.projectId}
                onValueChange={(val) => setFilters({ ...filters, projectId: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">المسؤول</Label>
              <Select
                value={filters.assigneeId}
                onValueChange={(val) => setFilters({ ...filters, assigneeId: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">الحالة</Label>
              <Select
                value={filters.status}
                onValueChange={(val) => setFilters({ ...filters, status: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(TASK_STATUS_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">من تاريخ</Label>
              <Input
                type="date"
                className="h-9"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">إلى تاريخ</Label>
              <Input
                type="date"
                className="h-9"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={loadReport} disabled={isLoading} size="sm">
            <BarChart3 className="h-4 w-4" />
            {isLoading ? "جارٍ التحميل..." : "عرض التقرير"}
          </Button>
        </CardContent>
      </Card>

      {/* نتائج التقرير */}
      {data && (
        <>
          {/* إحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "إجمالي المهام", value: data.stats.total, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "مكتملة", value: data.stats.byStatus.COMPLETED || 0, color: "text-green-600", bg: "bg-green-50" },
              { label: "متأخرة", value: data.stats.overdue, color: "text-red-600", bg: "bg-red-50" },
              { label: "بانتظار مراجعة", value: data.stats.byStatus.PENDING_REVIEW || 0, color: "text-purple-600", bg: "bg-purple-50" },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* جدول النتائج */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800">
                النتائج ({data.tasks.length} مهمة)
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportExcel}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50">
                    <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">العنوان</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">المشروع</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">المسؤول</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الأولوية</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الحالة</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الاستحقاق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">{task.title}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{task.project?.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {task.primaryAssignee?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${TASK_PRIORITY_COLORS[task.priority]}`}>
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${TASK_STATUS_COLORS[task.status]}`}>
                          {TASK_STATUS_LABELS[task.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {task.dueDate ? formatDate(task.dueDate) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, Save, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(2, "عنوان المهمة مطلوب"),
  description: z.string().optional(),
  projectId: z.string().min(1, "يرجى اختيار المشروع"),
  primaryAssigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Project { id: string; name: string; }
interface User { id: string; name: string; email: string; }
interface CustomField {
  id: string; name: string; type: string; isRequired: boolean;
  options: { id: string; label: string }[];
}

const PRIORITY_LABELS = { LOW: "منخفضة", MEDIUM: "متوسطة", HIGH: "عالية", URGENT: "عاجلة" };

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultProjectId = searchParams.get("projectId") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { projectId: defaultProjectId, priority: "MEDIUM" },
  });

  const selectedProjectId = watch("projectId");

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()).catch(() => []),
    ]).then(([projectsData, usersData]) => {
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    });
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetch(`/api/projects/${selectedProjectId}`)
        .then((r) => r.json())
        .then((data) => setCustomFields(data.customFields || []))
        .catch(() => setCustomFields([]));
    }
  }, [selectedProjectId]);

  const saveTask = async (data: FormData, isDraft: boolean) => {
    setIsLoading(true);
    try {
      // بناء قيم الحقول المخصصة
      const customFieldValues = customFields
        .filter((f) => fieldValues[f.id] !== undefined && fieldValues[f.id] !== "")
        .map((f) => {
          const val = fieldValues[f.id];
          const base = { customFieldId: f.id };
          if (f.type === "NUMBER") return { ...base, numberValue: parseFloat(val) };
          if (f.type === "DATE") return { ...base, dateValue: val };
          if (f.type === "YES_NO") return { ...base, boolValue: val === true || val === "true" };
          if (f.type === "SINGLE_SELECT") return { ...base, selectedOptions: [val] };
          if (f.type === "MULTI_SELECT") return { ...base, selectedOptions: Array.isArray(val) ? val : [val] };
          if (f.type === "PERSON") return { ...base, personUserId: val };
          return { ...base, textValue: val };
        });

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          assigneeIds: selectedAssignees,
          isDraft,
          customFieldValues,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      const task = await res.json();
      toast({
        title: isDraft ? "تم حفظ المهمة كمسودة" : "تم إنشاء المهمة بنجاح",
      });
      router.push(`/tasks/${task.id}`);
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFieldInput = (field: CustomField) => {
    const value = fieldValues[field.id];
    const onChange = (val: any) => setFieldValues((prev) => ({ ...prev, [field.id]: val }));

    switch (field.type) {
      case "SHORT_TEXT":
      case "URL":
        return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />;
      case "LONG_TEXT":
        return <Textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} />;
      case "NUMBER":
        return <Input type="number" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
      case "DATE":
        return <Input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
      case "YES_NO":
        return (
          <Select value={value?.toString() || ""} onValueChange={(v) => onChange(v === "true")}>
            <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">نعم</SelectItem>
              <SelectItem value="false">لا</SelectItem>
            </SelectContent>
          </Select>
        );
      case "SINGLE_SELECT":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "PERSON":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder="اختر شخصًا..." /></SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* المسار */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/tasks" className="hover:text-primary">المهام</Link>
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        <span className="text-gray-800 font-medium">مهمة جديدة</span>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>إنشاء مهمة جديدة</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            {/* عنوان المهمة */}
            <div className="space-y-2">
              <Label>عنوان المهمة <span className="text-destructive">*</span></Label>
              <Input placeholder="ما هي المهمة؟" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            {/* الوصف */}
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea placeholder="تفاصيل المهمة والمتطلبات..." rows={4} {...register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* المشروع */}
              <div className="space-y-2">
                <Label>المشروع <span className="text-destructive">*</span></Label>
                <Select
                  defaultValue={defaultProjectId}
                  onValueChange={(val) => setValue("projectId", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مشروعًا" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.projectId && <p className="text-xs text-destructive">{errors.projectId.message}</p>}
              </div>

              {/* الأولوية */}
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select defaultValue="MEDIUM" onValueChange={(val) => setValue("priority", val as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* المسؤول الرئيسي */}
              <div className="space-y-2">
                <Label>المسؤول الرئيسي</Label>
                <Select onValueChange={(val) => setValue("primaryAssigneeId", val)}>
                  <SelectTrigger><SelectValue placeholder="اختر شخصًا" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* تاريخ الاستحقاق */}
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input type="date" {...register("dueDate")} />
              </div>
            </div>

            {/* الحقول المخصصة */}
            {customFields.length > 0 && (
              <div className="border-t pt-5 space-y-4">
                <h3 className="font-medium text-gray-800 text-sm">الحقول المخصصة</h3>
                {customFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.name}
                      {field.isRequired && <span className="text-destructive mr-1">*</span>}
                    </Label>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
            )}

            {/* الأزرار */}
            <div className="flex gap-3 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit((data) => saveTask(data, true))}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ كمسودة
              </Button>
              <Button
                type="button"
                onClick={handleSubmit((data) => saveTask(data, false))}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إنشاء المهمة
              </Button>
              <Link href="/tasks">
                <Button type="button" variant="ghost" disabled={isLoading}>إلغاء</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

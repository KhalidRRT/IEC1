"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "اسم المشروع مطلوب ويجب أن يكون حرفين على الأقل"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  templateId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Template {
  id: string;
  name: string;
  description: string | null;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data))
      .catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          templateId: data.templateId === "none" ? undefined : data.templateId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      const project = await res.json();
      toast({ title: "تم إنشاء المشروع بنجاح", variant: "default" });
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* المسار */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/projects" className="hover:text-primary transition-colors">
          المشاريع
        </Link>
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        <span className="text-gray-800 font-medium">مشروع جديد</span>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>إنشاء مشروع جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* اسم المشروع */}
            <div className="space-y-2">
              <Label htmlFor="name">
                اسم المشروع <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="مثال: إدارة محتوى سدير إكس"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* وصف المشروع */}
            <div className="space-y-2">
              <Label htmlFor="description">وصف المشروع</Label>
              <Textarea
                id="description"
                placeholder="وصف مختصر للمشروع وأهدافه..."
                rows={3}
                {...register("description")}
                disabled={isLoading}
              />
            </div>

            {/* القالب */}
            <div className="space-y-2">
              <Label>قالب المشروع (اختياري)</Label>
              <Select onValueChange={(val) => setValue("templateId", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر قالبًا أو ابدأ من الصفر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون قالب</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                القالب يُنشئ الحقول المخصصة تلقائيًا لهذا المشروع
              </p>
            </div>

            {/* التواريخ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">تاريخ النهاية</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جارٍ الإنشاء...
                  </>
                ) : (
                  "إنشاء المشروع"
                )}
              </Button>
              <Link href="/projects">
                <Button type="button" variant="outline" disabled={isLoading}>
                  إلغاء
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

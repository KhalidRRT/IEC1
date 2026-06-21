"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const FIELD_TYPE_LABELS: Record<string, string> = {
  SHORT_TEXT: "نص قصير",
  LONG_TEXT: "نص طويل",
  NUMBER: "رقم",
  DATE: "تاريخ",
  SINGLE_SELECT: "اختيار واحد",
  MULTI_SELECT: "اختيار متعدد",
  PERSON: "شخص",
  URL: "رابط",
  YES_NO: "نعم / لا",
};

interface CustomField {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  showInTable: boolean;
  isExecutorEditable: boolean;
  options: { id: string; label: string }[];
}

export default function CustomFieldsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [fields, setFields] = useState<CustomField[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // نموذج الحقل الجديد
  const [newField, setNewField] = useState({
    name: "",
    type: "SHORT_TEXT",
    isRequired: false,
    showInTable: true,
    isExecutorEditable: true,
    isFilterable: false,
    options: [] as string[],
    newOption: "",
  });

  useEffect(() => {
    loadFields();
  }, [projectId]);

  async function loadFields() {
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setFields(data.customFields || []);
    }
  }

  async function addField() {
    if (!newField.name.trim()) {
      toast({ title: "يرجى إدخال اسم الحقل", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: newField.name,
          type: newField.type,
          isRequired: newField.isRequired,
          showInTable: newField.showInTable,
          isExecutorEditable: newField.isExecutorEditable,
          isFilterable: newField.isFilterable,
          options: newField.options,
          order: fields.length,
        }),
      });

      if (!res.ok) throw new Error("فشل إضافة الحقل");

      toast({ title: "تم إضافة الحقل بنجاح" });
      setNewField({ name: "", type: "SHORT_TEXT", isRequired: false, showInTable: true, isExecutorEditable: true, isFilterable: false, options: [], newOption: "" });
      setIsAdding(false);
      loadFields();
    } catch {
      toast({ title: "خطأ في إضافة الحقل", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteField(fieldId: string) {
    if (!confirm("هل تريد حذف هذا الحقل؟ سيتم حذف جميع قيمه أيضًا.")) return;

    const res = await fetch(`/api/custom-fields?fieldId=${fieldId}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "تم حذف الحقل" });
      loadFields();
    }
  }

  const needsOptions = ["SINGLE_SELECT", "MULTI_SELECT"].includes(newField.type);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* المسار */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/projects" className="hover:text-primary">المشاريع</Link>
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        <Link href={`/projects/${projectId}`} className="hover:text-primary">تفاصيل المشروع</Link>
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        <span className="text-gray-800 font-medium">الحقول المخصصة</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الحقول المخصصة</h1>
          <p className="text-sm text-gray-500 mt-1">أضف حقولاً مخصصة لمهام هذا المشروع</p>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4" />
          إضافة حقل
        </Button>
      </div>

      {/* نموذج إضافة حقل */}
      {isAdding && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">حقل جديد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الحقل *</Label>
                <Input
                  placeholder="مثال: نوع المحتوى"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>نوع الحقل</Label>
                <Select
                  value={newField.type}
                  onValueChange={(val) => setNewField({ ...newField, type: val, options: [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* خيارات الحقل */}
            {needsOptions && (
              <div className="space-y-2">
                <Label>الخيارات</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="أضف خيارًا..."
                    value={newField.newOption}
                    onChange={(e) => setNewField({ ...newField, newOption: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newField.newOption.trim()) {
                        setNewField({
                          ...newField,
                          options: [...newField.options, newField.newOption.trim()],
                          newOption: "",
                        });
                      }
                    }}
                  />
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => {
                      if (newField.newOption.trim()) {
                        setNewField({
                          ...newField,
                          options: [...newField.options, newField.newOption.trim()],
                          newOption: "",
                        });
                      }
                    }}
                  >
                    إضافة
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newField.options.map((opt, idx) => (
                    <span key={idx} className="flex items-center gap-1 badge bg-secondary text-secondary-foreground">
                      {opt}
                      <button
                        onClick={() =>
                          setNewField({
                            ...newField,
                            options: newField.options.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-gray-400 hover:text-red-500 mr-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* إعدادات الحقل */}
            <div className="flex flex-wrap gap-4">
              {[
                { key: "isRequired", label: "إجباري" },
                { key: "showInTable", label: "يظهر في الجدول" },
                { key: "isExecutorEditable", label: "المنفذ يستطيع التعديل" },
                { key: "isFilterable", label: "قابل للفلترة" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(newField as any)[key]}
                    onChange={(e) => setNewField({ ...newField, [key]: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={addField} disabled={isLoading} size="sm">
                {isLoading ? "جارٍ الحفظ..." : "حفظ الحقل"}
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setIsAdding(false)}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة الحقول */}
      {fields.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-gray-400">
            <p>لا توجد حقول مخصصة بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => (
            <Card key={field.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm">{field.name}</span>
                    {field.isRequired && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {FIELD_TYPE_LABELS[field.type]}
                    </Badge>
                    {field.showInTable && (
                      <span className="text-xs text-gray-400">يظهر في الجدول</span>
                    )}
                    {!field.isExecutorEditable && (
                      <span className="text-xs text-orange-500">المنفذ لا يستطيع التعديل</span>
                    )}
                  </div>
                  {field.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.options.slice(0, 5).map((opt) => (
                        <span key={opt.id} className="text-xs badge bg-gray-100 text-gray-600">
                          {opt.label}
                        </span>
                      ))}
                      {field.options.length > 5 && (
                        <span className="text-xs text-gray-400">+{field.options.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteField(field.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

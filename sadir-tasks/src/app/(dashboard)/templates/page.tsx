import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LayoutTemplate, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FIELD_TYPE_LABELS: Record<string, string> = {
  SHORT_TEXT: "نص قصير", LONG_TEXT: "نص طويل", NUMBER: "رقم",
  DATE: "تاريخ", SINGLE_SELECT: "اختيار واحد", MULTI_SELECT: "اختيار متعدد",
  PERSON: "شخص", URL: "رابط", YES_NO: "نعم / لا",
};

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!["SYSTEM_ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const templates = await prisma.projectTemplate.findMany({
    include: {
      fields: { orderBy: { order: "asc" } },
      _count: { select: { projects: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">قوالب المشاريع</h1>
        <p className="text-gray-500 text-sm mt-1">
          القوالب الجاهزة للحقول المخصصة — تُطبَّق تلقائيًا عند إنشاء مشروع جديد
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {templates.map((template) => (
          <Card key={template.id} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{template.description}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400 mb-3">
                {template.fields.length} حقل مخصص • مستخدم في {template._count.projects} مشروع
              </p>
              <div className="space-y-1.5">
                {template.fields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{field.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {FIELD_TYPE_LABELS[field.type] || field.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

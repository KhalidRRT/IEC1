"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Search, UserCheck, UserX, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { primaryTasks: number; assignedTasks: number };
}

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "", email: "", password: "", role: "EXECUTOR",
  });

  useEffect(() => {
    if (session && !["SYSTEM_ADMIN", "PROJECT_MANAGER", "SUPERVISOR"].includes(session.user.role)) {
      router.push("/dashboard");
    }
  }, [session]);

  useEffect(() => {
    loadUsers();
  }, [search]);

  async function loadUsers() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/users?${params}`);
    if (res.ok) setUsers(await res.json());
  }

  async function createUser() {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({ title: "يرجى تعبئة جميع الحقول", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast({ title: "تم إنشاء المستخدم بنجاح" });
      setIsDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "EXECUTOR" });
      loadUsers();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
    });
    if (res.ok) {
      toast({ title: "تم تحديث حالة المستخدم" });
      loadUsers();
    }
  }

  const isAdmin = session?.user?.role === "SYSTEM_ADMIN";

  return (
    <div className="p-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المستخدمون</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} مستخدم</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            مستخدم جديد
          </Button>
        )}
      </div>

      {/* البحث */}
      <div className="relative mb-5 max-w-xs">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* جدول المستخدمين */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">المستخدم</th>
              <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الدور</th>
              <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الحالة</th>
              <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">المهام</th>
              <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">آخر دخول</th>
              {isAdmin && (
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">إجراءات</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${ROLE_COLORS[user.role as any]}`}>
                    {ROLE_LABELS[user.role as any]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${
                    user.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {user.status === "ACTIVE" ? "نشط" : "غير نشط"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-500">
                    {user._count.primaryTasks + user._count.assignedTasks}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "لم يسجل"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.status)}
                      className="text-xs text-gray-400 hover:text-primary transition-colors"
                    >
                      {user.status === "ACTIVE" ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* نموذج إنشاء مستخدم */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="اسم المستخدم"
              />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="8 أحرف على الأقل"
              />
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select
                value={newUser.role}
                onValueChange={(val) => setNewUser({ ...newUser, role: val })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createUser} disabled={isLoading}>
              {isLoading ? "جارٍ الإنشاء..." : "إنشاء المستخدم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

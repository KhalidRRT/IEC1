import { UserRole } from "@prisma/client";

// التسلسل الهرمي للأدوار
const ROLE_HIERARCHY: Record<UserRole, number> = {
  SYSTEM_ADMIN: 5,
  PROJECT_MANAGER: 4,
  SUPERVISOR: 3,
  EXECUTOR: 2,
  READER: 1,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isSystemAdmin(role: UserRole): boolean {
  return role === UserRole.SYSTEM_ADMIN;
}

export function isProjectManager(role: UserRole): boolean {
  return role === UserRole.PROJECT_MANAGER || role === UserRole.SYSTEM_ADMIN;
}

export function isSupervisor(role: UserRole): boolean {
  return hasRole(role, UserRole.SUPERVISOR);
}

export function isExecutor(role: UserRole): boolean {
  return hasRole(role, UserRole.EXECUTOR);
}

// صلاحيات المستخدمين
export const Permissions = {
  // صلاحيات المستخدمين
  canManageUsers: (role: UserRole) => isSystemAdmin(role),
  canViewUsers: (role: UserRole) => isSupervisor(role),

  // صلاحيات المشاريع
  canCreateProject: (role: UserRole) => isProjectManager(role),
  canEditProject: (role: UserRole, isOwner: boolean) =>
    isSystemAdmin(role) || (isProjectManager(role) && isOwner),
  canDeleteProject: (role: UserRole) => isSystemAdmin(role),
  canViewProject: (role: UserRole) => isExecutor(role),
  canManageProjectMembers: (role: UserRole, isOwner: boolean) =>
    isSystemAdmin(role) || (isProjectManager(role) && isOwner),

  // صلاحيات المهام
  canCreateTask: (role: UserRole) => isSupervisor(role),
  canIssueTask: (role: UserRole) => isProjectManager(role),
  canEditAnyTask: (role: UserRole) => isSystemAdmin(role),
  canEditAssignedTask: (role: UserRole) => isExecutor(role),
  canDeleteTask: (role: UserRole) => isSystemAdmin(role),
  canChangeTaskStatus: (role: UserRole) => isExecutor(role),
  canReassignTask: (role: UserRole) => isSupervisor(role),
  canSubmitForReview: (role: UserRole) => role === UserRole.EXECUTOR,

  // صلاحيات الحقول المخصصة
  canManageGlobalCustomFields: (role: UserRole) => isSystemAdmin(role),
  canManageProjectCustomFields: (role: UserRole, isOwner: boolean) =>
    isSystemAdmin(role) || (isProjectManager(role) && isOwner),
  canEditCustomFieldValue: (role: UserRole, isExecutorEditable: boolean) =>
    isSupervisor(role) || (role === UserRole.EXECUTOR && isExecutorEditable),

  // صلاحيات التعليقات
  canAddComment: (role: UserRole) => isExecutor(role),
  canDeleteComment: (role: UserRole, isAuthor: boolean) =>
    isSystemAdmin(role) || isAuthor,

  // صلاحيات المرفقات
  canUploadAttachment: (role: UserRole) => isExecutor(role),
  canDeleteAttachment: (role: UserRole, isOwner: boolean) =>
    isSystemAdmin(role) || (isSupervisor(role) && isOwner),

  // صلاحيات القوالب
  canManageTemplates: (role: UserRole) => isSystemAdmin(role),

  // صلاحيات التقارير
  canViewAllReports: (role: UserRole) => isSystemAdmin(role),
  canViewProjectReports: (role: UserRole, isOwner: boolean) =>
    isSystemAdmin(role) || (isProjectManager(role) && isOwner),
  canExportData: (role: UserRole) => isProjectManager(role),

  // صلاحيات سجل النشاط
  canViewActivityLog: (role: UserRole) => isExecutor(role),
};

// أسماء الأدوار بالعربية
export const ROLE_LABELS: Record<UserRole, string> = {
  SYSTEM_ADMIN: "مدير النظام",
  PROJECT_MANAGER: "مدير المشروع",
  SUPERVISOR: "مشرف",
  EXECUTOR: "منفذ",
  READER: "قارئ",
};

// ألوان الأدوار
export const ROLE_COLORS: Record<UserRole, string> = {
  SYSTEM_ADMIN: "bg-red-100 text-red-800",
  PROJECT_MANAGER: "bg-blue-100 text-blue-800",
  SUPERVISOR: "bg-purple-100 text-purple-800",
  EXECUTOR: "bg-green-100 text-green-800",
  READER: "bg-gray-100 text-gray-800",
};

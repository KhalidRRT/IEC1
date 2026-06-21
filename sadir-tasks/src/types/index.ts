import { UserRole, TaskStatus, TaskPriority, ProjectStatus, CustomFieldType, ActivityType, NotificationStatus } from "@prisma/client";

export type { UserRole, TaskStatus, TaskPriority, ProjectStatus, CustomFieldType, ActivityType, NotificationStatus };

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  completionRate: number;
  startDate: Date | null;
  endDate: Date | null;
  owner: { id: string; name: string };
  _count: { tasks: number; members: number };
}

export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  issuedAt: Date | null;
  project: { id: string; name: string };
  primaryAssignee: { id: string; name: string; image?: string | null } | null;
  assignees: { user: { id: string; name: string; image?: string | null } }[];
}

export interface TaskDetail extends TaskSummary {
  description: string | null;
  issuedBy: { id: string; name: string } | null;
  customFieldValues: CustomFieldValueDetail[];
  comments: CommentDetail[];
  attachments: AttachmentDetail[];
  activityLogs: ActivityLogDetail[];
}

export interface CustomFieldDetail {
  id: string;
  name: string;
  type: CustomFieldType;
  description: string | null;
  isRequired: boolean;
  showInTable: boolean;
  showInReport: boolean;
  isExecutorEditable: boolean;
  isFilterable: boolean;
  order: number;
  options: { id: string; label: string; color?: string | null; order: number }[];
}

export interface CustomFieldValueDetail {
  id: string;
  customFieldId: string;
  customField: { name: string; type: CustomFieldType };
  textValue: string | null;
  numberValue: number | null;
  dateValue: Date | null;
  boolValue: boolean | null;
  selectedOptions: string[];
  personUser: { id: string; name: string } | null;
}

export interface CommentDetail {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string; image?: string | null };
  attachments: AttachmentDetail[];
}

export interface AttachmentDetail {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  createdAt: Date;
  uploadedBy: { id: string; name: string };
}

export interface ActivityLogDetail {
  id: string;
  type: ActivityType;
  description: string;
  createdAt: Date;
  user: { id: string; name: string; image?: string | null };
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  newTasks: number;
  inProgressTasks: number;
  pendingReviewTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
  isOverdue?: boolean;
  search?: string;
}

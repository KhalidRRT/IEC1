"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ClipboardList,
  Users,
  Settings,
  FileText,
  LayoutTemplate,
  LogOut,
  LayoutGrid,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: UserRole;
  isCollapsed?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/projects", label: "المشاريع", icon: FolderKanban },
  { href: "/tasks", label: "المهام", icon: CheckSquare },
  { href: "/my-tasks", label: "مهامي", icon: ClipboardList },
  {
    href: "/users",
    label: "المستخدمون",
    icon: Users,
    roles: ["SYSTEM_ADMIN", "PROJECT_MANAGER"] as UserRole[],
  },
  {
    href: "/templates",
    label: "القوالب",
    icon: LayoutTemplate,
    roles: ["SYSTEM_ADMIN"] as UserRole[],
  },
  {
    href: "/reports",
    label: "التقارير",
    icon: FileText,
    roles: ["SYSTEM_ADMIN", "PROJECT_MANAGER"] as UserRole[],
  },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export default function Sidebar({ userName, userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col h-full w-64 bg-white border-l border-gray-200 shadow-sm">
      {/* الشعار */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-xl flex-shrink-0">
          <LayoutGrid className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-base leading-tight">سدير مهام</h1>
          <p className="text-xs text-gray-400">إدارة المشاريع</p>
        </div>
      </div>

      {/* التنقل */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-link",
                active && "active"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 flex-shrink-0", active ? "text-primary" : "")} size={18} />
              <span>{item.label}</span>
              {active && <ChevronLeft className="mr-auto h-3.5 w-3.5 text-primary opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* معلومات المستخدم */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">
              {userName.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={cn("badge text-xs", ROLE_COLORS[userRole])}>
            {ROLE_LABELS[userRole]}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            خروج
          </button>
        </div>
      </div>
    </aside>
  );
}

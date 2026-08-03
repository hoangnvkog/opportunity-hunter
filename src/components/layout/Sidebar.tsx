"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Star,
  Eye,
  Bell,
  CalendarDays,
  Brain,
  Settings,
  Zap,
} from "lucide-react";

const navigation = [
  { name: "Bảng điều khiển", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Cơ hội",
    href: "/opportunities",
    icon: Briefcase,
  },
  {
    name: "Đã lưu",
    href: "/saved",
    icon: Star,
  },
  {
    name: "Theo dõi",
    href: "/watchlists",
    icon: Eye,
  },
  {
    name: "Cảnh báo",
    href: "/alerts",
    icon: Bell,
  },
  {
    name: "Nhận định",
    href: "/insights",
    icon: Brain,
  },
  {
    name: "Tổng hợp tuần",
    href: "/digests",
    icon: CalendarDays,
  },
  {
    name: "Cài đặt",
    href: "/settings/billing",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-secondary border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Zap className="h-6 w-6" />
          <span>Opportunity Hunter</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          © 2026 Opportunity Hunter
        </div>
      </div>
    </div>
  );
}

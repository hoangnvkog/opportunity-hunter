"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  BarChart3,
  FileText,
  Zap,
} from "lucide-react";

const adminNav = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Revenue", href: "/admin/revenue", icon: DollarSign },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Logs", href: "/admin/logs", icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-56 flex-col border-r bg-secondary">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Zap className="h-5 w-5" />
          <span>Admin</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {adminNav.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary/80"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/80"
        >
          ← Back to app
        </Link>
      </div>
    </div>
  );
}
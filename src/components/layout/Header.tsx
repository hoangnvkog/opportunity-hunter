"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUnreadAlertCountAction } from "@/actions/alerts.actions";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";

export function Header() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const count = await getUnreadAlertCountAction();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread alert count:", error);
      }
    }

    fetchUnreadCount();
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-xl font-semibold">Opportunity Hunter</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Link
          href="/alerts"
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}

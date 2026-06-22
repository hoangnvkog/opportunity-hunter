"use client";

import { Bell, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUnreadAlertCountAction } from "@/actions/alerts.actions";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";

export function Header() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingDigestCount, setPendingDigestCount] = useState(0);

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

  useEffect(() => {
    let cancelled = false;
    async function fetchDigestCount() {
      try {
        const res = await fetch("/api/digests/pending-count", { cache: "no-store" });
        if (!res.ok) return;
        const json: unknown = await res.json();
        if (cancelled) return;
        if (json && typeof json === "object" && "count" in json && typeof json.count === "number") {
          setPendingDigestCount(json.count);
        }
      } catch (error) {
        console.error("Failed to fetch pending digest count:", error);
      }
    }
    fetchDigestCount();
    return () => { cancelled = true; };
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-xl font-semibold">Opportunity Hunter</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Link
          href="/digests"
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Weekly Digests"
          title="Weekly Digests"
        >
          <CalendarDays className="h-5 w-5" />
          {pendingDigestCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
              {pendingDigestCount > 99 ? "99+" : pendingDigestCount}
            </span>
          )}
        </Link>
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

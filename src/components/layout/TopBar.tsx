"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Activity } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { getLatestPipelineRunAction } from "@/actions/pipeline.actions";

interface PipelineSnapshot {
  lastStatus: string | null;
  lastRun: string | null;
}

/**
 * Top bar shown above every authenticated page. Pipeline health badge on the
 * left, global search in the middle, user/notifications on the right.
 *
 * Self-contained: pulls pipeline status via the existing server action.
 */
export function TopBar() {
  const [snapshot, setSnapshot] = useState<PipelineSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const data = await getLatestPipelineRunAction();
        if (cancelled) return;
        if (data) {
          setSnapshot({
            lastStatus: data.lastStatus,
            lastRun: data.lastRun,
          });
        }
      } catch {
        /* non-fatal */
      }
    };
    fetchStatus();
    const id = setInterval(fetchStatus, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const variant = statusVariant(snapshot?.lastStatus);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur">
      {/* Pipeline status badge */}
      <div className="flex items-center gap-2">
        <span
          className={
            snapshot?.lastStatus === "running"
              ? "radar-pulse h-2 w-2 rounded-full bg-signal-info"
              : snapshot?.lastStatus === "failed"
                ? "h-2 w-2 rounded-full bg-signal-risk"
                : "h-2 w-2 rounded-full bg-signal-hot"
          }
        />
        <Badge variant={variant} className="gap-1">
          <Activity className="h-3 w-3" />
          {snapshot?.lastStatus === "running"
            ? "Pipeline đang chạy"
            : snapshot?.lastStatus === "failed"
              ? "Pipeline lỗi"
              : snapshot?.lastStatus === "success"
                ? "Pipeline ổn"
                : "Pipeline chờ"}
        </Badge>
      </div>

      {/* Search */}
      <form
        action="/opportunities"
        className="ml-auto hidden flex-1 max-w-md md:flex"
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Tìm cơ hội, pain point, cluster..."
            className="pl-9"
          />
        </div>
      </form>

      {/* Notifications + user */}
      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <Button asChild variant="ghost" size="icon">
          <Link href="/alerts" aria-label="Cảnh báo">
            <Bell className="h-5 w-5" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                U
              </span>
              <span className="hidden sm:inline">Tài khoản</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Hồ sơ</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/billing">Thanh toán</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/login">Đăng xuất</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
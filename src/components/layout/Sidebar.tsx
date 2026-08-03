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
  Target,
  Layers,
  TrendingUp,
  FileText,
  Sparkles,
  Wallet,
  PieChart,
  Activity,
  FlaskConical,
  Rocket,
  Coins,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navigation: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { name: "Bảng điều khiển", href: "/dashboard", icon: LayoutDashboard },
      { name: "Radar cơ hội", href: "/opportunities", icon: Target },
      { name: "Pipeline AI", href: "/dashboard/validated", icon: Activity },
    ],
  },
  {
    label: "Phân tích",
    items: [
      { name: "Điểm đau", href: "/dashboard/validated", icon: FlaskConical },
      { name: "Cụm vấn đề", href: "/dashboard/forecasts", icon: Layers },
      { name: "Nhận định AI", href: "/insights", icon: Brain },
      { name: "Bằng chứng thị trường", href: "/dashboard/intelligence", icon: PieChart },
      { name: "Dự báo", href: "/dashboard/forecasts", icon: TrendingUp },
    ],
  },
  {
    label: "Đầu tư",
    items: [
      { name: "Investment Score", href: "/dashboard/investment", icon: Wallet },
      { name: "Investment Committee", href: "/dashboard/committee", icon: Sparkles },
      { name: "Investment Memo", href: "/dashboard/memos", icon: FileText },
      { name: "Venture Report", href: "/dashboard/venture-report", icon: Briefcase },
      { name: "Portfolio", href: "/dashboard/portfolio", icon: Coins },
      { name: "Backtesting", href: "/dashboard/backtesting", icon: Activity },
    ],
  },
  {
    label: "Xây dựng startup",
    items: [
      { name: "Venture Studio", href: "/dashboard/venture", icon: Rocket },
      { name: "Financial Model", href: "/dashboard/financial", icon: Wallet },
      { name: "Venture Score", href: "/dashboard/venture-score", icon: Star },
    ],
  },
  {
    label: "Cá nhân",
    items: [
      { name: "Đã lưu", href: "/saved", icon: Star },
      { name: "Watchlists", href: "/watchlists", icon: Eye },
      { name: "Cảnh báo", href: "/alerts", icon: Bell },
      { name: "Digest tuần", href: "/digests", icon: CalendarDays },
      { name: "Cài đặt", href: "/settings/billing", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Zap className="h-5 w-5" />
          </span>
          <span>Opportunity Hunter</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navigation.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          © 2026 Opportunity Hunter
        </div>
      </div>
    </div>
  );
}
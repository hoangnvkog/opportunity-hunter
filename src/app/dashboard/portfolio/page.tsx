/**
 * Sprint 60: Portfolio Intelligence Dashboard Page
 * UI-4 polish — AppLayout, PageHeader, MetricCard, signal tones, EmptyState.
 */

import { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, scoreVariant } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Star, Archive, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { getStatistics, listPortfolioCards } from "@/lib/services/portfolio.service";
import { PortfolioStatusLabels, PriorityLabels } from "@/types/portfolio";
import type { PortfolioCard, PortfolioStatistics } from "@/types/portfolio";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Portfolio Intelligence"
          description="Quản lý danh mục cơ hội — health tracking, lifecycle monitoring."
          badge={<Badge variant="ai-soft">Sprint 60</Badge>}
        />

        <Suspense fallback={<div className="h-8 animate-pulse bg-muted rounded" />}>
          <PortfolioStatistics />
        </Suspense>

        <Suspense fallback={<div className="h-8 animate-pulse bg-muted rounded" />}>
          <PortfolioTabs />
        </Suspense>
      </div>
    </AppLayout>
  );
}

// ==========================================
// STATISTICS SECTION — MetricCard grid
// ==========================================

async function PortfolioStatistics() {
  const stats = await getStatistics();

  const healthTone =
    stats.average_health !== null
      ? stats.average_health >= 80
        ? "hot"
        : stats.average_health >= 60
          ? "good"
          : stats.average_health >= 40
            ? "watch"
            : "risk"
      : "default";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Tổng items"
        value={stats.total_items}
        icon={<Star className="h-4 w-4" />}
      />
      <MetricCard
        title="Health trung bình"
        value={stats.average_health !== null ? stats.average_health.toFixed(1) : "N/A"}
        tone={healthTone}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        title="Đang theo dõi"
        value={stats.by_status.WATCHLIST ?? 0}
        icon={<Eye className="h-4 w-4" />}
      />
      <MetricCard
        title="Critical priority"
        value={stats.by_priority.CRITICAL ?? 0}
        tone="risk"
        icon={<TrendingDown className="h-4 w-4" />}
      />
    </div>
  );
}

// ==========================================
// TABS SECTION
// ==========================================

async function PortfolioTabs() {
  const [all, favorites, needsReview, highHealth, lowHealth] = await Promise.all([
    listPortfolioCards({ archived: false }, { field: "created_at", direction: "desc" }, 50),
    listPortfolioCards({ favorite: true, archived: false }, { field: "health_score", direction: "desc" }, 20),
    listPortfolioCards({ needs_review: true, archived: false }, { field: "last_reviewed_at", direction: "asc" }, 20),
    listPortfolioCards({ min_health: 80, archived: false }, { field: "health_score", direction: "desc" }, 20),
    listPortfolioCards({ max_health: 50, archived: false }, { field: "health_score", direction: "asc" }, 20),
  ]);

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all">Tất cả ({all.length})</TabsTrigger>
        <TabsTrigger value="favorites">Yêu thích ({favorites.length})</TabsTrigger>
        <TabsTrigger value="needs-review">Cần review ({needsReview.length})</TabsTrigger>
        <TabsTrigger value="high-health">Health cao ({highHealth.length})</TabsTrigger>
        <TabsTrigger value="low-health">Health thấp ({lowHealth.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <PortfolioTableCard title="Tất cả items" description="Tổng quan danh mục" items={all} />
      </TabsContent>

      <TabsContent value="favorites">
        <PortfolioTableCard title="Cơ hội yêu thích" description="Các cơ hội đã star" items={favorites} />
      </TabsContent>

      <TabsContent value="needs-review">
        <PortfolioTableCard title="Cần review" description="Chưa review 30+ ngày" items={needsReview} />
      </TabsContent>

      <TabsContent value="high-health">
        <PortfolioTableCard title="Health cao nhất" description="Top performing (80+)" items={highHealth} />
      </TabsContent>

      <TabsContent value="low-health">
        <PortfolioTableCard title="Health thấp nhất" description="Cần chú ý (<50)" items={lowHealth} />
      </TabsContent>
    </Tabs>
  );
}

function PortfolioTableCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: PortfolioCard[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <EmptyState
            icon={<Star className="h-5 w-5" />}
            title="Không có item"
            description={description}
          />
        ) : (
          <PortfolioTable items={items} />
        )}
      </CardContent>
    </Card>
  );
}

// ==========================================
// PORTFOLIO TABLE
// ==========================================

function PortfolioTable({ items }: { items: PortfolioCard[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cơ hội</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ưu tiên</TableHead>
          <TableHead>Health</TableHead>
          <TableHead>Investment Score</TableHead>
          <TableHead>Backtest</TableHead>
          <TableHead>Trend</TableHead>
          <TableHead className="w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {item.favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                <Link
                  href={`/opportunities/${item.opportunity_id}`}
                  className="font-medium hover:underline"
                >
                  {item.opportunity_title}
                </Link>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(item.status)}>
                {PortfolioStatusLabels[item.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getPriorityVariant(item.priority)}>
                {PriorityLabels[item.priority]}
              </Badge>
            </TableCell>
            <TableCell>
              {item.health_score !== null ? (
                <div className="flex items-center gap-2">
                  <span className={getHealthToneClass(item.health_score)}>
                    {item.health_score.toFixed(1)}
                  </span>
                  {getHealthIcon(item.health_score)}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {item.investment_score !== null && item.investment_score !== undefined ? (
                <span className={getScoreToneClass(item.investment_score)}>
                  {item.investment_score.toFixed(1)}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {item.backtesting_accuracy !== null && item.backtesting_accuracy !== undefined ? (
                <span>{item.backtesting_accuracy.toFixed(1)}%</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {item.trend_score !== null && item.trend_score !== undefined ? (
                <span className={item.trend_score >= 0 ? "text-signal-hot-foreground" : "text-signal-risk-foreground"}>
                  {item.trend_score >= 0 ? "+" : ""}{item.trend_score.toFixed(1)}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/opportunities/${item.opportunity_id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Xem chi tiết
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="h-4 w-4 mr-2" />
                    {item.favorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="h-4 w-4 mr-2" />
                    Lưu trữ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ==========================================
// HELPER FUNCTIONS — signal-aware variants
// ==========================================

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "INVESTED":
      return "default";
    case "BUILDING":
      return "default";
    case "VALIDATED":
      return "secondary";
    case "RESEARCHING":
      return "outline";
    case "WATCHLIST":
      return "outline";
    case "ARCHIVED":
      return "destructive";
    default:
      return "outline";
  }
}

function getPriorityVariant(priority: string): "default" | "secondary" | "outline" | "destructive" {
  switch (priority) {
    case "CRITICAL":
      return "destructive";
    case "HIGH":
      return "default";
    case "MEDIUM":
      return "secondary";
    case "LOW":
      return "outline";
    default:
      return "outline";
  }
}

function getHealthToneClass(score: number): string {
  if (score >= 80) return "text-signal-hot-foreground font-semibold";
  if (score >= 60) return "text-signal-good-foreground font-medium";
  if (score >= 40) return "text-signal-watch-foreground";
  return "text-signal-risk-foreground";
}

function getHealthIcon(score: number) {
  if (score >= 70) {
    return <TrendingUp className="h-4 w-4 text-signal-hot-foreground" />;
  }
  if (score < 50) {
    return <TrendingDown className="h-4 w-4 text-signal-risk-foreground" />;
  }
  return null;
}

function getScoreToneClass(score: number): string {
  const variant = scoreVariant(score) ?? "default";
  const toneMap: Record<string, string> = {
    hot: "text-signal-hot-foreground font-semibold",
    good: "text-signal-good-foreground font-medium",
    watch: "text-signal-watch-foreground",
    cold: "text-signal-cold-foreground",
    risk: "text-signal-risk-foreground",
    ai: "text-signal-ai-foreground font-semibold",
    info: "text-signal-info-foreground font-medium",
    default: "",
  };
  return toneMap[variant] ?? "";
}
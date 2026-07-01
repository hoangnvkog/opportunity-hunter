// Sprint 60: Portfolio Intelligence Engine - Dashboard Page
// app/dashboard/portfolio/page.tsx

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Star, Archive, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { getStatistics, listPortfolioCards } from '@/lib/services/portfolio.service';
import { PortfolioStatusLabels, PriorityLabels } from '@/types/portfolio';
import type { PortfolioCard, PortfolioStatistics } from '@/types/portfolio';
import Link from 'next/link';

export const metadata = {
  title: 'Portfolio Intelligence | Opportunity Hunter',
  description: 'Manage your opportunity portfolio',
};

export default async function PortfolioPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Portfolio Intelligence</h1>
        <p className="text-muted-foreground mt-2">
          Manage your opportunity portfolio with health tracking and lifecycle monitoring
        </p>
      </div>

      <Suspense fallback={<div>Loading statistics...</div>}>
        <PortfolioStatistics />
      </Suspense>

      <Suspense fallback={<div>Loading portfolio...</div>}>
        <PortfolioTabs />
      </Suspense>
    </div>
  );
}

// ==========================================
// STATISTICS SECTION
// ==========================================

async function PortfolioStatistics() {
  const stats = await getStatistics();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_items}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.favorites} favorites • {stats.archived} archived
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.average_health !== null ? stats.average_health.toFixed(1) : 'N/A'}
          </div>
          <HealthDistributionBadges health={stats.by_health} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Watchlist</span>
              <span className="font-medium">{stats.by_status.WATCHLIST}</span>
            </div>
            <div className="flex justify-between">
              <span>Researching</span>
              <span className="font-medium">{stats.by_status.RESEARCHING}</span>
            </div>
            <div className="flex justify-between">
              <span>Validated</span>
              <span className="font-medium">{stats.by_status.VALIDATED}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Critical</span>
              <span className="font-medium text-red-600">{stats.by_priority.CRITICAL}</span>
            </div>
            <div className="flex justify-between">
              <span>High</span>
              <span className="font-medium text-orange-600">{stats.by_priority.HIGH}</span>
            </div>
            <div className="flex justify-between">
              <span>Medium</span>
              <span className="font-medium">{stats.by_priority.MEDIUM}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HealthDistributionBadges({ health }: { health: PortfolioStatistics['by_health'] }) {
  return (
    <div className="flex gap-1 mt-2 flex-wrap">
      {health.excellent > 0 && (
        <Badge variant="default" className="text-xs">
          {health.excellent} excellent
        </Badge>
      )}
      {health.good > 0 && (
        <Badge variant="secondary" className="text-xs">
          {health.good} good
        </Badge>
      )}
      {health.fair > 0 && (
        <Badge variant="outline" className="text-xs">
          {health.fair} fair
        </Badge>
      )}
      {health.poor > 0 && (
        <Badge variant="destructive" className="text-xs">
          {health.poor} poor
        </Badge>
      )}
    </div>
  );
}

// ==========================================
// TABS SECTION
// ==========================================

async function PortfolioTabs() {
  const [all, favorites, needsReview, highHealth, lowHealth] = await Promise.all([
    listPortfolioCards({ archived: false }, { field: 'created_at', direction: 'desc' }, 50),
    listPortfolioCards({ favorite: true, archived: false }, { field: 'health_score', direction: 'desc' }, 20),
    listPortfolioCards({ needs_review: true, archived: false }, { field: 'last_reviewed_at', direction: 'asc' }, 20),
    listPortfolioCards({ min_health: 80, archived: false }, { field: 'health_score', direction: 'desc' }, 20),
    listPortfolioCards({ max_health: 50, archived: false }, { field: 'health_score', direction: 'asc' }, 20),
  ]);

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all">All ({all.length})</TabsTrigger>
        <TabsTrigger value="favorites">Favorites ({favorites.length})</TabsTrigger>
        <TabsTrigger value="needs-review">Needs Review ({needsReview.length})</TabsTrigger>
        <TabsTrigger value="high-health">High Health ({highHealth.length})</TabsTrigger>
        <TabsTrigger value="low-health">Low Health ({lowHealth.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>All Portfolio Items</CardTitle>
            <CardDescription>Complete portfolio overview</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioTable items={all} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="favorites">
        <Card>
          <CardHeader>
            <CardTitle>Favorite Opportunities</CardTitle>
            <CardDescription>Your starred opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioTable items={favorites} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="needs-review">
        <Card>
          <CardHeader>
            <CardTitle>Needs Review</CardTitle>
            <CardDescription>Not reviewed in 30+ days</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioTable items={needsReview} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="high-health">
        <Card>
          <CardHeader>
            <CardTitle>Highest Health</CardTitle>
            <CardDescription>Top performing opportunities (80+)</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioTable items={highHealth} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="low-health">
        <Card>
          <CardHeader>
            <CardTitle>Lowest Health</CardTitle>
            <CardDescription>Opportunities needing attention (&lt;50)</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioTable items={lowHealth} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// ==========================================
// PORTFOLIO TABLE
// ==========================================

function PortfolioTable({ items }: { items: PortfolioCard[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No portfolio items found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Opportunity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Health</TableHead>
          <TableHead>Investment Score</TableHead>
          <TableHead>Backtest</TableHead>
          <TableHead>Trend</TableHead>
          <TableHead>Actions</TableHead>
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
                  <span className={getHealthColor(item.health_score)}>
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
                <span>{item.investment_score.toFixed(1)}</span>
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
                <span>{item.trend_score.toFixed(1)}</span>
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
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="h-4 w-4 mr-2" />
                    {item.favorite ? 'Remove Favorite' : 'Add Favorite'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
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
// HELPER FUNCTIONS
// ==========================================

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'INVESTED':
      return 'default';
    case 'BUILDING':
      return 'default';
    case 'VALIDATED':
      return 'secondary';
    case 'RESEARCHING':
      return 'outline';
    case 'WATCHLIST':
      return 'outline';
    case 'ARCHIVED':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getPriorityVariant(priority: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (priority) {
    case 'CRITICAL':
      return 'destructive';
    case 'HIGH':
      return 'default';
    case 'MEDIUM':
      return 'secondary';
    case 'LOW':
      return 'outline';
    default:
      return 'outline';
  }
}

function getHealthColor(score: number): string {
  if (score >= 90) return 'text-green-600 font-semibold';
  if (score >= 70) return 'text-blue-600 font-medium';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getHealthIcon(score: number) {
  if (score >= 70) {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  }
  if (score < 50) {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  }
  return null;
}

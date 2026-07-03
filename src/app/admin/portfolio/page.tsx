export const dynamic = "force-dynamic";

// Sprint 60: Portfolio Intelligence Engine - Admin Page
// app/admin/portfolio/page.tsx

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getStatistics, listPortfolioCards } from '@/lib/services/portfolio.service';
import { PortfolioStatusLabels, PriorityLabels } from '@/types/portfolio';
import Link from 'next/link';

export const metadata = {
  title: 'Portfolio Management | Admin',
  description: 'Admin portfolio intelligence overview',
};

export default async function AdminPortfolioPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Portfolio Management</h1>
        <p className="text-muted-foreground mt-2">
          Admin overview of portfolio intelligence metrics
        </p>
      </div>

      <Suspense fallback={<div>Loading metrics...</div>}>
        <PortfolioMetrics />
      </Suspense>

      <Suspense fallback={<div>Loading portfolio...</div>}>
        <PortfolioOverview />
      </Suspense>
    </div>
  );
}

async function PortfolioMetrics() {
  const stats = await getStatistics();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_items}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Active items in portfolio
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
          <p className="text-xs text-muted-foreground mt-1">
            Overall portfolio health
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Invested</span>
              <span className="font-medium">{stats.by_status.INVESTED}</span>
            </div>
            <div className="flex justify-between">
              <span>Building</span>
              <span className="font-medium">{stats.by_status.BUILDING}</span>
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
          <CardTitle className="text-sm font-medium">Priority Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Critical</span>
              <Badge variant="destructive">{stats.by_priority.CRITICAL}</Badge>
            </div>
            <div className="flex justify-between">
              <span>High</span>
              <Badge variant="default">{stats.by_priority.HIGH}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Needs Review</span>
              <Badge variant="outline">{stats.needs_review}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function PortfolioOverview() {
  const items = await listPortfolioCards(
    { archived: false },
    { field: 'health_score', direction: 'desc' },
    100
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Portfolio Items</CardTitle>
        <CardDescription>Complete portfolio overview ({items.length} items)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opportunity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Investment Score</TableHead>
              <TableHead>Last Reviewed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    href={`/opportunities/${item.opportunity_id}`}
                    className="font-medium hover:underline"
                  >
                    {item.opportunity_title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
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
                    <span className={getHealthColor(item.health_score)}>
                      {item.health_score.toFixed(1)}
                    </span>
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
                  {item.last_reviewed_at
                    ? new Date(item.last_reviewed_at).toLocaleDateString()
                    : 'Never'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
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

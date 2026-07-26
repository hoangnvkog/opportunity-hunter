// Sprint 60: Portfolio Intelligence Engine - Export API
// app/api/portfolio/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { listPortfolioCards } from '@/lib/services/portfolio.service';
import type { ExportFormat } from '@/types/portfolio';
import { requireUserAPI } from '@/lib/auth/api-guard';

export async function GET(request: NextRequest) {
  const guard = await requireUserAPI();
  if (!guard.ok) return guard.response;

  const searchParams = request.nextUrl.searchParams;
  const format = (searchParams.get('format') as ExportFormat) || 'csv';

  // Get all portfolio items
  const items = await listPortfolioCards(
    { archived: false },
    { field: 'health_score', direction: 'desc' },
    1000
  );

  if (format === 'json') {
    return NextResponse.json(items, {
      headers: {
        'Content-Disposition': 'attachment; filename="portfolio.json"',
      },
    });
  }

  // CSV export
  const headers = [
    'id',
    'opportunity_id',
    'opportunity_title',
    'status',
    'health_score',
    'created_at',
    'updated_at',
  ];

  const rows = items.map((item) => [
    item.id,
    item.opportunity_id,
    `"${item.opportunity_title.replace(/"/g, '""')}"`,
    item.status,
    item.health_score ?? '',
    item.created_at,
    item.updated_at,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="portfolio.csv"',
    },
  });
}
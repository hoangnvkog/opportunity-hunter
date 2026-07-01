// Sprint 60: Portfolio Intelligence Engine - Export API
// app/api/portfolio/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listPortfolioCards } from '@/lib/services/portfolio.service';
import type { ExportFormat } from '@/types/portfolio';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    if (format === 'csv') {
      const csv = generateCSV(items);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="portfolio.csv"',
        },
      });
    }

    if (format === 'pdf') {
      // For Sprint 60, return JSON with instructions
      // Full PDF generation would require additional libraries
      return NextResponse.json({
        message: 'PDF export coming soon',
        data: items,
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Portfolio export error:', error);
    return NextResponse.json(
      { error: 'Failed to export portfolio' },
      { status: 500 }
    );
  }
}

function generateCSV(items: any[]): string {
  const headers = [
    'ID',
    'Opportunity',
    'Status',
    'Priority',
    'Health Score',
    'Investment Score',
    'Backtesting Accuracy',
    'Trend Score',
    'Favorite',
    'Last Reviewed',
    'Created At',
  ];

  const rows = items.map((item) => [
    item.id,
    `"${item.opportunity_title.replace(/"/g, '""')}"`,
    item.status,
    item.priority,
    item.health_score !== null ? item.health_score.toFixed(2) : '',
    item.investment_score !== null ? item.investment_score.toFixed(2) : '',
    item.backtesting_accuracy !== null ? item.backtesting_accuracy.toFixed(2) : '',
    item.trend_score !== null ? item.trend_score.toFixed(2) : '',
    item.favorite ? 'Yes' : 'No',
    item.last_reviewed_at || '',
    item.created_at,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

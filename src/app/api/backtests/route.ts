/**
 * Sprint 59: Backtesting API Route
 *
 * GET /api/backtests?status=&minAccuracy=&maxAccuracy=&limit=&offset=
 * POST /api/backtests  — create pending backtest
 * POST /api/backtests/evaluate-batch  — evaluate pending backtests
 * GET  /api/backtests/stats  — aggregated statistics
 */

import { NextResponse } from "next/server";
import {
  listBacktests,
  getStatistics,
  evaluateOpportunity,
  evaluateBatch,
} from "@/services/backtesting/backtesting.service";
import type { BacktestSearchFilters } from "@/types/backtesting";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sp = url.searchParams;

    const numOrUndef = (key: string): number | undefined => {
      const raw = sp.get(key);
      if (raw === null || raw.trim() === "") return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    };

    const filters: BacktestSearchFilters = {
      status: (sp.get("status") ?? undefined) as BacktestSearchFilters["status"],
      minAccuracy: numOrUndef("minAccuracy"),
      maxAccuracy: numOrUndef("maxAccuracy"),
      limit: numOrUndef("limit") ?? 50,
      offset: numOrUndef("offset") ?? 0,
      orderBy: (sp.get("orderBy") as BacktestSearchFilters["orderBy"]) ?? "evaluation_date",
      ascending: sp.get("ascending") === "true",
    };

    const [results, stats] = await Promise.all([
      listBacktests(filters),
      getStatistics(),
    ]);

    return NextResponse.json({ results, stats });
  } catch (error) {
    console.error("Backtests GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch backtests" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, opportunityId, providerType } = body as {
      action?: string;
      opportunityId?: string;
      providerType?: string;
    };

    if (action === "evaluate-batch") {
      const result = await evaluateBatch(
        typeof body.limit === "number" ? body.limit : 50,
        providerType as "mock" | "openai" | undefined,
      );
      return NextResponse.json(result);
    }

    if (opportunityId) {
      const result = await evaluateOpportunity(
        opportunityId,
        providerType as "mock" | "openai" | undefined,
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Provide action=evaluate-batch or opportunityId" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Backtests POST error:", error);
    return NextResponse.json(
      { error: "Failed to create/evaluate backtests" },
      { status: 500 },
    );
  }
}
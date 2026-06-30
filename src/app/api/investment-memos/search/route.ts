/**
 * Sprint 58: Investment Memo Search API Route
 *
 * GET /api/investment-memos/search?query=&recommendation=&minConfidence=&investmentDecision=&limit=&offset=
 *
 * Full-text + faceted search across memos.
 * Returns { results: InvestmentMemoRow[], total: number }.
 */

import { NextResponse } from "next/server";
import {
  searchMemos,
  searchMemosCount,
} from "@/services/investment-memo/investment-memo.service";
import type { InvestmentMemoSearchFilters } from "@/types/investment-memo";

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

    const filters: InvestmentMemoSearchFilters = {
      query: sp.get("query") ?? undefined,
      recommendation: sp.get("recommendation") ?? undefined,
      minConfidence: numOrUndef("minConfidence"),
      maxConfidence: numOrUndef("maxConfidence"),
      investmentDecision: sp.get("investmentDecision") ?? undefined,
      limit: numOrUndef("limit") ?? 50,
      offset: numOrUndef("offset") ?? 0,
      orderBy: (sp.get("orderBy") as "confidence" | "created_at" | "memo_version" | null) ?? "created_at",
      ascending: sp.get("ascending") === "true",
    };

    const [results, total] = await Promise.all([
      searchMemos(filters),
      searchMemosCount(filters),
    ]);

    return NextResponse.json({ results, total });
  } catch (error) {
    console.error("Investment memo search API error:", error);
    return NextResponse.json(
      { error: "Failed to search investment memos" },
      { status: 500 },
    );
  }
}
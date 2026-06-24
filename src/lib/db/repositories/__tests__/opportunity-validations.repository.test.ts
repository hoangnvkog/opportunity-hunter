import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpportunityValidationsRepository } from "../opportunity-validations.repository";
import type { OpportunityValidationRow } from "@/types/validation";

const mockClient = { from: vi.fn() };

const makeRow = (
  score: string,
  fields?: Partial<OpportunityValidationRow>,
): OpportunityValidationRow =>
  ({
    id: `val-${score}`,
    opportunity_id: `opp-${score}`,
    validation_score: score,
    market_demand: "80.00",
    competition: "40.00",
    monetization: "75.00",
    build_difficulty: "50.00",
    reasoning: `Mock validation ${score}`,
    created_at: new Date().toISOString(),
    ...fields,
  });

describe("OpportunityValidationsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- create ----
  it("should create a validation", async () => {
    const repo = new OpportunityValidationsRepository(mockClient as never);
    const mockRow = makeRow("85.00");

    const mockSingle = vi.fn().mockResolvedValue({ data: mockRow, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockClient.from.mockReturnValue({ insert: mockInsert });

    const result = await repo.create({
      opportunity_id: "opp-456",
      validation_score: "85.00",
      market_demand: "80.00",
      competition: "40.00",
      monetization: "75.00",
      build_difficulty: "50.00",
    });

    expect(result).toEqual(mockRow);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ opportunity_id: "opp-456" }),
    );
  });

  // ---- upsert ----
  it("should upsert a validation", async () => {
    const repo = new OpportunityValidationsRepository(mockClient as never);
    const mockRow = makeRow("85.00");

    const mockSingle = vi.fn().mockResolvedValue({ data: mockRow, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockClient.from.mockReturnValue({ upsert: mockUpsert });

    const result = await repo.upsert({
      opportunity_id: "opp-456",
      validation_score: "85.00",
      market_demand: "80.00",
      competition: "40.00",
      monetization: "75.00",
      build_difficulty: "50.00",
    });

    expect(result).toEqual(mockRow);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ opportunity_id: "opp-456" }),
      { onConflict: "opportunity_id" },
    );
  });

  // ---- findByOpportunityId ----
  it("should find by opportunity_id", async () => {
    const repo = new OpportunityValidationsRepository(mockClient as never);
    const mockRow = makeRow("85.00");

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockRow, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockClient.from.mockReturnValue({ select: mockSelect });

    const result = await repo.findByOpportunityId("opp-456");

    expect(result).toEqual(mockRow);
    expect(mockEq).toHaveBeenCalledWith("opportunity_id", "opp-456");
  });

  it("should return null when not found", async () => {
    const repo = new OpportunityValidationsRepository(mockClient as never);

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockClient.from.mockReturnValue({ select: mockSelect });

    const result = await repo.findByOpportunityId("opp-999");

    expect(result).toBeNull();
  });

  // ---- list ----
  it("should list ordered by score DESC", async () => {
    const repo = new OpportunityValidationsRepository(mockClient as never);
    const rows = [makeRow("95.00"), makeRow("75.00")];

    const mockRange = vi.fn().mockResolvedValue({ data: rows, error: null });
    const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    mockClient.from.mockReturnValue({ select: mockSelect });

    const result = await repo.list({ limit: 10, offset: 0 });

    expect(result).toEqual(rows);
    expect(mockOrder).toHaveBeenCalledWith("validation_score", { ascending: false });
    expect(mockRange).toHaveBeenCalledWith(0, 9);
  });

  // ---- listTop ----
  it("should listTop", async () => {
    const repo = new OpportunityValidationsRepository(mockClient as never);
    const rows = [makeRow("95.00")];

    const mockRange = vi.fn().mockResolvedValue({ data: rows, error: null });
    const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    mockClient.from.mockReturnValue({ select: mockSelect });

    const result = await repo.listTop(20);

    expect(result).toEqual(rows);
    expect(mockRange).toHaveBeenCalledWith(0, 19);
  });

  // ---- count ----
  it("should count", async () => {
    const repo = new OpportunityValidationsRepository(mockClient as never);

    const mockSelect = vi.fn().mockResolvedValue({ count: 42, error: null });
    mockClient.from.mockReturnValue({ select: mockSelect });

    const result = await repo.count();

    expect(result).toBe(42);
    expect(mockSelect).toHaveBeenCalledWith("*", { count: "exact", head: true });
  });

  it("should count zero when empty", async () => {
    const repo = new OpportunityValidationsRepository(mockClient as never);

    const mockSelect = vi.fn().mockResolvedValue({ count: 0, error: null });
    mockClient.from.mockReturnValue({ select: mockSelect });

    const result = await repo.count();

    expect(result).toBe(0);
  });
});
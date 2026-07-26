import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/digests/pending-count/route";
import { WeeklyDigestsRepository } from "@/lib/db/repositories/weekly-digests.repository";

vi.mock("@/lib/db/repositories/weekly-digests.repository", () => ({
  WeeklyDigestsRepository: {
    create: vi.fn(),
  },
}));

describe("GET /api/digests/pending-count", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns count of pending digests", async () => {
    vi.mocked(WeeklyDigestsRepository.create).mockResolvedValue({
      listByUser: vi.fn().mockResolvedValue([
        { id: "1", status: "queued" },
        { id: "2", status: "sent" },
        { id: "3", status: "queued" },
      ]),
    } as never);

    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.count).toBe(2);
  });

  it("returns 0 when no digests exist", async () => {
    vi.mocked(WeeklyDigestsRepository.create).mockResolvedValue({
      listByUser: vi.fn().mockResolvedValue([]),
    } as never);

    const res = await GET();
    const body = await res.json();
    expect(body.count).toBe(0);
  });
});
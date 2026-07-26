import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET, POST } from "@/app/api/research/jobs/route";
import { listResearchJobs, startResearch } from "@/lib/services/research-agent.service";

vi.mock("@/lib/services/research-agent.service", () => ({
  listResearchJobs: vi.fn(),
  startResearch: vi.fn(),
}));

describe("GET /api/research/jobs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no authenticated user", async () => {
    const { requireUserAPI } = await import("@/lib/auth/api-guard");
    vi.mocked(requireUserAPI).mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      ),
    });

    const req = new Request("http://localhost/api/research/jobs");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 with jobs list", async () => {
    vi.mocked(listResearchJobs).mockResolvedValue([] as never);
    const req = new Request("http://localhost/api/research/jobs?source=reddit");
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("returns 500 on service error", async () => {
    vi.mocked(listResearchJobs).mockRejectedValue(new Error("DB down"));
    const req = new Request("http://localhost/api/research/jobs");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe("POST /api/research/jobs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts a research job for the given source", async () => {
    vi.mocked(startResearch).mockResolvedValue({
      id: "job-1",
      source: "reddit",
    } as never);
    const req = new Request("http://localhost/api/research/jobs", {
      method: "POST",
      body: JSON.stringify({ source: "reddit" }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("returns 400 when source is missing", async () => {
    const req = new Request("http://localhost/api/research/jobs", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
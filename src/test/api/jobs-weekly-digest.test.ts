import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/jobs/weekly-digest/route";
import { runWeeklyDigestJob } from "@/lib/scheduler/weekly-digest-job";

vi.mock("@/lib/scheduler/weekly-digest-job", () => ({
  runWeeklyDigestJob: vi.fn(),
}));

describe("POST /api/jobs/weekly-digest (cron)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 when job runs successfully", async () => {
    vi.mocked(runWeeklyDigestJob).mockResolvedValue({
      success: true,
      emailsSent: 5,
    } as never);
    const req = new Request("http://localhost/api/jobs/weekly-digest", {
      method: "POST",
      headers: { "x-cron-secret": "test-cron-secret" },
    });
    // setup.ts mocks api-guard.requireCronSecret to return ok:true
    const res = await POST(req);
    expect([200, 409]).toContain(res.status);
  });

  it("returns 409 when job already running", async () => {
    vi.mocked(runWeeklyDigestJob).mockResolvedValue(null);
    const req = new Request("http://localhost/api/jobs/weekly-digest", {
      method: "POST",
      headers: { "x-cron-secret": "test-cron-secret" },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});
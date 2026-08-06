import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { getSupabaseServiceClient } from "@/lib/supabase";

vi.mock("@/lib/supabase", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase")>();
  return {
    ...actual,
    getSupabaseServiceClient: vi.fn(),
  };
});

describe("GET /api/health", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 when database is healthy", async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [{ id: "src_1" }], error: null }),
        }),
      }),
    } as never);

    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.status).toBe("ok");
    expect(json.services.database).toBe("up");
    expect(json.services.app).toBe("up");
    expect(json.timestamp).toBeDefined();
  });

  it("returns 503 when database query returns error", async () => {
    const dbError = new Error("Connection refused");
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: dbError,
          }),
        }),
      }),
    } as never);

    const response = await GET();
    expect(response.status).toBe(503);

    const json = await response.json();
    expect(json.status).toBe("error");
    expect(json.services.database).toBe("down");
    expect(json.error).toBe("Connection refused");
  });

  it("returns 503 when database throws exception", async () => {
    vi.mocked(getSupabaseServiceClient).mockImplementation(() => {
      throw new Error("DB unavailable");
    });

    const response = await GET();
    expect(response.status).toBe(503);

    const json = await response.json();
    expect(json.status).toBe("error");
    expect(json.error).toBe("DB unavailable");
  });

  it("includes no-cache headers", async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as never);

    const response = await GET();
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });
});
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase")>();
  return {
    ...actual,
    getSupabaseServiceClient: vi.fn(),
  };
});

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "https://test.example.com";
  });

  it("includes all 5 static pages", async () => {
    const { getSupabaseServiceClient } = await import("@/lib/supabase");
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    } as never);

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();

    // 5 static + 0 dynamic = 5
    expect(entries.length).toBe(5);
    expect(entries.map((e) => e.url)).toEqual([
      "https://test.example.com",
      "https://test.example.com/opportunities",
      "https://test.example.com/ideas",
      "https://test.example.com/insights",
      "https://test.example.com/pricing",
    ]);
  });

  it("appends dynamic opportunity pages", async () => {
    const { getSupabaseServiceClient } = await import("@/lib/supabase");
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "opp-1",
                  created_at: "2026-08-01T00:00:00Z",
                },
                {
                  id: "opp-2",
                  created_at: "2026-08-02T00:00:00Z",
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();

    expect(entries.length).toBe(7); // 5 static + 2 dynamic
    expect(entries[5].url).toBe("https://test.example.com/opportunities/opp-1");
    expect(entries[6].url).toBe("https://test.example.com/opportunities/opp-2");
  });

  it("falls back to static-only when DB query fails", async () => {
    const { getSupabaseServiceClient } = await import("@/lib/supabase");
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error("DB unreachable")),
          }),
        }),
      }),
    } as never);

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();

    expect(entries.length).toBe(5);
  });
});
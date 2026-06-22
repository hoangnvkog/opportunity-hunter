import { describe, it, expect, beforeEach, vi } from "vitest";
import { WeeklyDigestsRepository } from "../weekly-digests.repository";
import type { Uuid } from "@/types";

const mockClient = {
  from: vi.fn(),
};

describe("WeeklyDigestsRepository", () => {
  let repository: WeeklyDigestsRepository;
  const userId = "user-123" as Uuid;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new WeeklyDigestsRepository(mockClient as never);
  });

  describe("create", () => {
    it("inserts a queued digest row", async () => {
      const inserted = {
        id: "digest-1",
        user_id: userId,
        week_start: "2026-06-16",
        week_end: "2026-06-22",
        content: "{}",
        status: "queued",
        sent_at: null,
        created_at: "2026-06-22T05:00:00Z",
      };

      const single = vi.fn().mockResolvedValue({ data: inserted, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      mockClient.from.mockReturnValue({ insert });

      const result = await repository.create({
        user_id: userId,
        week_start: "2026-06-16",
        week_end: "2026-06-22",
        content: "{}",
      });

      expect(mockClient.from).toHaveBeenCalledWith("weekly_digests");
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: "queued" }),
      );
      expect(result.id).toBe("digest-1");
      expect(result.status).toBe("queued");
    });

    it("falls back to existing row on duplicate (unique violation)", async () => {
      const existing = {
        id: "digest-existing",
        user_id: userId,
        week_start: "2026-06-16",
        week_end: "2026-06-22",
        content: "{}",
        status: "sent",
        sent_at: "2026-06-22T05:01:00Z",
        created_at: "2026-06-22T05:00:00Z",
      };

      const insertSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "23505", message: "duplicate key value" },
      });
      const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
      const insertChain = vi.fn().mockReturnValue({ select: insertSelect });

      const findMaybeSingle = vi.fn().mockResolvedValue({ data: existing, error: null });
      const findEq2 = vi.fn().mockReturnValue({ maybeSingle: findMaybeSingle });
      const findEq1 = vi.fn().mockReturnValue({ eq: findEq2 });
      const findSelect = vi.fn().mockReturnValue({ eq: findEq1 });

      mockClient.from.mockImplementation((t: string) => {
        if (t === "weekly_digests") {
          return { insert: insertChain, select: findSelect };
        }
        return {};
      });

      const result = await repository.create({
        user_id: userId,
        week_start: "2026-06-16",
        week_end: "2026-06-22",
        content: "{}",
      });

      expect(result.id).toBe("digest-existing");
    });
  });

  describe("markSent", () => {
    it("transitions to sent and stamps sent_at", async () => {
      const sent = {
        id: "digest-1",
        status: "sent",
        sent_at: new Date().toISOString(),
        user_id: userId,
        week_start: "2026-06-16",
        week_end: "2026-06-22",
        content: "{}",
        created_at: "2026-06-22T05:00:00Z",
      };

      const single = vi.fn().mockResolvedValue({ data: sent, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eq = vi.fn().mockReturnValue({ select });
      const update = vi.fn().mockReturnValue({ eq });
      mockClient.from.mockReturnValue({ update });

      await repository.markSent("digest-1" as Uuid);

      expect(mockClient.from).toHaveBeenCalledWith("weekly_digests");
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "sent",
          sent_at: expect.any(String),
        }),
      );
    });
  });

  describe("markFailed", () => {
    it("transitions to failed without touching sent_at", async () => {
      const single = vi.fn().mockResolvedValue({ data: { id: "digest-1", status: "failed" }, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eq = vi.fn().mockReturnValue({ select });
      const update = vi.fn().mockReturnValue({ eq });
      mockClient.from.mockReturnValue({ update });

      await repository.markFailed("digest-1" as Uuid);

      expect(update).toHaveBeenCalledWith({ status: "failed" });
    });
  });

  describe("findByWeek", () => {
    it("returns a single row for user + week_start", async () => {
      const row = {
        id: "digest-1",
        user_id: userId,
        week_start: "2026-06-16",
        week_end: "2026-06-22",
        content: "{}",
        status: "queued",
        sent_at: null,
        created_at: "2026-06-22T05:00:00Z",
      };

      const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
      const eq2 = vi.fn().mockReturnValue({ maybeSingle });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const select = vi.fn().mockReturnValue({ eq: eq1 });
      mockClient.from.mockReturnValue({ select });

      const result = await repository.findByWeek(userId, "2026-06-16");

      expect(result?.id).toBe("digest-1");
      expect(eq1).toHaveBeenCalledWith("user_id", userId);
      expect(eq2).toHaveBeenCalledWith("week_start", "2026-06-16");
    });

    it("returns null when nothing matches", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const eq2 = vi.fn().mockReturnValue({ maybeSingle });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const select = vi.fn().mockReturnValue({ eq: eq1 });
      mockClient.from.mockReturnValue({ select });

      const result = await repository.findByWeek(userId, "2099-01-01");
      expect(result).toBeNull();
    });
  });

  describe("listPending", () => {
    it("filters by status=queued, ordered oldest first", async () => {
      const rows = [{ id: "d-1", status: "queued" }];
      const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
      const order = vi.fn().mockReturnValue({ limit });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      mockClient.from.mockReturnValue({ select });

      const result = await repository.listPending(50);

      expect(result).toEqual(rows);
      expect(eq).toHaveBeenCalledWith("status", "queued");
      expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
    });
  });

  describe("listByUser (history)", () => {
    it("returns most-recent-first digests for a user", async () => {
      const rows = [
        { id: "d-1", week_start: "2026-06-16" },
        { id: "d-2", week_start: "2026-06-09" },
      ];
      const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
      const order = vi.fn().mockReturnValue({ limit });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      mockClient.from.mockReturnValue({ select });

      const result = await repository.listByUser(userId);

      expect(result.length).toBe(2);
      expect(eq).toHaveBeenCalledWith("user_id", userId);
      expect(order).toHaveBeenCalledWith("week_start", { ascending: false });
    });
  });

  describe("countSent", () => {
    it("counts sent digests", async () => {
      const eq = vi.fn().mockResolvedValue({ count: 7, error: null });
      const select = vi.fn().mockReturnValue({ eq });
      mockClient.from.mockReturnValue({ select });

      const result = await repository.countSent();
      expect(result).toBe(7);
    });
  });

  describe("countOpportunitiesSince", () => {
    it("filters opportunities.created_at gte cutoff", async () => {
      const gte = vi.fn().mockResolvedValue({ count: 42, error: null });
      const select = vi.fn().mockReturnValue({ gte });
      mockClient.from.mockReturnValue({ select });

      const result = await repository.countOpportunitiesSince(7);
      expect(result).toBe(42);
      expect(mockClient.from).toHaveBeenCalledWith("opportunities");
      expect(gte).toHaveBeenCalledWith("created_at", expect.any(String));
    });
  });
});

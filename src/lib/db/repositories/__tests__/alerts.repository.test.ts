import { describe, it, expect, beforeEach, vi } from "vitest";
import { AlertsRepository } from "../alerts.repository";
import type { Uuid } from "@/types";

const mockClient = {
  from: vi.fn(),
};

describe("AlertsRepository", () => {
  let repository: AlertsRepository;
  const userId = "user-123" as Uuid;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new AlertsRepository(mockClient as never);
  });

  describe("create", () => {
    it("should create a new alert", async () => {
      const mockAlert = {
        id: "alert-1",
        user_id: userId,
        watchlist_id: "watch-1" as Uuid,
        opportunity_id: "opp-1" as Uuid,
        is_read: false,
        created_at: "2026-06-22T00:00:00Z",
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockAlert, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockClient.from.mockReturnValue({ insert: mockInsert });

      const result = await repository.create({
        user_id: userId,
        watchlist_id: "watch-1",
        opportunity_id: "opp-1",
      });

      expect(mockClient.from).toHaveBeenCalledWith("alerts");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        watchlist_id: "watch-1",
        opportunity_id: "opp-1",
      });
      expect(result).toEqual(mockAlert);
    });

    it("should throw error when create fails", async () => {
      const mockError = { message: "Constraint failed" };

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockClient.from.mockReturnValue({ insert: mockInsert });

      await expect(
        repository.create({
          user_id: userId,
          watchlist_id: "watch-1",
          opportunity_id: "opp-1",
        })
      ).rejects.toThrow();
    });
  });

  describe("listByUser", () => {
    it("should fetch alerts with watchlist and opportunity details", async () => {
      const mockAlerts = [
        {
          id: "alert-1",
          user_id: userId,
          watchlist_id: "watch-1",
          opportunity_id: "opp-1",
          is_read: false,
          created_at: "2026-06-22T00:00:00Z",
          watchlist: { name: "AI Watchlist" },
          opportunity: {
            id: "opp-1",
            title: "Hot Opportunity",
            score: "85.5",
            cluster: { name: "AI Tools" },
          },
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockAlerts, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.listByUser(userId);

      expect(result).toEqual(mockAlerts);
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining("watchlist"));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining("opportunity"));
      expect(mockEq).toHaveBeenCalledWith("user_id", userId);
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should return empty array when no alerts", async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.listByUser(userId);

      expect(result).toEqual([]);
    });
  });

  describe("markRead", () => {
    it("should mark a single alert as read", async () => {
      const alertId = "alert-1" as Uuid;
      const mockAlert = { id: alertId, is_read: true };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockAlert, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq2 = vi.fn().mockReturnValue({ select: mockSelect });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      const result = await repository.markRead(alertId, userId);

      expect(mockClient.from).toHaveBeenCalledWith("alerts");
      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
      expect(mockEq1).toHaveBeenCalledWith("id", alertId);
      expect(mockEq2).toHaveBeenCalledWith("user_id", userId);
      expect(result).toEqual(mockAlert);
    });

    it("should throw error when alert not found", async () => {
      const alertId = "nonexistent" as Uuid;
      const mockError = { message: "Alert not found" };

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq2 = vi.fn().mockReturnValue({ select: mockSelect });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      await expect(repository.markRead(alertId, userId)).rejects.toThrow();
    });
  });

  describe("markAllRead", () => {
    it("should mark all unread alerts for a user as read", async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      await repository.markAllRead(userId);

      expect(mockClient.from).toHaveBeenCalledWith("alerts");
      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
      expect(mockEq1).toHaveBeenCalledWith("user_id", userId);
      expect(mockEq2).toHaveBeenCalledWith("is_read", false);
    });
  });

  describe("countUnread", () => {
    it("should return count of unread alerts", async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ count: 5, error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.countUnread(userId);

      expect(result).toBe(5);
      expect(mockSelect).toHaveBeenCalledWith("*", { count: "exact", head: true });
      expect(mockEq1).toHaveBeenCalledWith("user_id", userId);
      expect(mockEq2).toHaveBeenCalledWith("is_read", false);
    });

    it("should return 0 when no unread alerts", async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ count: 0, error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.countUnread(userId);

      expect(result).toBe(0);
    });
  });
});

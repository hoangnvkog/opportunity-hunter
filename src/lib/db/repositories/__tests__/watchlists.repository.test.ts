import { describe, it, expect, beforeEach, vi } from "vitest";
import { WatchlistsRepository } from "../watchlists.repository";
import type { Uuid } from "@/types";

const mockClient = {
  from: vi.fn(),
};

describe("WatchlistsRepository", () => {
  let repository: WatchlistsRepository;
  const userId = "user-123" as Uuid;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new WatchlistsRepository(mockClient as never);
  });

  describe("create", () => {
    it("should create a new watchlist", async () => {
      const mockWatchlist = {
        id: "watch-1",
        user_id: userId,
        name: "AI Watchlist",
        search: null,
        min_score: 0.5,
        min_frequency: 10,
        min_severity: 0.3,
        min_buying_intent: 0.4,
        created_at: "2026-06-22T00:00:00Z",
        updated_at: "2026-06-22T00:00:00Z",
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockWatchlist, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockClient.from.mockReturnValue({ insert: mockInsert });

      const result = await repository.create({
        user_id: userId,
        name: "AI Watchlist",
        min_score: 0.5,
        min_frequency: 10,
      });

      expect(mockClient.from).toHaveBeenCalledWith("watchlists");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        name: "AI Watchlist",
        min_score: 0.5,
        min_frequency: 10,
      });
      expect(result).toEqual(mockWatchlist);
    });

    it("should throw error when create fails", async () => {
      const mockError = { message: "Database constraint violation" };

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockClient.from.mockReturnValue({ insert: mockInsert });

      await expect(
        repository.create({ user_id: userId, name: "" })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update an existing watchlist", async () => {
      const watchlistId = "watch-1";
      const updatedWatchlist = { id: watchlistId, name: "Updated Name" };

      const mockSingle = vi.fn().mockResolvedValue({ data: updatedWatchlist, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq2 = vi.fn().mockReturnValue({ select: mockSelect });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      const result = await repository.update(watchlistId, userId, { name: "Updated Name" });

      expect(mockClient.from).toHaveBeenCalledWith("watchlists");
      expect(mockEq1).toHaveBeenCalledWith("id", watchlistId);
      expect(mockEq2).toHaveBeenCalledWith("user_id", userId);
      expect(result).toEqual(updatedWatchlist);
    });

    it("should throw error when update fails", async () => {
      const watchlistId = "watch-1";
      const mockError = { message: "Row not found" };

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq2 = vi.fn().mockReturnValue({ select: mockSelect });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      await expect(
        repository.update(watchlistId, userId, { name: "Updated" })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a watchlist", async () => {
      const watchlistId = "watch-1";

      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ delete: mockDelete });

      await repository.delete(watchlistId, userId);

      expect(mockClient.from).toHaveBeenCalledWith("watchlists");
      expect(mockEq1).toHaveBeenCalledWith("id", watchlistId);
      expect(mockEq2).toHaveBeenCalledWith("user_id", userId);
    });

    it("should throw error when delete fails", async () => {
      const watchlistId = "watch-1";
      const mockError = { message: "Permission denied" };

      const mockEq2 = vi.fn().mockResolvedValue({ error: mockError });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ delete: mockDelete });

      await expect(repository.delete(watchlistId, userId)).rejects.toThrow();
    });
  });

  describe("findById", () => {
    it("should find a watchlist by ID", async () => {
      const watchlistId = "watch-1";
      const mockWatchlist = { id: watchlistId, name: "Test" };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockWatchlist, error: null });
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.findById(watchlistId, userId);

      expect(result).toEqual(mockWatchlist);
      expect(mockEq2).toHaveBeenCalledWith("user_id", userId);
    });

    it("should throw error when not found", async () => {
      const watchlistId = "nonexistent";
      const mockError = { message: "Not found" };

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ select: mockSelect });

      await expect(repository.findById(watchlistId, userId)).rejects.toThrow();
    });
  });

  describe("listByUser", () => {
    it("should list watchlists for a user ordered by created_at desc", async () => {
      const mockWatchlists = [
        { id: "watch-1", name: "First" },
        { id: "watch-2", name: "Second" },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockWatchlists, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.listByUser(userId);

      expect(result).toEqual(mockWatchlists);
      expect(mockEq).toHaveBeenCalledWith("user_id", userId);
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should return empty array when no watchlists", async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.listByUser(userId);

      expect(result).toEqual([]);
    });
  });

  describe("getAllWatchlists", () => {
    it("should fetch all watchlists across all users", async () => {
      const mockWatchlists = [
        { id: "watch-1", user_id: "user-1", name: "First" },
        { id: "watch-2", user_id: "user-2", name: "Second" },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockWatchlists, error: null });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.getAllWatchlists();

      expect(result).toEqual(mockWatchlists);
      expect(mockClient.from).toHaveBeenCalledWith("watchlists");
      expect(mockSelect).toHaveBeenCalledWith("*");
    });
  });

  describe("countByUser", () => {
    it("should return count of user watchlists", async () => {
      const mockEq = vi.fn().mockResolvedValue({ count: 3, error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.countByUser(userId);

      expect(result).toBe(3);
      expect(mockSelect).toHaveBeenCalledWith("*", { count: "exact", head: true });
    });

    it("should return 0 when no watchlists", async () => {
      const mockEq = vi.fn().mockResolvedValue({ count: 0, error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.countByUser(userId);

      expect(result).toBe(0);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SavedOpportunitiesRepository } from "../saved-opportunities.repository";
import type { SavedOpportunityRow } from "@/types/saved-opportunity";

// Mock Supabase client
const mockClient = {
  from: vi.fn(),
};

describe("SavedOpportunitiesRepository", () => {
  let repository: SavedOpportunitiesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SavedOpportunitiesRepository(mockClient as never);
  });

  describe("save", () => {
    it("should save an opportunity for a user", async () => {
      const userId = "user-123";
      const opportunityId = "opp-456";
      const mockRow: SavedOpportunityRow = {
        id: "saved-789",
        user_id: userId,
        opportunity_id: opportunityId,
        created_at: new Date().toISOString(),
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockRow, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockClient.from.mockReturnValue({ insert: mockInsert });

      const result = await repository.save(userId, opportunityId);

      expect(mockClient.from).toHaveBeenCalledWith("saved_opportunities");
      expect(mockInsert).toHaveBeenCalledWith({ user_id: userId, opportunity_id: opportunityId });
      expect(result).toEqual(mockRow);
    });

    it("should throw error when save fails", async () => {
      const userId = "user-123";
      const opportunityId = "opp-456";
      const mockError = { message: "Database error" };

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockClient.from.mockReturnValue({ insert: mockInsert });

      await expect(repository.save(userId, opportunityId)).rejects.toThrow();
    });
  });

  describe("unsave", () => {
    it("should unsave an opportunity for a user", async () => {
      const userId = "user-123";
      const opportunityId = "opp-456";

      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ delete: mockDelete });

      await repository.unsave(userId, opportunityId);

      expect(mockClient.from).toHaveBeenCalledWith("saved_opportunities");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith("user_id", userId);
      expect(mockEq2).toHaveBeenCalledWith("opportunity_id", opportunityId);
    });

    it("should throw error when unsave fails", async () => {
      const userId = "user-123";
      const opportunityId = "opp-456";
      const mockError = { message: "Database error" };

      const mockEq2 = vi.fn().mockResolvedValue({ error: mockError });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ delete: mockDelete });

      await expect(repository.unsave(userId, opportunityId)).rejects.toThrow();
    });
  });

  describe("isSaved", () => {
    it("should return true when opportunity is saved", async () => {
      const userId = "user-123";
      const opportunityId = "opp-456";

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "saved-789" }, error: null });
      const mockEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.isSaved(userId, opportunityId);

      expect(result).toBe(true);
      expect(mockClient.from).toHaveBeenCalledWith("saved_opportunities");
    });

    it("should return false when opportunity is not saved", async () => {
      const userId = "user-123";
      const opportunityId = "opp-456";

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.isSaved(userId, opportunityId);

      expect(result).toBe(false);
    });

    it("should throw error when isSaved fails", async () => {
      const userId = "user-123";
      const opportunityId = "opp-456";
      const mockError = { message: "Database error" };

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockClient.from.mockReturnValue({ select: mockSelect });

      await expect(repository.isSaved(userId, opportunityId)).rejects.toThrow();
    });
  });

  describe("listSaved", () => {
    it("should list all saved opportunities for a user", async () => {
      const userId = "user-123";
      const mockRows: SavedOpportunityRow[] = [
        { id: "saved-1", user_id: userId, opportunity_id: "opp-1", created_at: new Date().toISOString() },
        { id: "saved-2", user_id: userId, opportunity_id: "opp-2", created_at: new Date().toISOString() },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockRows, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.listSaved(userId);

      expect(result).toEqual(mockRows);
      expect(mockClient.from).toHaveBeenCalledWith("saved_opportunities");
      expect(mockEq).toHaveBeenCalledWith("user_id", userId);
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should return empty array when no opportunities saved", async () => {
      const userId = "user-123";

      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.listSaved(userId);

      expect(result).toEqual([]);
    });

    it("should throw error when listSaved fails", async () => {
      const userId = "user-123";
      const mockError = { message: "Database error" };

      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      await expect(repository.listSaved(userId)).rejects.toThrow();
    });
  });

  describe("countSaved", () => {
    it("should count saved opportunities for a user", async () => {
      const userId = "user-123";

      const mockEq = vi.fn().mockResolvedValue({ count: 5, error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.countSaved(userId);

      expect(result).toBe(5);
      expect(mockClient.from).toHaveBeenCalledWith("saved_opportunities");
      expect(mockSelect).toHaveBeenCalledWith("*", { count: "exact", head: true });
      expect(mockEq).toHaveBeenCalledWith("user_id", userId);
    });

    it("should return 0 when no opportunities saved", async () => {
      const userId = "user-123";

      const mockEq = vi.fn().mockResolvedValue({ count: 0, error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.countSaved(userId);

      expect(result).toBe(0);
    });

    it("should throw error when countSaved fails", async () => {
      const userId = "user-123";
      const mockError = { message: "Database error" };

      const mockEq = vi.fn().mockResolvedValue({ count: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      await expect(repository.countSaved(userId)).rejects.toThrow();
    });
  });
});

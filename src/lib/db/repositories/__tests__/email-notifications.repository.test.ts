import { describe, it, expect, beforeEach, vi } from "vitest";
import { EmailNotificationsRepository } from "../email-notifications.repository";
import type { Uuid } from "@/types";

const mockClient = {
  from: vi.fn(),
};

describe("EmailNotificationsRepository", () => {
  let repository: EmailNotificationsRepository;
  const userId = "user-123" as Uuid;
  const alertId = "alert-1" as Uuid;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new EmailNotificationsRepository(mockClient as never);
  });

  describe("create", () => {
    it("should create a queued email notification", async () => {
      const mockNotification = {
        id: "notif-1",
        user_id: userId,
        alert_id: alertId,
        status: "queued",
        attempts: 0,
        error_message: null,
        sent_at: null,
        created_at: "2026-06-22T00:00:00Z",
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockNotification, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockClient.from.mockReturnValue({ insert: mockInsert });

      const result = await repository.create({ user_id: userId, alert_id: alertId });

      expect(mockClient.from).toHaveBeenCalledWith("email_notifications");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        alert_id: alertId,
        status: "queued",
      });
      expect(result.status).toBe("queued");
    });
  });

  describe("markSent", () => {
    it("should mark notification as sent", async () => {
      const id = "notif-1" as Uuid;
      const mockNotification = { id, status: "sent" };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockNotification, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      await repository.markSent(id);

      expect(mockClient.from).toHaveBeenCalledWith("email_notifications");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "sent", sent_at: expect.any(String) }),
      );
      expect(mockEq).toHaveBeenCalledWith("id", id);
    });
  });

  describe("markFailed", () => {
    it("should mark notification as failed and store error", async () => {
      const id = "notif-1" as Uuid;
      const errorMessage = "Resend 401";

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      await repository.markFailed(id, errorMessage);

      expect(mockUpdate).toHaveBeenCalledWith({
        status: "failed",
        error_message: errorMessage,
      });
    });
  });

  describe("requeue", () => {
    it("should requeue failed notifications", async () => {
      const id = "notif-1" as Uuid;

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      await repository.requeue(id);

      expect(mockUpdate).toHaveBeenCalledWith({
        status: "queued",
        error_message: null,
      });
    });
  });

  describe("listPending", () => {
    it("should list queued notifications with attempts < 3", async () => {
      const mockData = [
        { id: "notif-1", status: "queued", attempts: 0 },
        { id: "notif-2", status: "queued", attempts: 1 },
      ];

      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockLt = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq = vi.fn().mockReturnValue({ lt: mockLt });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.listPending(50);

      expect(result).toEqual(mockData);
      expect(mockEq).toHaveBeenCalledWith("status", "queued");
      expect(mockLt).toHaveBeenCalledWith("attempts", 3);
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
    });

    it("should return empty array when no pending notifications", async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockLt = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq = vi.fn().mockReturnValue({ lt: mockLt });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.listPending(50);

      expect(result).toEqual([]);
    });
  });

  describe("countSent", () => {
    it("should count sent emails", async () => {
      const mockEq = vi.fn().mockResolvedValue({ count: 42, error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.countSent();

      expect(result).toBe(42);
      expect(mockEq).toHaveBeenCalledWith("status", "sent");
    });
  });

  describe("countFailed", () => {
    it("should count failed emails", async () => {
      const mockEq = vi.fn().mockResolvedValue({ count: 3, error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await repository.countFailed();

      expect(result).toBe(3);
      expect(mockEq).toHaveBeenCalledWith("status", "failed");
    });
  });
});

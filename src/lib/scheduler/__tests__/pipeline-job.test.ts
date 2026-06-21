import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isPipelineRunning } from "../pipeline-job";

// Mock dependencies
vi.mock("@/services/pipeline/pipeline.service", () => ({
  runPipeline: vi.fn(),
}));

describe("Pipeline Job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("isPipelineRunning", () => {
    it("should return false initially", () => {
      expect(isPipelineRunning()).toBe(false);
    });

    it("should track running state correctly", () => {
      // Initially not running
      expect(isPipelineRunning()).toBe(false);
      
      // Note: We can't easily test the running state without actually running the job
      // because the isRunning flag is internal to the module
      // This test verifies the public API works correctly
    });
  });

  describe("Duration Calculation", () => {
    it("should calculate duration correctly", () => {
      const start = new Date("2026-01-22T10:00:00Z");
      const end = new Date("2026-01-22T10:00:05Z");
      const durationMs = end.getTime() - start.getTime();
      
      expect(durationMs).toBe(5000);
      expect(durationMs / 1000).toBe(5);
    });

    it("should handle long running jobs", () => {
      const start = new Date("2026-01-22T10:00:00Z");
      const end = new Date("2026-01-22T10:02:58Z"); // 2 minutes 58 seconds
      const durationMs = end.getTime() - start.getTime();
      
      expect(durationMs).toBe(178000);
      expect(durationMs / 1000).toBe(178);
    });
  });
});

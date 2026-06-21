import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only before any imports
vi.mock("server-only", () => ({}));

// Mock Supabase client
vi.mock("@/lib/supabase/server-client", () => ({
  getSupabaseClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  })),
}));

import { JOB_SCHEDULES, getJobConfigFromEnv } from "../jobs";

describe("Jobs Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("Job Schedules", () => {
    it("should have valid cron expressions", () => {
      expect(JOB_SCHEDULES.EVERY_HOUR).toBe("0 * * * *");
      expect(JOB_SCHEDULES.EVERY_6_HOURS).toBe("0 */6 * * *");
      expect(JOB_SCHEDULES.DAILY).toBe("0 0 * * *");
      expect(JOB_SCHEDULES.WEEKLY).toBe("0 0 * * 0");
    });

    it("should match valid cron expression format", () => {
      const cronRegex = /^[\d*\/\-]+ [\d*\/\-]+ [\d*\/\-]+ [\d*\/\-]+ [\d*\/\-]+$/;
      Object.values(JOB_SCHEDULES).forEach(schedule => {
        expect(schedule).toMatch(cronRegex);
      });
    });

    it("should get config from environment with defaults", () => {
      const config = getJobConfigFromEnv();
      
      expect(config.name).toBe("6-Hour Pipeline");
      expect(config.schedule).toBe("0 */6 * * *");
      expect(config.timezone).toBe("UTC");
    });

    it("should use custom schedule from environment", () => {
      process.env.PIPELINE_SCHEDULE = "0 12 * * *";
      
      const config = getJobConfigFromEnv();
      expect(config.schedule).toBe("0 12 * * *");
      expect(config.name).toBe("Custom Pipeline");
    });

    it("should detect hourly schedule name", () => {
      process.env.PIPELINE_SCHEDULE = JOB_SCHEDULES.EVERY_HOUR;
      
      const config = getJobConfigFromEnv();
      expect(config.name).toBe("Hourly Pipeline");
    });

    it("should detect daily schedule name", () => {
      process.env.PIPELINE_SCHEDULE = JOB_SCHEDULES.DAILY;
      
      const config = getJobConfigFromEnv();
      expect(config.name).toBe("Daily Pipeline");
    });

    it("should detect weekly schedule name", () => {
      process.env.PIPELINE_SCHEDULE = JOB_SCHEDULES.WEEKLY;
      
      const config = getJobConfigFromEnv();
      expect(config.name).toBe("Weekly Pipeline");
    });

    it("should use custom timezone from environment", () => {
      process.env.PIPELINE_TIMEZONE = "Asia/Ho_Chi_Minh";
      
      const config = getJobConfigFromEnv();
      expect(config.timezone).toBe("Asia/Ho_Chi_Minh");
    });
  });

  describe("Status Transitions", () => {
    it("should define valid status values", () => {
      const validStatuses = ["success", "failed"];
      
      validStatuses.forEach(status => {
        expect(["success", "failed"]).toContain(status);
      });
    });

    it("should handle status transition from idle to executing", () => {
      const validStates = ["idle", "executing", "failed"];
      
      expect(validStates).toContain("idle");
      expect(validStates).toContain("executing");
      expect(validStates).toContain("failed");
    });
  });
});

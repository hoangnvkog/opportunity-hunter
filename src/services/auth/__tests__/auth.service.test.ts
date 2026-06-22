import { describe, it, expect, vi, beforeEach } from "vitest";
import { signUp, signIn, getCurrentUser, requireUser } from "../auth.service";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseServerClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
  })),
}));

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    it("should call supabase signUp with correct parameters", async () => {
      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: { id: "123", email: "test@example.com" } },
        error: null,
      });

      const { getSupabaseServerClient } = await import("@/lib/supabase/client");
      vi.mocked(getSupabaseServerClient).mockResolvedValue({
        auth: { signUp: mockSignUp },
      } as unknown as Awaited<ReturnType<typeof getSupabaseServerClient>>);

      const result = await signUp({
        email: "test@example.com",
        password: "password123",
        fullName: "Test User",
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          data: {
            full_name: "Test User",
          },
        },
      });
      expect(result.user).toBeDefined();
      expect(result.error).toBeNull();
    });

    it("should return error when signUp fails", async () => {
      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "Email already taken" },
      });

      const { getSupabaseServerClient } = await import("@/lib/supabase/client");
      vi.mocked(getSupabaseServerClient).mockResolvedValue({
        auth: { signUp: mockSignUp },
      } as unknown as Awaited<ReturnType<typeof getSupabaseServerClient>>);

      const result = await signUp({
        email: "test@example.com",
        password: "password123",
        fullName: "Test User",
      });

      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Email already taken");
    });
  });

  describe("signIn", () => {
    it("should call supabase signInWithPassword with correct parameters", async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: { id: "123", email: "test@example.com" } },
        error: null,
      });

      const { getSupabaseServerClient } = await import("@/lib/supabase/client");
      vi.mocked(getSupabaseServerClient).mockResolvedValue({
        auth: { signInWithPassword: mockSignIn },
      } as unknown as Awaited<ReturnType<typeof getSupabaseServerClient>>);

      const result = await signIn({
        email: "test@example.com",
        password: "password123",
      });

      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.user).toBeDefined();
      expect(result.error).toBeNull();
    });

    it("should return error when signIn fails", async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid credentials" },
      });

      const { getSupabaseServerClient } = await import("@/lib/supabase/client");
      vi.mocked(getSupabaseServerClient).mockResolvedValue({
        auth: { signInWithPassword: mockSignIn },
      } as unknown as Awaited<ReturnType<typeof getSupabaseServerClient>>);

      const result = await signIn({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Invalid credentials");
    });
  });

  describe("getCurrentUser", () => {
    it("should return user when authenticated", async () => {
      const mockUser = { id: "123", email: "test@example.com" };
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { getSupabaseServerClient } = await import("@/lib/supabase/client");
      vi.mocked(getSupabaseServerClient).mockResolvedValue({
        auth: { getUser: mockGetUser },
      } as unknown as Awaited<ReturnType<typeof getSupabaseServerClient>>);

      const user = await getCurrentUser();

      expect(mockGetUser).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    });

    it("should return null when not authenticated", async () => {
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { getSupabaseServerClient } = await import("@/lib/supabase/client");
      vi.mocked(getSupabaseServerClient).mockResolvedValue({
        auth: { getUser: mockGetUser },
      } as unknown as Awaited<ReturnType<typeof getSupabaseServerClient>>);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe("requireUser", () => {
    it("should return user when authenticated", async () => {
      const mockUser = { id: "123", email: "test@example.com" };
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { getSupabaseServerClient } = await import("@/lib/supabase/client");
      vi.mocked(getSupabaseServerClient).mockResolvedValue({
        auth: { getUser: mockGetUser },
      } as unknown as Awaited<ReturnType<typeof getSupabaseServerClient>>);

      const user = await requireUser();

      expect(user).toEqual(mockUser);
    });

    it("should throw error when not authenticated", async () => {
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { getSupabaseServerClient } = await import("@/lib/supabase/client");
      vi.mocked(getSupabaseServerClient).mockResolvedValue({
        auth: { getUser: mockGetUser },
      } as unknown as Awaited<ReturnType<typeof getSupabaseServerClient>>);

      await expect(requireUser()).rejects.toThrow("Unauthorized");
    });
  });
});

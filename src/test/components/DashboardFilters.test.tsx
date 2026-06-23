import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { useRouter, useSearchParams } from "next/navigation";
import type { DashboardFilters as DashboardFiltersType } from "@/services/dashboard";

// Mock Next.js navigation hooks
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe("DashboardFilters Component", () => {
  let mockRouter: any;
  let mockSearchParams: any;
  let mockCurrentFilters: DashboardFiltersType;

  beforeEach(() => {
    mockRouter = {
      push: vi.fn(),
    };
    mockSearchParams = {
      toString: vi.fn().mockReturnValue(""),
    };
    mockCurrentFilters = {
      q: "",
      minScore: undefined,
      minSeverity: undefined,
      minBuyingIntent: undefined,
      sort: "score_desc",
    };

    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
  });

  it("should render filter form", () => {
    render(<DashboardFilters currentFilters={mockCurrentFilters} />);

    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search opportunities...")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("0").length).toBeGreaterThanOrEqual(1);
  });

  it("should show Clear all button when filters active", () => {
    mockCurrentFilters.q = "test";
    render(<DashboardFilters currentFilters={mockCurrentFilters} />);

    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("should hide Clear all button when no filters active", () => {
    render(<DashboardFilters currentFilters={mockCurrentFilters} />);

    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("should update search query on input change", () => {
    render(<DashboardFilters currentFilters={mockCurrentFilters} />);

    const searchInput = screen.getByPlaceholderText("Search opportunities...");
    fireEvent.change(searchInput, { target: { value: "new query" } });

    expect(searchInput).toHaveValue("new query");
  });

  it("should clear filters when Clear all clicked", () => {
    mockCurrentFilters.q = "test";
    render(<DashboardFilters currentFilters={mockCurrentFilters} />);

    const clearButton = screen.getByText("Clear all");
    fireEvent.click(clearButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/");
  });

  it("should apply filters when Apply Filters clicked", () => {
    render(<DashboardFilters currentFilters={mockCurrentFilters} />);

    const applyButton = screen.getByText("Apply Filters");
    fireEvent.click(applyButton);

    expect(mockRouter.push).toHaveBeenCalled();
  });
});

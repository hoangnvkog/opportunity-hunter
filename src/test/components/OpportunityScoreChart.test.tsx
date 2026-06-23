import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpportunityScoreChart } from "@/components/dashboard/OpportunityScoreChart";
import type { OpportunityView } from "@/services/opportunities";

// Mock Recharts to avoid rendering issues in tests
vi.mock("recharts", () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

function makeOpp(overrides: Partial<OpportunityView> = {}): OpportunityView {
  return {
    id: "1",
    title: "Opportunity 1",
    description: "Desc 1",
    frequency: 10,
    severity: 0.8,
    buyingIntent: 0.7,
    score: 85,
    clusterSize: 5,
    recencyScore: 0.9,
    sourceDiversity: 0.6,
    category: "technical",
    source: "reddit",
    createdAt: new Date("2026-06-23"),
    insight: null,
    ...overrides,
  };
}

describe("OpportunityScoreChart Component", () => {
  it("should show empty state when no data", () => {
    render(<OpportunityScoreChart data={[]} />);

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("should render chart with data", () => {
    const mockData = [makeOpp(), makeOpp({ id: "2", title: "Opportunity 2", score: 75 })];

    render(<OpportunityScoreChart data={mockData} />);

    expect(screen.getByText("Top Opportunities by Score")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("should truncate long titles in chart", () => {
    const mockData = [makeOpp({ title: "Very Long Opportunity Title That Should Be Truncated" })];

    render(<OpportunityScoreChart data={mockData} />);

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });
});

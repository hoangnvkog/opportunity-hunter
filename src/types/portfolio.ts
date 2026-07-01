// Sprint 60: Portfolio Intelligence Engine - Types

// Database types will be used when available
type Database = { public: { Tables: { portfolio_items: { Row: PortfolioItemRow; Insert: PortfolioItemInput; Update: Partial<PortfolioItemInput> } } } };

// ==========================================
// ENUMS
// ==========================================

export const PortfolioStatus = {
  WATCHLIST: 'WATCHLIST',
  RESEARCHING: 'RESEARCHING',
  VALIDATED: 'VALIDATED',
  BUILDING: 'BUILDING',
  INVESTED: 'INVESTED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type PortfolioStatus = typeof PortfolioStatus[keyof typeof PortfolioStatus];

export const PortfolioStatusLabels: Record<PortfolioStatus, string> = {
  WATCHLIST: 'Watchlist',
  RESEARCHING: 'Researching',
  VALIDATED: 'Validated',
  BUILDING: 'Building',
  INVESTED: 'Invested',
  ARCHIVED: 'Archived',
};

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

export const PriorityLabels: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

// ==========================================
// DATABASE ROW
// ==========================================

export type PortfolioItemRow = Database['public']['Tables']['portfolio_items']['Row'];
export type PortfolioItemInsert = Database['public']['Tables']['portfolio_items']['Insert'];
export type PortfolioItemUpdate = Database['public']['Tables']['portfolio_items']['Update'];

// ==========================================
// INPUT
// ==========================================

export interface PortfolioItemInput {
  opportunity_id: string;
  status?: PortfolioStatus;
  priority?: Priority;
  health_score?: number;
  watch_score?: number;
  favorite?: boolean;
  archived?: boolean;
  notes?: string;
  last_reviewed_at?: string;
}

// ==========================================
// CARD (for UI display)
// ==========================================

export interface PortfolioCard {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  status: PortfolioStatus;
  priority: Priority;
  health_score: number | null;
  watch_score: number | null;
  favorite: boolean;
  archived: boolean;
  notes: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Enriched fields from related tables
  investment_score?: number | null;
  backtesting_accuracy?: number | null;
  trend_score?: number | null;
  forecast_growth?: number | null;
  validation_score?: number | null;
}

// ==========================================
// STATISTICS
// ==========================================

export interface PortfolioStatistics {
  total_items: number;
  by_status: Record<PortfolioStatus, number>;
  by_priority: Record<Priority, number>;
  by_health: {
    excellent: number;    // 90-100
    good: number;         // 70-89
    fair: number;         // 50-69
    poor: number;         // 0-49
    unscored: number;
  };
  favorites: number;
  archived: number;
  average_health: number | null;
  needs_review: number;  // not reviewed in 30 days
}

// ==========================================
// HEALTH TIMELINE (for charts)
// ==========================================

export interface HealthTimelinePoint {
  date: string;
  health_score: number;
  investment_score?: number;
  backtesting_accuracy?: number;
  trend_score?: number;
}

// ==========================================
// FILTERS
// ==========================================

export interface PortfolioFilters {
  status?: PortfolioStatus | PortfolioStatus[];
  priority?: Priority | Priority[];
  favorite?: boolean;
  archived?: boolean;
  min_health?: number;
  max_health?: number;
  needs_review?: boolean;  // not reviewed in X days
  search?: string;
}

// ==========================================
// SORT
// ==========================================

export const PortfolioSortField = {
  HEALTH: 'health_score',
  PRIORITY: 'priority',
  STATUS: 'status',
  CREATED: 'created_at',
  REVIEWED: 'last_reviewed_at',
} as const;

export type PortfolioSortField = typeof PortfolioSortField[keyof typeof PortfolioSortField];

export interface PortfolioSort {
  field: PortfolioSortField;
  direction: 'asc' | 'desc';
}

// ==========================================
// HEALTH CALCULATION INPUT
// ==========================================

export interface HealthCalculationInput {
  investment_score?: number | null;
  backtesting_accuracy?: number | null;
  trend_score?: number | null;
  forecast_growth?: number | null;
  validation_score?: number | null;
  ai_confidence?: number | null;
}

// ==========================================
// REVIEW ACTION
// ==========================================

export interface ReviewAction {
  portfolio_id: string;
  notes?: string;
  status?: PortfolioStatus;
  priority?: Priority;
}

// ==========================================
// EXPORT FORMAT
// ==========================================

export const ExportFormat = {
  CSV: 'csv',
  PDF: 'pdf',
  JSON: 'json',
} as const;

export type ExportFormat = typeof ExportFormat[keyof typeof ExportFormat];

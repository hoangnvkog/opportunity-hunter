export interface OpportunityFilters {
  search?: string;
  minScore?: number;
  minFrequency?: number;
  minSeverity?: number;
  minBuyingIntent?: number;
  limit?: number;
}

export interface StartupIdeaFilters {
  search?: string;
  limit?: number;
}

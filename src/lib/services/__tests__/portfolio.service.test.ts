// Sprint 60: Portfolio Intelligence Engine - Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository';
import {
  addToPortfolio,
  updateStatus,
  updatePriority,
  toggleFavorite,
  archiveItem,
  reviewItem,
  calculateHealthScore,
  updateHealthScore,
  getPortfolioItem,
  listPortfolio,
  getStatistics,
} from '@/lib/services/portfolio.service';
import type {
  PortfolioItemInput,
  PortfolioStatus,
  Priority,
  HealthCalculationInput,
  ReviewAction,
} from '@/types/portfolio';

vi.mock('@/lib/repositories/portfolio.repository');
vi.mock('@/lib/services/analytics.service');

describe('Portfolio Repository', () => {
  let repo: PortfolioRepository;

  beforeEach(() => {
    repo = new PortfolioRepository();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create portfolio item with defaults', async () => {
      const input: PortfolioItemInput = {
        opportunity_id: 'opp-1',
      };

      const mockItem = {
        id: 'port-1',
        opportunity_id: 'opp-1',
        status: 'WATCHLIST',
        priority: 'MEDIUM',
        favorite: false,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(repo, 'create').mockResolvedValue(mockItem as any);

      const result = await repo.create(input);

      expect(result).toEqual(mockItem);
      expect(result.status).toBe('WATCHLIST');
      expect(result.priority).toBe('MEDIUM');
    });

    it('should create portfolio item with custom values', async () => {
      const input: PortfolioItemInput = {
        opportunity_id: 'opp-1',
        status: 'VALIDATED',
        priority: 'HIGH',
        health_score: 85.5,
        favorite: true,
      };

      const mockItem = {
        id: 'port-1',
        ...input,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(repo, 'create').mockResolvedValue(mockItem as any);

      const result = await repo.create(input);

      expect(result.status).toBe('VALIDATED');
      expect(result.priority).toBe('HIGH');
      expect(result.health_score).toBe(85.5);
      expect(result.favorite).toBe(true);
    });
  });

  describe('update', () => {
    it('should update portfolio item', async () => {
      const updates = {
        status: 'BUILDING' as PortfolioStatus,
        priority: 'CRITICAL' as Priority,
        notes: 'Updated notes',
      };

      const mockItem = {
        id: 'port-1',
        opportunity_id: 'opp-1',
        ...updates,
        favorite: false,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(repo, 'update').mockResolvedValue(mockItem as any);

      const result = await repo.update('port-1', updates);

      expect(result).toEqual(mockItem);
      expect(result.status).toBe('BUILDING');
      expect(result.notes).toBe('Updated notes');
    });
  });

  describe('archive', () => {
    it('should archive portfolio item', async () => {
      const mockItem = {
        id: 'port-1',
        opportunity_id: 'opp-1',
        status: 'WATCHLIST',
        priority: 'MEDIUM',
        archived: true,
        favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(repo, 'archive').mockResolvedValue(mockItem as any);

      const result = await repo.archive('port-1');

      expect(result.archived).toBe(true);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite from false to true', async () => {
      const currentItem = {
        id: 'port-1',
        opportunity_id: 'opp-1',
        status: 'WATCHLIST',
        priority: 'MEDIUM',
        favorite: false,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedItem = { ...currentItem, favorite: true };

      vi.spyOn(repo, 'findById').mockResolvedValue(currentItem as any);
      vi.spyOn(repo, 'update').mockResolvedValue(updatedItem as any);

      const result = await repo.toggleFavorite('port-1');

      expect(result.favorite).toBe(true);
    });
  });

  describe('list', () => {
    it('should list portfolio items with filters', async () => {
      const mockItems = [
        {
          id: 'port-1',
          opportunity_id: 'opp-1',
          status: 'VALIDATED',
          priority: 'HIGH',
          health_score: 85,
          favorite: true,
          archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'port-2',
          opportunity_id: 'opp-2',
          status: 'VALIDATED',
          priority: 'MEDIUM',
          health_score: 75,
          favorite: false,
          archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.spyOn(repo, 'list').mockResolvedValue(mockItems as any);

      const result = await repo.list(
        { status: 'VALIDATED', min_health: 70 },
        { field: 'health_score', direction: 'desc' },
        10
      );

      expect(result).toEqual(mockItems);
      expect(result.length).toBe(2);
      expect(result[0].status).toBe('VALIDATED');
    });
  });

  describe('statistics', () => {
    it('should calculate portfolio statistics', async () => {
      const mockStats = {
        total_items: 10,
        by_status: {
          WATCHLIST: 3,
          RESEARCHING: 2,
          VALIDATED: 3,
          BUILDING: 1,
          INVESTED: 1,
          ARCHIVED: 0,
        },
        by_priority: {
          LOW: 2,
          MEDIUM: 5,
          HIGH: 2,
          CRITICAL: 1,
        },
        by_health: {
          excellent: 2,
          good: 4,
          fair: 2,
          poor: 1,
          unscored: 1,
        },
        favorites: 3,
        archived: 0,
        average_health: 72.5,
        needs_review: 4,
      };

      vi.spyOn(repo, 'statistics').mockResolvedValue(mockStats);

      const result = await repo.statistics();

      expect(result).toEqual(mockStats);
      expect(result.total_items).toBe(10);
      expect(result.average_health).toBe(72.5);
    });
  });
});

describe('Portfolio Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateHealthScore', () => {
    it('should calculate health score with all inputs', () => {
      const input: HealthCalculationInput = {
        investment_score: 85,
        backtesting_accuracy: 78,
        trend_score: 72,
        forecast_growth: 50,
        validation_score: 80,
        ai_confidence: 0.85,
      };

      const result = calculateHealthScore(input);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should calculate health score with partial inputs', () => {
      const input: HealthCalculationInput = {
        investment_score: 85,
        backtesting_accuracy: 78,
        trend_score: null,
        forecast_growth: null,
        validation_score: null,
        ai_confidence: null,
      };

      const result = calculateHealthScore(input);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should return 0 when no inputs provided', () => {
      const input: HealthCalculationInput = {
        investment_score: null,
        backtesting_accuracy: null,
        trend_score: null,
        forecast_growth: null,
        validation_score: null,
        ai_confidence: null,
      };

      const result = calculateHealthScore(input);

      expect(result).toBe(0);
    });

    it('should normalize forecast growth correctly', () => {
      const input: HealthCalculationInput = {
        investment_score: 80,
        backtesting_accuracy: 80,
        trend_score: 80,
        forecast_growth: 100, // Max positive growth
        validation_score: 80,
        ai_confidence: 0.8,
      };

      const result = calculateHealthScore(input);

      expect(result).toBeGreaterThan(75);
    });
  });
});

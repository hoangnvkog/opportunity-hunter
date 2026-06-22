import { SavedOpportunitiesRepository } from "@/lib/db/repositories/saved-opportunities.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import type { SavedOpportunityCardData } from "@/types/saved-opportunity";
import type { Uuid } from "@/types";

export class SavedOpportunitiesService {
  private savedRepo: SavedOpportunitiesRepository;
  private opportunitiesRepo: OpportunitiesRepository;

  constructor(savedRepo: SavedOpportunitiesRepository, opportunitiesRepo: OpportunitiesRepository) {
    this.savedRepo = savedRepo;
    this.opportunitiesRepo = opportunitiesRepo;
  }

  static async create(): Promise<SavedOpportunitiesService> {
    const savedRepo = await SavedOpportunitiesRepository.create();
    const opportunitiesRepo = await OpportunitiesRepository.create();
    return new SavedOpportunitiesService(savedRepo, opportunitiesRepo);
  }

  /**
   * Save an opportunity for a user
   */
  async save(userId: Uuid, opportunityId: Uuid): Promise<void> {
    await this.savedRepo.save(userId, opportunityId);
  }

  /**
   * Unsave an opportunity for a user
   */
  async unsave(userId: Uuid, opportunityId: Uuid): Promise<void> {
    await this.savedRepo.unsave(userId, opportunityId);
  }

  /**
   * Check if an opportunity is saved by a user
   */
  async isSaved(userId: Uuid, opportunityId: Uuid): Promise<boolean> {
    return this.savedRepo.isSaved(userId, opportunityId);
  }

  /**
   * Get all saved opportunities with full details
   */
  async getSavedOpportunities(userId: Uuid): Promise<SavedOpportunityCardData[]> {
    const savedRows = await this.savedRepo.listSaved(userId);
    
    if (savedRows.length === 0) {
      return [];
    }

    // Fetch full opportunity details for each saved opportunity
    const savedOpportunities: SavedOpportunityCardData[] = [];

    for (const saved of savedRows) {
      const opportunity = await this.opportunitiesRepo.findByIdWithCluster(saved.opportunity_id);
      
      if (opportunity) {
        savedOpportunities.push({
          id: saved.id,
          opportunity_id: opportunity.id,
          title: opportunity.title,
          description: opportunity.description,
          score: opportunity.score,
          frequency: opportunity.frequency,
          severity: opportunity.severity,
          buying_intent: opportunity.buying_intent,
          cluster_name: opportunity.pain_clusters.name,
          cluster_description: opportunity.pain_clusters.description,
          saved_at: saved.created_at,
        });
      }
    }

    return savedOpportunities;
  }

  /**
   * Count saved opportunities for a user
   */
  async count(userId: Uuid): Promise<number> {
    return this.savedRepo.countSaved(userId);
  }
}

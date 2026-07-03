/**
 * Gemini Provider - stub implementation
 * TODO: Implement with Google AI SDK (@google/generative-ai) when ready
 *
 * This provider will use Google's Gemini models for:
 * - Pain point extraction from raw posts
 * - Semantic clustering of pain points
 * - Opportunity scoring and generation
 * - Startup idea generation
 */

import type { AIProvider } from "@/types/ai";
import type {
  RawPostInput,
  PainPointInput,
  PainClusterInput,
  OpportunityInput,
  StartupIdeaInput,
} from "@/types/pipeline";
import type { OpportunityInsightInput } from "@/types/opportunity-insight";
import type { OpportunityValidationInput } from "@/types/validation";
import type { EvidenceInput } from "@/types/evidence";
import type { ForecastInput } from "@/types/forecast";
import type { MarketIntelligenceInput } from "@/types/market-intelligence";
import type { StartupScoreInput } from "@/types/startup-score";
import type { VentureReportInput } from "@/types/venture-report";
import type { InvestmentMemoInput } from "@/types/investment-memo";
import type { BacktestInput, BacktestEvaluation } from "@/types/backtesting";
import type { CommitteeVoteInput } from "@/types/committee";
import type { CommitteeAgentVote } from "@/types/investment-committee";
import type { VentureProjectInput } from "@/types/venture-studio";

export class GeminiProvider implements AIProvider {
  constructor(
    private readonly apiKey?: string,
    private readonly model: string = "gemini-1.5-flash",
  ) {
    // TODO: Initialize Gemini client when SDK is installed
    // this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Extract pain points using Gemini
   */
  async extractPainPoints(_posts: RawPostInput[]): Promise<PainPointInput[]> {
    throw new Error(
      "GeminiProvider.extractPainPoints() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }

  /**
   * Cluster pain points using Gemini embeddings or generative model
   */
  async clusterPainPoints(
    _painPoints: PainPointInput[],
  ): Promise<PainClusterInput[]> {
    throw new Error(
      "GeminiProvider.clusterPainPoints() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }

  /**
   * Generate opportunities using Gemini
   */
  async generateOpportunities(
    _clusters: PainClusterInput[],
  ): Promise<OpportunityInput[]> {
    throw new Error(
      "GeminiProvider.generateOpportunities() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }

  /**
   * Generate business insights using Gemini (Sprint 46 — stub).
   */
  async generateInsights(
    _opportunities: OpportunityInput[],
  ): Promise<OpportunityInsightInput[]> {
    throw new Error(
      "GeminiProvider.generateInsights() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }

  /**
   * Generate startup ideas using Gemini
   */
  async generateStartupIdeas(
    _opportunities: OpportunityInput[],
  ): Promise<StartupIdeaInput[]> {
    throw new Error(
      "GeminiProvider.generateStartupIdeas() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }

  async validateOpportunities(
    _opportunities: OpportunityInput[],
  ): Promise<OpportunityValidationInput[]> {
    throw new Error(
      "GeminiProvider.validateOpportunities() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }

  async findMarketEvidence(
    _opportunities: OpportunityInput[],
  ): Promise<EvidenceInput[][]> {
    // Gemini stub — fall back to OpenAI path in the service layer
    // or implement when @google/generative-ai SDK is installed.
    throw new Error(
      "GeminiProvider.findMarketEvidence() not implemented yet. " +
      "Install @google/generative-ai SDK and implement, or use OpenAI provider.",
    );
  }

  async forecastOpportunities(
    _opportunities: OpportunityInput[],
  ): Promise<ForecastInput[]> {
    throw new Error(
      "GeminiProvider.forecastOpportunities() not implemented yet. " +
      "Install @google/generative-ai SDK and implement, or use OpenAI provider.",
    );
  }

  async generateMarketIntelligence(
    _opportunities: OpportunityInput[],
  ): Promise<MarketIntelligenceInput[]> {
    // Gemini stub — fall back to OpenAI path in the service layer
    // or implement when @google/generative-ai SDK is installed.
    throw new Error(
      "GeminiProvider.generateMarketIntelligence() not implemented yet. " +
      "Install @google/generative-ai SDK and implement, or use OpenAI provider.",
    );
  }

  async scoreStartupPotential(
    _opportunities: OpportunityInput[],
  ): Promise<StartupScoreInput[]> {
    // Gemini stub — fall back to OpenAI path in the service layer
    // or implement when @google/generative-ai SDK is installed.
    throw new Error(
      "GeminiProvider.scoreStartupPotential() not implemented yet. " +
      "Install @google/generative-ai SDK and implement, or use OpenAI provider.",
    );
  }

  async generateVentureReport(
    _opportunities: OpportunityInput[],
  ): Promise<VentureReportInput[]> {
    throw new Error(
      "GeminiProvider.generateVentureReport() not implemented yet. " +
      "Install @google/generative-ai SDK and implement, or use OpenAI provider.",
    );
  }

  async generateInvestmentMemo(
    _opportunities: OpportunityInput[],
  ): Promise<InvestmentMemoInput[]> {
    throw new Error(
      "GeminiProvider.generateInvestmentMemo() not implemented yet. " +
      "Install @google/generative-ai SDK and implement, or use OpenAI provider.",
    );
  }

  async evaluateBacktest(_inputs: BacktestInput[]): Promise<BacktestEvaluation[]> {
    throw new Error(
      "GeminiProvider.evaluateBacktest() not implemented yet. " +
      "Install @google/generative-ai SDK and implement, or use OpenAI provider.",
    );
  }

  async generateCommitteeVote(_input: CommitteeVoteInput): Promise<CommitteeAgentVote[]> {
    throw new Error(
      "GeminiProvider.generateCommitteeVote() not implemented yet. " +
      "Install @google/generative-ai SDK and implement, or use OpenAI provider.",
    );
  }

  async generateVentureProject(
    _opportunities: OpportunityInput[],
  ): Promise<VentureProjectInput[]> {
    throw new Error(
      "GeminiProvider.generateVentureProject() not implemented yet. " +
      "Install @google/generative-ai SDK and implement, or use OpenAI provider.",
    );
  }
}
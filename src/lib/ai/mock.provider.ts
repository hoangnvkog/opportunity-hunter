/**
 * Mock AI Provider - returns fake responses for testing and development
 *
 * NOTE: AI layer returns pure business data only.
 * NO database UUIDs, NO synthetic IDs.
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

export class MockProvider implements AIProvider {
  async extractPainPoints(posts: RawPostInput[]): Promise<PainPointInput[]> {
    const painPoints: PainPointInput[] = [];

    for (const post of posts) {
      painPoints.push({
        pain: `Manual process causing errors and inefficiency`,
        category: "Operations",
        severity: 0.8,
        buying_intent: 0.7,
      });

      if (post.score && post.score > 80) {
        painPoints.push({
          pain: `Time-consuming task preventing focus on core business`,
          category: "Productivity",
          severity: 0.9,
          buying_intent: 0.85,
        });
      }
    }

    return painPoints;
  }

  async clusterPainPoints(painPoints: PainPointInput[]): Promise<PainClusterInput[]> {
    const clusterMap = new Map<string, { name: string; description: string; indexes: number[] }>();

    for (let i = 0; i < painPoints.length; i++) {
      const category = painPoints[i].category;
      if (!clusterMap.has(category)) {
        clusterMap.set(category, {
          name: category,
          description: `Pain points related to ${category.toLowerCase()}`,
          indexes: [],
        });
      }
      clusterMap.get(category)!.indexes.push(i);
    }

    return Array.from(clusterMap.values()).map((c) => ({
      cluster_name: c.name,
      description: c.description,
      pain_point_indexes: c.indexes,
    }));
  }

  async generateOpportunities(clusters: PainClusterInput[]): Promise<OpportunityInput[]> {
    return clusters.map((cluster, index) => {
      const frequency = 3 + index;
      const severity = 0.8 + index * 0.05;
      const buyingIntent = 0.7 + index * 0.1;
      const score = Math.round(
        (frequency * 10 + severity * 100 + buyingIntent * 100) / 3,
      );

      return {
        score,
        frequency,
        severity,
        buying_intent: buyingIntent,
        cluster_name: cluster.cluster_name,
        cluster_description: cluster.description,
      };
    });
  }

  async generateStartupIdeas(opportunities: OpportunityInput[]): Promise<StartupIdeaInput[]> {
    return opportunities
      .filter((opp) => opp.score > 70)
      .map((opp, index) => ({
        problem: "Businesses struggle with manual processes and inefficiency in this area",
        solution: `AI-Powered Solution ${index + 1} - Automated platform using machine learning`,
        mvp: "Simple web dashboard with AI assistant",
        pricing: "$99-$499/month SaaS subscription based on usage volume",
        customer: "Small and medium businesses with 10-100 employees",
        distribution: "SEO + Content Marketing + Reddit + Product Hunt",
        competitors: "Existing SaaS tools and manual workflows",
      }));
  }

  async generateInsights(
    opportunities: OpportunityInput[],
  ): Promise<OpportunityInsightInput[]> {
    // Synthetic insights that scale with the opportunity's score so tests
    // can observe the signal deterministically without burning API quota.
    return opportunities.map((opp) => {
      const intensity = opp.score / 100;
      const competition =
        intensity > 0.75 ? "High" : intensity > 0.4 ? "Medium" : "Low";
      const urgency =
        opp.buying_intent > 0.7 ? "High" : opp.buying_intent > 0.4 ? "Medium" : "Low";
      const market =
        intensity > 0.7 ? "$1.2B TAM (US)" : intensity > 0.4 ? "$300M TAM" : "Niche (~5k buyers)";
      return {
        summary: `Pain around ${opp.cluster_name ?? "this cluster"} suggests a SaaS opportunity to streamline manual workflows.`,
        market_size: market,
        competition_level: competition as OpportunityInsightInput["competition_level"],
        urgency: urgency as OpportunityInsightInput["urgency"],
        recommended_mvp: "Web dashboard with templated workflows and one-click integrations.",
        recommended_channels: "Reddit, Product Hunt, SEO",
        confidence_score: Math.round(Math.min(0.95, 0.5 + intensity / 2) * 100) / 100,
      };
    });
  }

  async validateOpportunities(
    opportunities: OpportunityInput[],
  ): Promise<OpportunityValidationInput[]> {
    // Returns deterministic mock validation data for testing.
    // Uses opportunity score as a signal so tests can verify ordering.
    return opportunities.map((opp) => {
      const score = opp.score / 100;
      const marketDemand = Math.round(60 + score * 30);
      const competition = Math.round(40 + (1 - score) * 40);
      const monetization = Math.round(65 + score * 25);
      const buildDifficulty = Math.round(50 - score * 30);
      const validationScore = Math.round(
        marketDemand * 0.30 +
        monetization * 0.35 +
        (100 - competition) * 0.25 +
        (100 - buildDifficulty) * 0.10,
      );
      return {
        market_demand: marketDemand,
        competition,
        monetization,
        build_difficulty: buildDifficulty,
        validation_score: validationScore,
        reasoning: `Mock validation for ${opp.cluster_name ?? "opportunity"}: ` +
          `Market=${marketDemand}, Competition=${competition}, ` +
          `Monetization=${monetization}, Difficulty=${buildDifficulty}`,
      };
    });
  }

  async findMarketEvidence(
    opportunities: OpportunityInput[],
  ): Promise<EvidenceInput[][]> {
    // Deterministic mock evidence for testing
    // Returns 3-5 evidence items per opportunity
    return opportunities.map((opp, idx) => {
      const baseScore = (opp.score ?? 50) / 100;
      const evidence: EvidenceInput[] = [
        {
          evidence_type: "competitor",
          source: "Market Analysis",
          title: `Competitor ${idx + 1}`,
          summary: `Established player ${idx + 1} serving the ${opp.cluster_name ?? "market"} space`,
          confidence: Math.round((0.7 + baseScore * 0.2) * 100) / 100 * 100,
        },
        {
          evidence_type: "pricing",
          source: "Pricing Data",
          title: "Market pricing signal",
          summary: "Pricing ranges from $29-$199/month in this segment",
          confidence: 85,
        },
        {
          evidence_type: "customer_quote",
          source: "Customer Feedback",
          title: "Customer pain point",
          summary: "Users seeking better solutions for this problem",
          confidence: Math.round((0.6 + baseScore * 0.3) * 100) / 100 * 100,
        },
      ];
      // Add more evidence for higher-scored opportunities
      if (opp.score >= 80) {
        evidence.push({
          evidence_type: "market_report",
          source: "Industry Report",
          title: "Market growth report",
          summary: "Market showing strong growth trajectory",
          confidence: 90,
        });
      }
      if (opp.score >= 90) {
        evidence.push({
          evidence_type: "google_trend",
          source: "Google Trends",
          title: "Search trend spike",
          summary: "Search interest up 40% YoY",
          confidence: 88,
        });
      }
      return evidence;
    });
  }

  async forecastOpportunities(
    opportunities: OpportunityInput[],
  ): Promise<ForecastInput[]> {
    return opportunities.map((opp) => {
      const base = (opp.score ?? 50) / 100;
      const forecastScore = Math.round(60 + base * 35);
      const growthProbability = Math.round(50 + base * 45);
      const confidence = Math.round(55 + base * 40);
      const momentum = Math.round(50 + base * 40);
      return {
        forecast_score: forecastScore,
        growth_probability: growthProbability,
        confidence,
        momentum,
        prediction_summary: `Mock forecast: Score=${forecastScore}, Growth=${growthProbability}%.`,
      };
    });
  }

  async generateMarketIntelligence(
    opportunities: OpportunityInput[],
  ): Promise<MarketIntelligenceInput[]> {
    // Deterministic mock intelligence: scores scale with opportunity score
    // so tests can verify ordering without burning API quota.
    return opportunities.map((opp, idx) => {
      const base = Math.max(0, Math.min(1, (opp.score ?? 50) / 100));
      const reddit = Math.round(55 + base * 40);
      const github = Math.round(50 + base * 40);
      const productHunt = Math.round(40 + base * 50);
      const news = Math.round(35 + base * 50);
      const googleTrends = Math.round(45 + base * 45);
      const jobs = Math.round(30 + base * 55);
      const overall = Math.round(
        (reddit + github + productHunt + news + googleTrends + jobs) / 6,
      );
      const confidence = Math.round(60 + base * 35);
      return {
        reddit_score: reddit,
        github_score: github,
        product_hunt_score: productHunt,
        news_score: news,
        google_trends_score: googleTrends,
        jobs_score: jobs,
        overall_score: overall,
        confidence,
        summary: `Mock market intelligence for ${opp.cluster_name ?? `opportunity ${idx + 1}`}: overall ${overall}, confidence ${confidence}.`,
      };
    });
  }

  async scoreStartupPotential(
    opportunities: OpportunityInput[],
  ): Promise<StartupScoreInput[]> {
    // Deterministic VC-style mock scoring: scores scale with opportunity score
    // so tests can verify ordering without burning API quota.
    return opportunities.map((opp, idx) => {
      const base = Math.max(0, Math.min(1, (opp.score ?? 50) / 100));
      const tam = Math.round(45 + base * 50);
      const timing = Math.round(40 + base * 55);
      const competition = Math.round(35 + base * 60);
      const moat = Math.round(30 + base * 65);
      const distribution = Math.round(40 + base * 55);
      const execution = Math.round(50 + base * 45);
      const capitalEfficiency = Math.round(45 + base * 50);
      const overall = Math.round(
        (tam + timing + competition + moat + distribution + execution + capitalEfficiency) / 7,
      );
      const confidence = Math.round(60 + base * 35);
      const recommendation: StartupScoreInput["recommendation"] =
        overall >= 85 ? "Strong Invest" : overall >= 65 ? "Watch" : "Pass";
      return {
        tam_score: tam,
        market_timing_score: timing,
        competition_score: competition,
        moat_score: moat,
        distribution_score: distribution,
        execution_score: execution,
        capital_efficiency_score: capitalEfficiency,
        overall_score: overall,
        confidence,
        recommendation,
        summary: `Mock VC score for ${opp.cluster_name ?? `opportunity ${idx + 1}`}: overall ${overall}, ${recommendation}.`,
      };
    });
  }

  async generateVentureReport(
    opportunities: OpportunityInput[],
  ): Promise<VentureReportInput[]> {
    // Deterministic mock venture reports for testing
    return opportunities.map((opp, idx) => {
      const base = Math.max(0, Math.min(1, (opp.score ?? 50) / 100));
      const confidence = Math.round(70 + base * 25);
      return {
        title: `Venture Research Report: ${opp.cluster_name ?? `Opportunity ${idx + 1}`}`,
        executive_summary: `Executive summary for ${opp.cluster_name ?? `opportunity ${idx + 1}`}. This opportunity shows strong potential with an overall investment score reflecting market timing, competitive positioning, and execution capability.`,
        problem: `Businesses in the ${opp.cluster_name ?? "target market"} space struggle with manual processes, inefficiency, and lack of automated solutions.`,
        market_analysis: `The market for ${opp.cluster_name ?? "this segment"} is growing rapidly, driven by digital transformation trends and increasing demand for automation.`,
        tam_analysis: `Total Addressable Market estimated at $${Math.round(200 + base * 800)}M globally, with ${Math.round(30 + base * 40)}% CAGR over the next 5 years.`,
        competition_analysis: `Moderate competitive landscape with ${Math.round(3 + base * 10)} key players. Differentiation through AI/ML capabilities and vertical specialization.`,
        customer_segments: `Primary: SMBs (10-500 employees). Secondary: Mid-market (500-2000 employees). Tertiary: Enterprise (>2000 employees).`,
        business_model: `SaaS subscription model with tiered pricing. Monthly recurring revenue with annual contracts for enterprise.`,
        pricing_strategy: `Starter: $99/mo. Professional: $299/mo. Enterprise: Custom pricing. Annual discounts of 20%.`,
        go_to_market: `Product-led growth with content marketing, SEO, and strategic partnerships. Launch on Product Hunt, leverage Reddit communities.`,
        distribution_strategy: `Direct sales for enterprise. Self-serve for SMB. Channel partnerships with system integrators.`,
        product_roadmap: `Q1: Core MVP. Q2: Integrations. Q3: AI features. Q4: Enterprise features and compliance.`,
        technical_risks: `AI model accuracy at scale. Data privacy compliance. Integration complexity with legacy systems.`,
        business_risks: `Market saturation risk. Customer acquisition cost inflation. Competitive response from incumbents.`,
        competitive_advantages: `Proprietary AI models trained on domain-specific data. Deep workflow integrations. Network effects from user-generated templates.`,
        moat_analysis: `Data moat from user interactions. Switching costs from workflow integration. Brand moat from community.`,
        financial_outlook: `Year 1: $${Math.round(200 + base * 800)}K ARR. Year 3: $${Math.round(2 + base * 8)}M ARR. Path to profitability by Year 2.`,
        recommendation: confidence >= 85 ? "STRONG BUY" : confidence >= 70 ? "BUY" : "HOLD",
        confidence,
      };
    });
  }

  async generateInvestmentMemo(
    opportunities: OpportunityInput[],
  ): Promise<InvestmentMemoInput[]> {
    // Deterministic mock investment memos for testing.
    // Mirrors the cadence of internal memos at YC / Sequoia / a16z / Accel:
    // concise, decision-oriented, one-paragraph sections.
    return opportunities.map((opp, idx) => {
      const base = Math.max(0, Math.min(1, (opp.score ?? 50) / 100));
      const confidence = Math.round(75 + base * 22); // 75-97
      const isStrongBuy = confidence >= 85;
      const recommendation = isStrongBuy ? "STRONG BUY" : confidence >= 70 ? "BUY" : "HOLD";
      const decision = isStrongBuy
        ? "INVEST — lead the round at $1.5M-$3M seed."
        : confidence >= 70
          ? "INVEST — participate at $1M-$2M seed, prorata reserved."
          : "PASS — revisit in 6 months after traction milestone.";
      return {
        title: `Investment Memo — ${opp.cluster_name ?? `Opportunity ${idx + 1}`}`,
        thesis: `${opp.cluster_name ?? "This opportunity"} sits at the intersection of an underserved ${opp.cluster_description ?? "vertical"} and accelerating AI/automation demand. We believe a focused team can capture 5-10% of the $${Math.round(200 + base * 800)}M TAM within 5 years.`,
        market: `$${Math.round(200 + base * 800)}M globally, ${Math.round(30 + base * 40)}% CAGR. Buyer segment: SMB + mid-market, low brand loyalty, willingness to switch.`,
        problem: `Customers waste ${Math.round(5 + base * 15)} hours/week on manual workarounds. Existing solutions are fragmented, expensive, or built for enterprises.`,
        solution: `AI-first workflow automation for ${opp.cluster_name ?? "this vertical"}: zero-config onboarding, vertical-specific templates, and a usage-based pricing model that aligns incentives with customer ROI.`,
        business_model: `PLG SaaS. Free tier → $99/mo Pro → $499/mo Team → enterprise contracts. Blended ARPU ~$${Math.round(120 + base * 80)}/mo with 110% net retention.`,
        traction: `~${Math.round(50 + base * 450)} active users in private beta, ${Math.round(5 + base * 25)}% week-over-week growth. Early NPS ${Math.round(40 + base * 25)}.`,
        competition: `${Math.round(3 + base * 8)} horizontal incumbents (low vertical depth) and ${Math.round(1 + base * 4)} direct vertical challengers. No clear category leader.`,
        risks: `Distribution risk: CAC inflation in crowded channels. Technical risk: LLM cost scaling with usage. Competitive risk: incumbent bundles from HubSpot/Salesforce.`,
        strengths: `Founders have shipped 2 prior exits in this vertical. Proprietary evaluation dataset gives 18-month head-start. PLG loop converts free → paid at ${Math.round(8 + base * 7)}%.`,
        why_now: `GPT-class models crossed quality/cost threshold in 2024-2025. Buyer tolerance for AI-only tools reached an inflection. Regulatory clarity in target geographies.`,
        investment_decision: decision,
        recommendation,
        confidence,
      };
    });
  }

  async evaluateBacktest(inputs: BacktestInput[]): Promise<BacktestEvaluation[]> {
    return inputs.map((input) => {
      const { predicted_score, current_score } = input;
      const rawDelta = predicted_score - current_score;
      const absDelta = Math.abs(rawDelta);
      const accuracy = Math.max(0, Math.min(100, 100 - absDelta * 2));
      const notes =
        absDelta <= 5
          ? `Prediction highly accurate. Predicted ${predicted_score}, observed ${current_score}.`
          : absDelta <= 15
            ? `Minor deviation. Predicted ${rawDelta > 0 ? 'overestimated' : 'underestimated'} by ${absDelta.toFixed(1)} points.`
            : `Significant deviation. Predicted ${rawDelta > 0 ? 'overestimated' : 'underestimated'} by ${absDelta.toFixed(1)} points. Model needs recalibration.`;
      return {
        actual_score: Math.round(current_score * 100) / 100,
        prediction_delta: Math.round(rawDelta * 100) / 100,
        accuracy: Math.round(accuracy * 100) / 100,
        notes,
      };
    });
  }
}
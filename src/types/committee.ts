/**
 * Sprint 61: AI Investment Committee (Multi-Agent Decision Engine)
 *
 * Input shape for AI providers.
 * Business data only — the AI does not need IDs.
 */

import type {
  CommitteeAgentVote,
  CommitteeVoteContext,
} from "./investment-committee";

/**
 * Input handed to AI providers when generating committee votes.
 * The AI evaluates ALL agents in a single request and returns all five votes.
 */
export interface CommitteeVoteInput {
  context: CommitteeVoteContext;
  agents: Array<{
    name: string;
    role: string;
    focus: readonly string[];
    weight: number;
  }>;
}

export type { CommitteeAgentVote };

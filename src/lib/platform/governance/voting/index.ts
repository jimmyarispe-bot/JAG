/**
 * Enterprise Governance — voting.
 */

import type {
  GovernanceVoteBallot,
  GovernanceVoteOutcome,
  GovernanceVotePackage,
} from "@/lib/platform/governance/types";

export interface GovernanceVotingDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceVoting {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernanceVotePackage>();

  constructor(dependencies: GovernanceVotingDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  open(input: {
    subjectId: string;
    subjectKind: GovernanceVotePackage["subjectKind"];
  }): GovernanceVotePackage {
    const vote: GovernanceVotePackage = {
      voteId: this.createId("vote"),
      subjectId: input.subjectId,
      subjectKind: input.subjectKind,
      ballots: [],
      aye: 0,
      nay: 0,
      abstain: 0,
      absent: 0,
      passed: null,
      closedAt: null,
    };
    this.store.set(vote.voteId, vote);
    return vote;
  }

  cast(
    voteId: string,
    voter: string,
    outcome: GovernanceVoteOutcome,
    rationale?: string | null
  ): GovernanceVotePackage {
    const existing = this.store.get(voteId);
    if (!existing) throw new Error(`Vote not found: ${voteId}`);
    if (existing.closedAt) throw new Error(`Vote already closed: ${voteId}`);

    const ballot: GovernanceVoteBallot = {
      ballotId: this.createId("ballot"),
      voter,
      outcome,
      votedAt: this.now().toISOString(),
      rationale: rationale ?? null,
    };
    const ballots = [
      ...existing.ballots.filter((b) => b.voter !== voter),
      ballot,
    ];
    const tallied = this.tally(existing, ballots);
    this.store.set(voteId, tallied);
    return tallied;
  }

  close(voteId: string): GovernanceVotePackage {
    const existing = this.store.get(voteId);
    if (!existing) throw new Error(`Vote not found: ${voteId}`);
    const closed: GovernanceVotePackage = {
      ...existing,
      passed: existing.aye > existing.nay,
      closedAt: this.now().toISOString(),
    };
    this.store.set(voteId, closed);
    return closed;
  }

  list(): readonly GovernanceVotePackage[] {
    return Array.from(this.store.values());
  }

  get(voteId: string): GovernanceVotePackage | null {
    return this.store.get(voteId) ?? null;
  }

  private tally(
    base: GovernanceVotePackage,
    ballots: readonly GovernanceVoteBallot[]
  ): GovernanceVotePackage {
    let aye = 0;
    let nay = 0;
    let abstain = 0;
    let absent = 0;
    for (const ballot of ballots) {
      if (ballot.outcome === "aye") aye += 1;
      else if (ballot.outcome === "nay") nay += 1;
      else if (ballot.outcome === "abstain") abstain += 1;
      else absent += 1;
    }
    return { ...base, ballots, aye, nay, abstain, absent };
  }
}

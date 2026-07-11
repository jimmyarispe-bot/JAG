/**
 * Enterprise Governance — board.
 *
 * Tracks board goals, decisions, motions, and resolutions.
 */

import type {
  GovernanceBoardDecision,
  GovernanceBoardGoal,
  GovernanceBoardMotion,
  GovernanceBoardResolution,
  GovernanceBoardStatus,
  GovernanceCycleRequest,
} from "@/lib/platform/governance/types";

export interface GovernanceBoardDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceBoard {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly goals = new Map<string, GovernanceBoardGoal>();
  private readonly decisions = new Map<string, GovernanceBoardDecision>();
  private readonly motions = new Map<string, GovernanceBoardMotion>();
  private readonly resolutions = new Map<string, GovernanceBoardResolution>();

  constructor(dependencies: GovernanceBoardDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  /**
   * Materialize board artifacts from a governance cycle request.
   */
  syncFromCycle(request: GovernanceCycleRequest): {
    goals: GovernanceBoardGoal[];
    decisions: GovernanceBoardDecision[];
    motions: GovernanceBoardMotion[];
    resolutions: GovernanceBoardResolution[];
  } {
    const goals: GovernanceBoardGoal[] = [];
    const decisions: GovernanceBoardDecision[] = [];
    const motions: GovernanceBoardMotion[] = [];
    const resolutions: GovernanceBoardResolution[] = [];

    for (const goal of request.executionGoals ?? []) {
      goals.push(
        this.trackGoal({
          title: goal.title,
          description: goal.description,
          owner: "board",
          dueDate: goal.targetDate,
          linkedExecutionGoalId: goal.id,
          status: "under_review",
        })
      );
    }

    if (request.decision) {
      decisions.push(
        this.recordDecision({
          title: request.decision.recommendation.recommendedOption,
          summary: request.decision.brief.decisionSummary,
          linkedDecisionRequestId: request.decision.requestId,
          status:
            request.autonomy?.decision.approvalMode === "board_approval"
              ? "under_review"
              : "proposed",
        })
      );
    }

    if (request.autonomy?.decision.approvalMode === "board_approval") {
      const motion = this.proposeMotion({
        title: `Motion: ${request.subject}`,
        text:
          request.autonomy.decision.rationale.join(" ") ||
          request.description ||
          request.subject,
        movedBy: request.actor ?? "secretary",
      });
      motions.push(motion);
      resolutions.push(
        this.draftResolution({
          title: `Resolution: ${request.subject}`,
          text: `Resolved that the board consider ${request.subject}`,
          motionId: motion.motionId,
        })
      );
    }

    return { goals, decisions, motions, resolutions };
  }

  trackGoal(input: {
    title: string;
    description: string;
    owner: string;
    dueDate?: string | null;
    linkedExecutionGoalId?: string | null;
    status?: GovernanceBoardStatus;
  }): GovernanceBoardGoal {
    const goal: GovernanceBoardGoal = {
      goalId: this.createId("board-goal"),
      title: input.title,
      description: input.description,
      status: input.status ?? "proposed",
      owner: input.owner,
      dueDate: input.dueDate ?? null,
      linkedExecutionGoalId: input.linkedExecutionGoalId ?? null,
      createdAt: this.now().toISOString(),
    };
    this.goals.set(goal.goalId, goal);
    return goal;
  }

  recordDecision(input: {
    title: string;
    summary: string;
    linkedDecisionRequestId?: string | null;
    status?: GovernanceBoardStatus;
  }): GovernanceBoardDecision {
    const decision: GovernanceBoardDecision = {
      decisionId: this.createId("board-decision"),
      title: input.title,
      summary: input.summary,
      status: input.status ?? "proposed",
      decidedAt: null,
      linkedDecisionRequestId: input.linkedDecisionRequestId ?? null,
    };
    this.decisions.set(decision.decisionId, decision);
    return decision;
  }

  proposeMotion(input: {
    title: string;
    text: string;
    movedBy: string;
    secondedBy?: string | null;
  }): GovernanceBoardMotion {
    const motion: GovernanceBoardMotion = {
      motionId: this.createId("motion"),
      title: input.title,
      text: input.text,
      movedBy: input.movedBy,
      secondedBy: input.secondedBy ?? null,
      status: "proposed",
      createdAt: this.now().toISOString(),
    };
    this.motions.set(motion.motionId, motion);
    return motion;
  }

  secondMotion(motionId: string, secondedBy: string): GovernanceBoardMotion {
    const existing = this.motions.get(motionId);
    if (!existing) throw new Error(`Motion not found: ${motionId}`);
    const updated: GovernanceBoardMotion = {
      ...existing,
      secondedBy,
      status: "under_review",
    };
    this.motions.set(motionId, updated);
    return updated;
  }

  draftResolution(input: {
    title: string;
    text: string;
    motionId?: string | null;
  }): GovernanceBoardResolution {
    const resolution: GovernanceBoardResolution = {
      resolutionId: this.createId("resolution"),
      title: input.title,
      text: input.text,
      motionId: input.motionId ?? null,
      status: "proposed",
      adoptedAt: null,
    };
    this.resolutions.set(resolution.resolutionId, resolution);
    return resolution;
  }

  adoptResolution(resolutionId: string): GovernanceBoardResolution {
    const existing = this.resolutions.get(resolutionId);
    if (!existing) throw new Error(`Resolution not found: ${resolutionId}`);
    const updated: GovernanceBoardResolution = {
      ...existing,
      status: "passed",
      adoptedAt: this.now().toISOString(),
    };
    this.resolutions.set(resolutionId, updated);
    if (existing.motionId) {
      const motion = this.motions.get(existing.motionId);
      if (motion) {
        this.motions.set(existing.motionId, { ...motion, status: "passed" });
      }
    }
    return updated;
  }

  listGoals(): readonly GovernanceBoardGoal[] {
    return Array.from(this.goals.values());
  }

  listDecisions(): readonly GovernanceBoardDecision[] {
    return Array.from(this.decisions.values());
  }

  listMotions(): readonly GovernanceBoardMotion[] {
    return Array.from(this.motions.values());
  }

  listResolutions(): readonly GovernanceBoardResolution[] {
    return Array.from(this.resolutions.values());
  }
}

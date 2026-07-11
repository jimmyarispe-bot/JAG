/**
 * Goal Execution Engine — in-memory repository port (Sprint 011).
 *
 * Inject a concrete repository; no direct database access in the engine.
 */

import type {
  ExecutionAdjustment,
  ExecutionDependency,
  ExecutionGoal,
  ExecutionImpactAssessment,
  ExecutionInitiative,
  ExecutionMilestone,
  ExecutionNotification,
  ExecutionObjective,
  ExecutionOwners,
  ExecutionProgressSnapshot,
  ExecutionScorecard,
  ExecutionTask,
} from "@/lib/platform/execution/types";

/** Persistence port for the Goal Execution Engine. */
export interface GoalExecutionRepository {
  saveGoal(goal: ExecutionGoal): Promise<ExecutionGoal>;
  findGoal(id: string): Promise<ExecutionGoal | null>;
  listGoals(filter?: {
    organizationId?: string | null;
    includeArchived?: boolean;
  }): Promise<ExecutionGoal[]>;

  saveObjective(objective: ExecutionObjective): Promise<ExecutionObjective>;
  findObjective(id: string): Promise<ExecutionObjective | null>;
  listObjectives(filter?: { goalId?: string }): Promise<ExecutionObjective[]>;

  saveInitiative(initiative: ExecutionInitiative): Promise<ExecutionInitiative>;
  findInitiative(id: string): Promise<ExecutionInitiative | null>;
  listInitiatives(filter?: { goalId?: string }): Promise<ExecutionInitiative[]>;

  saveMilestone(milestone: ExecutionMilestone): Promise<ExecutionMilestone>;
  findMilestone(id: string): Promise<ExecutionMilestone | null>;
  listMilestones(filter?: { initiativeId?: string }): Promise<ExecutionMilestone[]>;

  saveTask(task: ExecutionTask): Promise<ExecutionTask>;
  findTask(id: string): Promise<ExecutionTask | null>;
  listTasks(filter?: {
    goalId?: string;
    initiativeId?: string;
    milestoneId?: string | null;
  }): Promise<ExecutionTask[]>;

  saveOwners(owners: ExecutionOwners): Promise<ExecutionOwners>;
  findOwners(
    subjectKind: ExecutionOwners["subjectKind"],
    subjectId: string
  ): Promise<ExecutionOwners | null>;
  listOwners(): Promise<ExecutionOwners[]>;

  saveDependency(dependency: ExecutionDependency): Promise<ExecutionDependency>;
  listDependencies(filter?: {
    fromId?: string;
    toId?: string;
  }): Promise<ExecutionDependency[]>;
  deleteDependency(id: string): Promise<boolean>;

  saveProgress(snapshot: ExecutionProgressSnapshot): Promise<ExecutionProgressSnapshot>;
  listProgress(filter?: {
    subjectId?: string;
  }): Promise<ExecutionProgressSnapshot[]>;

  saveAdjustment(adjustment: ExecutionAdjustment): Promise<ExecutionAdjustment>;
  listAdjustments(filter?: { subjectId?: string }): Promise<ExecutionAdjustment[]>;

  saveScorecard(scorecard: ExecutionScorecard): Promise<ExecutionScorecard>;
  listScorecards(filter?: { goalId?: string }): Promise<ExecutionScorecard[]>;

  saveImpact(assessment: ExecutionImpactAssessment): Promise<ExecutionImpactAssessment>;
  listImpact(filter?: { goalId?: string }): Promise<ExecutionImpactAssessment[]>;

  saveNotification(notification: ExecutionNotification): Promise<ExecutionNotification>;
  listNotifications(filter?: {
    acknowledged?: boolean;
  }): Promise<ExecutionNotification[]>;
}

function cloneGoal(goal: ExecutionGoal): ExecutionGoal {
  return {
    ...goal,
    linkedOpportunityIds: [...goal.linkedOpportunityIds],
    confidence: {
      ...goal.confidence,
      factors: goal.confidence.factors.map((f) => ({ ...f })),
    },
    metadata: { ...goal.metadata },
  };
}

/**
 * In-memory repository for tests and local development.
 */
export class InMemoryGoalExecutionRepository implements GoalExecutionRepository {
  private readonly goals = new Map<string, ExecutionGoal>();
  private readonly objectives = new Map<string, ExecutionObjective>();
  private readonly initiatives = new Map<string, ExecutionInitiative>();
  private readonly milestones = new Map<string, ExecutionMilestone>();
  private readonly tasks = new Map<string, ExecutionTask>();
  private readonly owners = new Map<string, ExecutionOwners>();
  private readonly dependencies = new Map<string, ExecutionDependency>();
  private readonly progress = new Map<string, ExecutionProgressSnapshot>();
  private readonly adjustments = new Map<string, ExecutionAdjustment>();
  private readonly scorecards = new Map<string, ExecutionScorecard>();
  private readonly impact = new Map<string, ExecutionImpactAssessment>();
  private readonly notifications = new Map<string, ExecutionNotification>();

  private ownersKey(
    subjectKind: ExecutionOwners["subjectKind"],
    subjectId: string
  ): string {
    return `${subjectKind}:${subjectId}`;
  }

  private progressKey(
    subjectKind: ExecutionProgressSnapshot["subjectKind"],
    subjectId: string
  ): string {
    return `${subjectKind}:${subjectId}`;
  }

  async saveGoal(goal: ExecutionGoal): Promise<ExecutionGoal> {
    const frozen = cloneGoal(goal);
    this.goals.set(frozen.id, frozen);
    return frozen;
  }

  async findGoal(id: string): Promise<ExecutionGoal | null> {
    return this.goals.get(id) ?? null;
  }

  async listGoals(filter: {
    organizationId?: string | null;
    includeArchived?: boolean;
  } = {}): Promise<ExecutionGoal[]> {
    let results = Array.from(this.goals.values());
    if (!filter.includeArchived) {
      results = results.filter((g) => !g.archived);
    }
    if (filter.organizationId !== undefined) {
      results = results.filter((g) => g.organizationId === filter.organizationId);
    }
    return results;
  }

  async saveObjective(objective: ExecutionObjective): Promise<ExecutionObjective> {
    const frozen: ExecutionObjective = {
      ...objective,
      metadata: { ...objective.metadata },
    };
    this.objectives.set(frozen.id, frozen);
    return frozen;
  }

  async findObjective(id: string): Promise<ExecutionObjective | null> {
    return this.objectives.get(id) ?? null;
  }

  async listObjectives(filter: { goalId?: string } = {}): Promise<ExecutionObjective[]> {
    let results = Array.from(this.objectives.values());
    if (filter.goalId) {
      results = results.filter((o) => o.goalId === filter.goalId);
    }
    return results;
  }

  async saveInitiative(initiative: ExecutionInitiative): Promise<ExecutionInitiative> {
    const frozen: ExecutionInitiative = {
      ...initiative,
      objectiveIds: [...initiative.objectiveIds],
      resources: [...initiative.resources],
      metadata: { ...initiative.metadata },
    };
    this.initiatives.set(frozen.id, frozen);
    return frozen;
  }

  async findInitiative(id: string): Promise<ExecutionInitiative | null> {
    return this.initiatives.get(id) ?? null;
  }

  async listInitiatives(filter: { goalId?: string } = {}): Promise<ExecutionInitiative[]> {
    let results = Array.from(this.initiatives.values());
    if (filter.goalId) {
      results = results.filter((i) => i.goalId === filter.goalId);
    }
    return results;
  }

  async saveMilestone(milestone: ExecutionMilestone): Promise<ExecutionMilestone> {
    const frozen: ExecutionMilestone = {
      ...milestone,
      metadata: { ...milestone.metadata },
    };
    this.milestones.set(frozen.id, frozen);
    return frozen;
  }

  async findMilestone(id: string): Promise<ExecutionMilestone | null> {
    return this.milestones.get(id) ?? null;
  }

  async listMilestones(filter: { initiativeId?: string } = {}): Promise<ExecutionMilestone[]> {
    let results = Array.from(this.milestones.values());
    if (filter.initiativeId) {
      results = results.filter((m) => m.initiativeId === filter.initiativeId);
    }
    return results;
  }

  async saveTask(task: ExecutionTask): Promise<ExecutionTask> {
    const frozen: ExecutionTask = {
      ...task,
      dependencyIds: [...task.dependencyIds],
      evidence: task.evidence.map((e) => ({ ...e })),
      notes: [...task.notes],
      metadata: { ...task.metadata },
    };
    this.tasks.set(frozen.id, frozen);
    return frozen;
  }

  async findTask(id: string): Promise<ExecutionTask | null> {
    return this.tasks.get(id) ?? null;
  }

  async listTasks(
    filter: {
      goalId?: string;
      initiativeId?: string;
      milestoneId?: string | null;
    } = {}
  ): Promise<ExecutionTask[]> {
    let results = Array.from(this.tasks.values());
    if (filter.goalId) {
      results = results.filter((t) => t.goalId === filter.goalId);
    }
    if (filter.initiativeId) {
      results = results.filter((t) => t.initiativeId === filter.initiativeId);
    }
    if (filter.milestoneId !== undefined) {
      results = results.filter((t) => t.milestoneId === filter.milestoneId);
    }
    return results;
  }

  async saveOwners(owners: ExecutionOwners): Promise<ExecutionOwners> {
    const frozen: ExecutionOwners = {
      ...owners,
      supportingTeam: [...owners.supportingTeam],
      metadata: { ...owners.metadata },
    };
    this.owners.set(this.ownersKey(frozen.subjectKind, frozen.subjectId), frozen);
    return frozen;
  }

  async findOwners(
    subjectKind: ExecutionOwners["subjectKind"],
    subjectId: string
  ): Promise<ExecutionOwners | null> {
    return this.owners.get(this.ownersKey(subjectKind, subjectId)) ?? null;
  }

  async listOwners(): Promise<ExecutionOwners[]> {
    return Array.from(this.owners.values());
  }

  async saveDependency(dependency: ExecutionDependency): Promise<ExecutionDependency> {
    const frozen: ExecutionDependency = {
      ...dependency,
      metadata: { ...dependency.metadata },
    };
    this.dependencies.set(frozen.id, frozen);
    return frozen;
  }

  async listDependencies(
    filter: { fromId?: string; toId?: string } = {}
  ): Promise<ExecutionDependency[]> {
    let results = Array.from(this.dependencies.values());
    if (filter.fromId) {
      results = results.filter((d) => d.fromId === filter.fromId);
    }
    if (filter.toId) {
      results = results.filter((d) => d.toId === filter.toId);
    }
    return results;
  }

  async deleteDependency(id: string): Promise<boolean> {
    return this.dependencies.delete(id);
  }

  async saveProgress(
    snapshot: ExecutionProgressSnapshot
  ): Promise<ExecutionProgressSnapshot> {
    const frozen: ExecutionProgressSnapshot = {
      ...snapshot,
      notes: [...snapshot.notes],
      metadata: { ...snapshot.metadata },
    };
    this.progress.set(this.progressKey(frozen.subjectKind, frozen.subjectId), frozen);
    return frozen;
  }

  async listProgress(
    filter: { subjectId?: string } = {}
  ): Promise<ExecutionProgressSnapshot[]> {
    let results = Array.from(this.progress.values());
    if (filter.subjectId) {
      results = results.filter((p) => p.subjectId === filter.subjectId);
    }
    return results;
  }

  async saveAdjustment(adjustment: ExecutionAdjustment): Promise<ExecutionAdjustment> {
    const frozen: ExecutionAdjustment = {
      ...adjustment,
      recommendedActions: [...adjustment.recommendedActions],
      confidence: {
        ...adjustment.confidence,
        factors: adjustment.confidence.factors.map((f) => ({ ...f })),
      },
      metadata: { ...adjustment.metadata },
    };
    this.adjustments.set(frozen.id, frozen);
    return frozen;
  }

  async listAdjustments(
    filter: { subjectId?: string } = {}
  ): Promise<ExecutionAdjustment[]> {
    let results = Array.from(this.adjustments.values());
    if (filter.subjectId) {
      results = results.filter((a) => a.subjectId === filter.subjectId);
    }
    return results;
  }

  async saveScorecard(scorecard: ExecutionScorecard): Promise<ExecutionScorecard> {
    const frozen: ExecutionScorecard = {
      ...scorecard,
      confidence: {
        ...scorecard.confidence,
        factors: scorecard.confidence.factors.map((f) => ({ ...f })),
      },
      metadata: { ...scorecard.metadata },
    };
    this.scorecards.set(frozen.scorecardId, frozen);
    return frozen;
  }

  async listScorecards(filter: { goalId?: string } = {}): Promise<ExecutionScorecard[]> {
    let results = Array.from(this.scorecards.values());
    if (filter.goalId) {
      results = results.filter((s) => s.goalId === filter.goalId);
    }
    return results;
  }

  async saveImpact(
    assessment: ExecutionImpactAssessment
  ): Promise<ExecutionImpactAssessment> {
    const frozen: ExecutionImpactAssessment = {
      ...assessment,
      scores: assessment.scores.map((s) => ({ ...s })),
      metadata: { ...assessment.metadata },
    };
    this.impact.set(`${assessment.goalId}:${assessment.assessedAt}`, frozen);
    return frozen;
  }

  async listImpact(
    filter: { goalId?: string } = {}
  ): Promise<ExecutionImpactAssessment[]> {
    let results = Array.from(this.impact.values());
    if (filter.goalId) {
      results = results.filter((i) => i.goalId === filter.goalId);
    }
    return results;
  }

  async saveNotification(
    notification: ExecutionNotification
  ): Promise<ExecutionNotification> {
    const frozen: ExecutionNotification = {
      ...notification,
      metadata: { ...notification.metadata },
    };
    this.notifications.set(frozen.id, frozen);
    return frozen;
  }

  async listNotifications(
    filter: { acknowledged?: boolean } = {}
  ): Promise<ExecutionNotification[]> {
    let results = Array.from(this.notifications.values());
    if (filter.acknowledged !== undefined) {
      results = results.filter((n) => n.acknowledged === filter.acknowledged);
    }
    return results;
  }

  clear(): void {
    this.goals.clear();
    this.objectives.clear();
    this.initiatives.clear();
    this.milestones.clear();
    this.tasks.clear();
    this.owners.clear();
    this.dependencies.clear();
    this.progress.clear();
    this.adjustments.clear();
    this.scorecards.clear();
    this.impact.clear();
    this.notifications.clear();
  }
}

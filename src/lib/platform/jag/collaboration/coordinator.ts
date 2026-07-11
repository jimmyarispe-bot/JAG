/**
 * JAG Collaboration — coordinator.
 *
 * Receives one executive request, selects agents, launches in parallel,
 * collects responses, and runs the collaboration pipeline.
 */

import { JagCollaborationConfidenceCalculator } from "@/lib/platform/jag/collaboration/confidence";
import { JagCollaborationConflicts } from "@/lib/platform/jag/collaboration/conflicts";
import { JagCollaborationConsensus } from "@/lib/platform/jag/collaboration/consensus";
import { JagCollaborationDebate } from "@/lib/platform/jag/collaboration/debate";
import { createDefaultCollaborationAgents } from "@/lib/platform/jag/collaboration/default-agents";
import { JagCollaborationExecution } from "@/lib/platform/jag/collaboration/execution";
import { JagCollaborationLearning } from "@/lib/platform/jag/collaboration/learning";
import { JagCollaborationModerator } from "@/lib/platform/jag/collaboration/moderator";
import { JagCollaborationPlanner } from "@/lib/platform/jag/collaboration/planner";
import { JagCollaborationPriorities } from "@/lib/platform/jag/collaboration/priorities";
import { JagCollaborationTelemetryCollector } from "@/lib/platform/jag/collaboration/telemetry";
import { JagCollaborationVoting } from "@/lib/platform/jag/collaboration/voting";
import type {
  JagCollaboratingAgent,
  JagCollaborationAgentRole,
  JagCollaborationRequest,
  JagCollaborationResult,
} from "@/lib/platform/jag/collaboration/types";
import { JAG_COLLABORATION_ENGINE_VERSION } from "@/lib/platform/jag/collaboration/types";
import type { PersistentIntelligenceMemory } from "@/lib/platform/intelligence/memory/index";

/** Injected collaborators for the coordinator. */
export interface JagCollaborationCoordinatorDependencies {
  agents?: readonly JagCollaboratingAgent[];
  moderator?: JagCollaborationModerator;
  consensus?: JagCollaborationConsensus;
  confidence?: JagCollaborationConfidenceCalculator;
  voting?: JagCollaborationVoting;
  conflicts?: JagCollaborationConflicts;
  debate?: JagCollaborationDebate;
  priorities?: JagCollaborationPriorities;
  planner?: JagCollaborationPlanner;
  execution?: JagCollaborationExecution;
  learning?: JagCollaborationLearning;
  telemetry?: JagCollaborationTelemetryCollector;
  memory?: PersistentIntelligenceMemory;
  now?: () => Date;
}

/**
 * Multi-agent collaboration coordinator.
 */
export class JagCollaborationCoordinator {
  private readonly agents: readonly JagCollaboratingAgent[];
  private readonly moderator: JagCollaborationModerator;
  private readonly consensus: JagCollaborationConsensus;
  private readonly confidence: JagCollaborationConfidenceCalculator;
  private readonly voting: JagCollaborationVoting;
  private readonly conflicts: JagCollaborationConflicts;
  private readonly debate: JagCollaborationDebate;
  private readonly priorities: JagCollaborationPriorities;
  private readonly planner: JagCollaborationPlanner;
  private readonly execution: JagCollaborationExecution;
  private readonly learning: JagCollaborationLearning;
  private readonly telemetry: JagCollaborationTelemetryCollector;
  private readonly now: () => Date;

  constructor(dependencies: JagCollaborationCoordinatorDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    this.now = now;
    this.agents =
      dependencies.agents ??
      createDefaultCollaborationAgents({ now });
    this.moderator = dependencies.moderator ?? new JagCollaborationModerator();
    this.consensus =
      dependencies.consensus ??
      new JagCollaborationConsensus({ agents: this.agents });
    this.confidence =
      dependencies.confidence ?? new JagCollaborationConfidenceCalculator();
    this.voting = dependencies.voting ?? new JagCollaborationVoting();
    this.conflicts = dependencies.conflicts ?? new JagCollaborationConflicts();
    this.debate = dependencies.debate ?? new JagCollaborationDebate();
    this.priorities = dependencies.priorities ?? new JagCollaborationPriorities();
    this.planner = dependencies.planner ?? new JagCollaborationPlanner();
    this.execution =
      dependencies.execution ?? new JagCollaborationExecution({ now });
    this.learning =
      dependencies.learning ??
      new JagCollaborationLearning({ memory: dependencies.memory });
    this.telemetry =
      dependencies.telemetry ??
      new JagCollaborationTelemetryCollector({ now });
  }

  /**
   * Determine which agents participate for a request.
   */
  selectAgents(request: JagCollaborationRequest): JagCollaboratingAgent[] {
    if (request.preferredAgents && request.preferredAgents.length > 0) {
      const preferred = new Set(request.preferredAgents);
      const selected = this.agents.filter((agent) => preferred.has(agent.role));
      return selected.length > 0 ? [...selected] : [...this.agents];
    }
    return [...this.agents];
  }

  /**
   * Run the full multi-agent collaboration workflow.
   */
  async collaborate(request: JagCollaborationRequest): Promise<JagCollaborationResult> {
    const started = this.now();
    const startedAt = started.toISOString();
    const startedMs = started.getTime();

    const participants = this.selectAgents(request);
    const responses = await Promise.all(
      participants.map(async (agent) => Promise.resolve(agent.participate(request)))
    );

    const moderated = this.moderator.moderate(responses);
    // Voting is available for diagnostics / DI consumers.
    void this.voting.tally(moderated, participants);

    const consensus = this.consensus.decide(request, moderated);
    const confidence = this.confidence.calculate(request, moderated, consensus);
    const conflicts = this.conflicts.analyze(moderated);
    const debate = this.debate.debate(moderated);
    const priorities = this.priorities.rank(moderated, consensus);
    const plan = this.planner.plan(request, moderated, consensus, priorities);
    const execution = this.execution.build(request, moderated, consensus, plan);
    const learning = await this.learning.persist(
      request,
      moderated,
      consensus,
      confidence
    );
    const telemetry = this.telemetry.collect({
      request,
      moderated,
      consensus,
      confidence,
      startedAt,
      startedMs,
    });

    return {
      requestId: request.requestId,
      moderated,
      consensus,
      confidence,
      conflicts,
      debate,
      priorities,
      plan,
      execution,
      learning,
      telemetry,
      domainVersion: JAG_COLLABORATION_ENGINE_VERSION,
      completedAt: this.now().toISOString(),
      metadata: request.metadata,
    };
  }

  /** Expose configured agent roles (tests / diagnostics). */
  listAgentRoles(): readonly JagCollaborationAgentRole[] {
    return this.agents.map((agent) => agent.role);
  }
}

/**
 * Sprint 013 — Multi-Agent Collaboration Engine unit tests.
 */

import { describe, expect, it, vi } from "vitest";
import {
  createGoalExecutionEngine,
} from "@/lib/platform/execution";
import {
  createJagCollaborationEngine,
  createDefaultCollaborationAgents,
  JagCollaborationModerator,
  JagCollaborationConsensus,
  JagCollaborationConfidenceCalculator,
  JagCollaborationConflicts,
  JagCollaborationDebate,
  JagCollaborationPriorities,
  JagCollaborationPlanner,
  JagCollaborationExecution,
  JagCollaborationVoting,
  JAG_COLLABORATION_ENGINE_VERSION,
  type JagCollaboratingAgent,
  type JagCollaborationRequest,
  type JagAgentResponse,
} from "@/lib/platform/jag/collaboration";
import {
  createPersistentIntelligenceMemory,
  createEmptyExecutiveContextSection,
  createEmptyFinanceContextSection,
  createEmptyStudentContextSection,
  createEmptyOrganizationContextSection,
} from "@/lib/platform/intelligence";

function makeRequest(
  overrides: Partial<JagCollaborationRequest> = {}
): JagCollaborationRequest {
  const scopeRequest = {
    organizationId: "org-1",
    schoolId: "school-1",
  };
  return {
    requestId: "collab-1",
    subject: "Cash recovery and enrollment strategy",
    description: "Critical cash risk with strategic enrollment opportunity",
    organizationId: "org-1",
    schoolId: "school-1",
    sharedContext: {
      requestId: "shared-collab-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      executive: createEmptyExecutiveContextSection(scopeRequest),
      finance: createEmptyFinanceContextSection(scopeRequest),
      student: createEmptyStudentContextSection(scopeRequest),
      organization: createEmptyOrganizationContextSection(scopeRequest),
      errors: [],
      builtAt: "2026-07-11T12:00:00.000Z",
    },
    evidenceRefs: [{ evidenceId: "ev-1", label: "Cash report", weight: 0.8 }],
    ...overrides,
  };
}

function mockAgent(
  role: JagCollaboratingAgent["role"],
  key: string,
  title: string,
  weight = 1,
  extras: Partial<JagAgentResponse["recommendations"][number]> = {}
): JagCollaboratingAgent {
  return {
    role,
    name: `${role} mock`,
    weight,
    participate(request) {
      const recommendation = {
        recommendationKey: key,
        title,
        summary: `${title} for ${request.subject}`,
        actions: [`Do ${title}`],
        risk: 0.4,
        urgency: 0.6,
        impact: 0.7,
        cost: 0.5,
        missionAlignment: 0.7,
        confidence: { value: 0.7, level: "medium" as const, factors: [] },
        evidenceRefs: [],
        ...extras,
      };
      const response: JagAgentResponse = {
        responseId: `${role}-resp`,
        agentRole: role,
        agentName: `${role} mock`,
        summary: title,
        recommendations: [recommendation],
        concerns: [],
        confidence: recommendation.confidence,
        elapsedMs: 1,
      };
      return response;
    },
  };
}

describe("JagCollaborationCoordinator", () => {
  it("selects agents, runs parallel collaboration, and returns full result", async () => {
    const memory = createPersistentIntelligenceMemory({
      createId: () => "mem-collab-1",
      now: () => new Date("2026-07-11T15:00:00.000Z"),
    });
    const engine = createJagCollaborationEngine({
      memory,
      now: () => new Date("2026-07-11T15:00:00.000Z"),
    });

    const result = await engine.collaborate(makeRequest());

    expect(result.domainVersion).toBe(JAG_COLLABORATION_ENGINE_VERSION);
    expect(result.moderated.responses.length).toBeGreaterThanOrEqual(3);
    expect(result.consensus.recommendationKey.length).toBeGreaterThan(0);
    expect(result.confidence.score.value).toBeGreaterThan(0);
    expect(result.confidence.uncertainty).toBeGreaterThanOrEqual(0);
    expect(result.plan.steps.length).toBeGreaterThan(0);
    expect(result.execution.goal.title).toContain("Execute:");
    expect(result.learning.memoryId).toBe("mem-collab-1");
    expect(result.telemetry.participatingAgents.length).toBeGreaterThan(0);
    expect(result.telemetry.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("respects preferredAgents selection", async () => {
    const engine = createJagCollaborationEngine({
      agents: [
        mockAgent("executive", "a", "A", 1.5),
        mockAgent("strategic", "b", "B", 1.2),
        mockAgent("decision", "c", "C", 1.1),
      ],
    });

    const result = await engine.collaborate(
      makeRequest({ preferredAgents: ["executive", "decision"] })
    );
    expect(result.moderated.responses.map((r) => r.agentRole).sort()).toEqual([
      "decision",
      "executive",
    ]);
  });
});

describe("moderator / consensus / voting", () => {
  it("merges similar recommendations and preserves disagreements", () => {
    const moderator = new JagCollaborationModerator();
    const agents = [
      mockAgent("executive", "stabilize-cash", "Stabilize cash runway"),
      mockAgent("strategic", "stabilize-cash-runway", "Stabilize cash runway urgently"),
      mockAgent("operations", "hire-surge", "Hire surge capacity", 1, {
        risk: 0.2,
        cost: 0.8,
      }),
    ];
    const responses = agents.map((a) =>
      a.participate(makeRequest()) as JagAgentResponse
    );
    const moderated = moderator.moderate(responses);

    expect(moderated.mergedRecommendations.length).toBeGreaterThanOrEqual(1);
    expect(moderated.duplicatesRemoved).toBeGreaterThanOrEqual(0);

    const consensus = new JagCollaborationConsensus({ agents }).decide(
      makeRequest({ consensusMode: "majority" }),
      moderated
    );
    expect(consensus.mode).toBe("majority");
    expect(consensus.supportCount).toBeGreaterThan(0);

    const votes = new JagCollaborationVoting().tally(moderated, agents);
    expect(votes.length).toBe(moderated.mergedRecommendations.length);
  });

  it("supports executive override consensus", () => {
    const agents = [
      mockAgent("executive", "option-a", "Option A"),
      mockAgent("strategic", "option-b", "Option B"),
    ];
    const moderated = new JagCollaborationModerator().moderate(
      agents.map((a) => a.participate(makeRequest()) as JagAgentResponse)
    );
    const consensus = new JagCollaborationConsensus({ agents }).decide(
      makeRequest({
        consensusMode: "weighted",
        executiveOverride: {
          recommendationKey: "option-b",
          rationale: "Board directed option B",
        },
      }),
      moderated
    );
    expect(consensus.mode).toBe("executive_override");
    expect(consensus.overridden).toBe(true);
    expect(consensus.recommendationKey).toBe("option-b");
  });
});

describe("confidence / conflicts / debate / priorities", () => {
  it("calculates confidence, conflicts, debate, and priority ranking", () => {
    const agents = createDefaultCollaborationAgents();
    // Use deterministic mocks for conflict/debate clarity
    const mockAgents = [
      mockAgent("executive", "invest-now", "Invest now", 1.4, {
        risk: 0.8,
        cost: 0.7,
      }),
      mockAgent("operations", "defer-monitor", "Defer and monitor", 1.0, {
        risk: 0.2,
        cost: 0.2,
      }),
    ];
    const moderated = new JagCollaborationModerator().moderate(
      mockAgents.map((a) => a.participate(makeRequest()) as JagAgentResponse)
    );
    const consensus = new JagCollaborationConsensus({ agents: mockAgents }).decide(
      makeRequest({ consensusMode: "weighted" }),
      moderated
    );
    const confidence = new JagCollaborationConfidenceCalculator().calculate(
      makeRequest(),
      moderated,
      consensus
    );
    expect(confidence.agreement).toBeGreaterThanOrEqual(0);
    expect(confidence.sharedContextCompleteness).toBeGreaterThan(0.4);

    const conflicts = new JagCollaborationConflicts().analyze(moderated);
    expect(conflicts.allowsMultipleStrategies).toBe(true);

    const debate = new JagCollaborationDebate().debate(moderated);
    expect(debate.challenges.length).toBeGreaterThan(0);

    const priorities = new JagCollaborationPriorities().rank(moderated, consensus);
    expect(priorities.ranked[0]?.rank).toBe(1);
    expect(priorities.ranked[0]?.dimensions.impact).toBeGreaterThan(0);

    void agents;
  });
});

describe("planner / execution / learning / goal-engine compatibility", () => {
  it("builds a plan and execution package importable by Goal Execution Engine", async () => {
    const agents = [
      mockAgent("executive", "cash-plan", "Cash recovery plan", 1.5),
      mockAgent("strategic", "cash-plan", "Cash recovery plan", 1.2),
    ];
    const request = makeRequest();
    const moderated = new JagCollaborationModerator().moderate(
      agents.map((a) => a.participate(request) as JagAgentResponse)
    );
    const consensus = new JagCollaborationConsensus({ agents }).decide(
      request,
      moderated
    );
    const priorities = new JagCollaborationPriorities().rank(moderated, consensus);
    const plan = new JagCollaborationPlanner().plan(
      request,
      moderated,
      consensus,
      priorities
    );
    expect(plan.steps[0]?.order).toBe(1);

    const execution = new JagCollaborationExecution({
      now: () => new Date("2026-07-11T16:00:00.000Z"),
    }).build(request, moderated, consensus, plan);

    const goalEngine = createGoalExecutionEngine({
      now: () => new Date("2026-07-11T16:00:00.000Z"),
    });
    const goal = await goalEngine.goals.create(execution.goal);
    expect(goal.id).toBe(execution.goal.id);

    for (const objective of execution.objectives) {
      await goalEngine.objectives.create({ ...objective, goalId: goal.id });
    }
    for (const initiative of execution.initiatives) {
      await goalEngine.initiatives.create({ ...initiative, goalId: goal.id });
    }
    const initiative = execution.initiatives[0]!;
    for (const task of execution.tasks) {
      await goalEngine.tasks.create({
        ...task,
        goalId: goal.id,
        initiativeId: initiative.id!,
      });
    }
    const tasks = await goalEngine.tasks.list({ goalId: goal.id });
    expect(tasks.length).toBe(execution.tasks.length);
  });

  it("persists learning via injected Persistent Memory", async () => {
    const memory = createPersistentIntelligenceMemory({
      createId: () => "mem-learn-1",
    });
    const saveSpy = vi.spyOn(memory, "saveMemory");
    const engine = createJagCollaborationEngine({
      agents: [mockAgent("executive", "opt", "Option")],
      memory,
    });
    const result = await engine.collaborate(makeRequest());
    expect(result.learning.trackedForAccuracy).toBe(true);
    expect(saveSpy).toHaveBeenCalled();
  });
});

describe("dependency injection", () => {
  it("uses injected agents without calling default intelligence domains", async () => {
    const participate = vi.fn(() => ({
      responseId: "custom",
      agentRole: "research" as const,
      agentName: "Custom",
      summary: "Custom summary",
      recommendations: [
        {
          recommendationKey: "custom-rec",
          title: "Custom recommendation",
          summary: "Custom",
          actions: ["Act"],
          risk: 0.3,
          urgency: 0.4,
          impact: 0.5,
          cost: 0.2,
          missionAlignment: 0.6,
          confidence: { value: 0.66, level: "medium" as const, factors: [] },
          evidenceRefs: [],
        },
      ],
      concerns: [],
      confidence: { value: 0.66, level: "medium" as const, factors: [] },
      elapsedMs: 2,
    }));

    const customAgent: JagCollaboratingAgent = {
      role: "research",
      name: "Custom",
      weight: 1,
      participate,
    };

    const engine = createJagCollaborationEngine({ agents: [customAgent] });
    const result = await engine.collaborate(makeRequest());
    expect(participate).toHaveBeenCalledTimes(1);
    expect(result.consensus.recommendationKey).toBe("custom-rec");
    expect(result.moderated.responses).toHaveLength(1);
  });
});

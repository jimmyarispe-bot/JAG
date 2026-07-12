/**
 * Human Capital Intelligence — Learning Intelligence (Sprint 032).
 */

import type {
  CareerPathing as CareerPathingContract,
  CertificationTracking as CertificationTrackingContract,
  DevelopmentRecommendations as DevelopmentRecommendationsContract,
  KnowledgeTransfer as KnowledgeTransferContract,
  LearningPlans as LearningPlansContract,
  MentorshipMatching as MentorshipMatchingContract,
  TrainingRecommendations as TrainingRecommendationsContract,
} from "@/lib/platform/intelligence/human-capital/contracts";
import {
  clamp,
  priorityFromScore,
} from "@/lib/platform/intelligence/human-capital/models";
import type {
  CareerPathRecord,
  CertificationRecord,
  CompetencyRecord,
  DevelopmentRecommendation,
  EmployeeProfileRecord,
  KnowledgeTransferRecord,
  LeadershipAssessmentRecord,
  LearningPlanRecord,
  MentorshipMatch,
  PerformanceRecord,
  SkillInventoryItem,
  SuccessionPlanSlot,
  TrainingRecommendation,
} from "@/lib/platform/intelligence/human-capital/types";

export class LearningPlans implements LearningPlansContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  build(input: {
    employees: EmployeeProfileRecord[];
    skills: SkillInventoryItem[];
    competencies: CompetencyRecord[];
    now: Date;
  }): LearningPlanRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const topGaps = [...input.skills]
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3)
      .map((s) => s.skill);

    return input.employees.slice(0, 10).map((e, i) => ({
      id: createId("learn"),
      employeeId: e.id,
      title: `Development plan — ${e.role}`,
      skills: topGaps.length ? topGaps : e.skills,
      progressPct: clamp(20 + (i * 7) % 60),
      dueAt: new Date(input.now.getTime() + 90 * 86400000).toISOString(),
      priority: priorityFromScore(e.engagementScore),
      narrative: `Learning plan for ${e.name} targeting skill gaps.`,
    }));
  }
}

export class CareerPathing implements CareerPathingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  path(input: {
    employees: EmployeeProfileRecord[];
    assessments: LeadershipAssessmentRecord[];
    now: Date;
  }): CareerPathRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const assessed = new Set(input.assessments.map((a) => a.employeeId));

    return input.employees
      .filter((e) => assessed.has(e.id) || e.potentialScore >= 70)
      .slice(0, 8)
      .map((e) => {
        const targetRole =
          e.role.includes("Director")
            ? "Executive"
            : e.role.includes("Manager")
              ? "Director"
              : "Manager";
        return {
          id: createId("path"),
          employeeId: e.id,
          currentRole: e.role,
          targetRole,
          steps: [
            "Complete stretch assignment",
            "Close competency gaps",
            "Shadow target role",
          ],
          readinessMonths: e.potentialScore >= 80 ? 12 : 24,
          narrative: `${e.name}: ${e.role} → ${targetRole}.`,
        };
      });
  }
}

export class CertificationTracking implements CertificationTrackingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  track(input: {
    employees: EmployeeProfileRecord[];
    now: Date;
  }): CertificationRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.employees.slice(0, 8).map((e, i) => {
      const expiring = i % 4 === 0;
      return {
        id: createId("cert"),
        employeeId: e.id,
        name: i % 2 === 0 ? "Role Credential" : "Compliance Certificate",
        status: expiring
          ? ("expiring" as const)
          : i % 5 === 0
            ? ("pursuing" as const)
            : ("current" as const),
        expiresAt: expiring
          ? new Date(input.now.getTime() + 30 * 86400000).toISOString()
          : new Date(input.now.getTime() + 365 * 86400000).toISOString(),
        required: i % 2 === 0,
        narrative: `${e.name} certification status tracked.`,
      };
    });
  }
}

export class MentorshipMatching implements MentorshipMatchingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  match(input: {
    employees: EmployeeProfileRecord[];
    assessments: LeadershipAssessmentRecord[];
    now: Date;
  }): MentorshipMatch[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const mentors = input.assessments
      .filter((a) => a.score >= 70)
      .map((a) => a.employeeId);
    const mentees = input.employees
      .filter((e) => e.potentialScore >= 65 && !mentors.includes(e.id))
      .slice(0, 5);

    return mentees.map((m, i) => ({
      id: createId("mentor"),
      menteeId: m.id,
      mentorId: mentors[i % Math.max(1, mentors.length)] ?? m.id,
      focus: "Leadership acceleration",
      fitScore: clamp(70 + (i % 20)),
      narrative: `Mentor match for ${m.name}.`,
    }));
  }
}

export class DevelopmentRecommendations
  implements DevelopmentRecommendationsContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    employees: EmployeeProfileRecord[];
    skills: SkillInventoryItem[];
    performance: PerformanceRecord[];
    now: Date;
  }): DevelopmentRecommendation[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const topSkill = [...input.skills].sort((a, b) => b.gap - a.gap)[0];

    return input.employees.slice(0, 8).map((e) => {
      const perf = input.performance.find((p) => p.employeeId === e.id);
      return {
        id: createId("dev"),
        employeeId: e.id,
        focus: perf && perf.score < 70 ? "Performance uplift" : "Capability stretch",
        actions: [
          `Build ${topSkill?.skill ?? "core skill"}`,
          "Complete learning plan milestone",
          "Seek stretch project",
        ],
        priority: priorityFromScore(perf?.score ?? e.engagementScore),
        relatedSkills: topSkill ? [topSkill.skill] : e.skills,
        narrative: `Development focus for ${e.name}.`,
      };
    });
  }
}

export class TrainingRecommendations implements TrainingRecommendationsContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    employees: EmployeeProfileRecord[];
    skills: SkillInventoryItem[];
    competencies: CompetencyRecord[];
    development: DevelopmentRecommendation[];
    now: Date;
  }): TrainingRecommendation[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const topGaps = [...input.skills]
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3);
    const competencyGap = [...input.competencies]
      .sort((a, b) => b.gap - a.gap)[0];

    return input.development.slice(0, 8).map((d, i) => {
      const emp = input.employees.find((e) => e.id === d.employeeId);
      const skill = topGaps[i % Math.max(1, topGaps.length)]?.skill ?? d.relatedSkills[0] ?? "core skill";
      return {
        id: createId("train"),
        employeeId: d.employeeId,
        title: `${skill} accelerator`,
        skills: [skill, ...(competencyGap ? [competencyGap.name] : [])].slice(0, 3),
        priority: d.priority,
        estimatedHours: 8 + (i % 4) * 4,
        rationale: d.focus,
        narrative: `Training for ${emp?.name ?? d.employeeId}: ${skill}.`,
      };
    });
  }
}

export class KnowledgeTransfer implements KnowledgeTransferContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  plan(input: {
    employees: EmployeeProfileRecord[];
    skills: SkillInventoryItem[];
    succession: SuccessionPlanSlot[];
    now: Date;
  }): KnowledgeTransferRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const criticalSkill = [...input.skills].sort((a, b) => b.gap - a.gap)[0];
    const pairs: KnowledgeTransferRecord[] = [];

    for (const slot of input.succession.slice(0, 4)) {
      const fromId = slot.incumbentId;
      const toId = slot.successors[0]?.employeeId;
      if (!fromId || !toId || fromId === toId) continue;
      pairs.push({
        id: createId("kt"),
        fromEmployeeId: fromId,
        toEmployeeId: toId,
        topic: `${slot.criticalRole} institutional knowledge`,
        urgency: slot.risk,
        method: "shadowing + documented playbook",
        narrative: `Transfer ${slot.criticalRole} knowledge before coverage gap widens.`,
      });
    }

    if (pairs.length === 0 && input.employees.length >= 2) {
      pairs.push({
        id: createId("kt"),
        fromEmployeeId: input.employees[0]!.id,
        toEmployeeId: input.employees[1]!.id,
        topic: criticalSkill?.skill ?? "critical process knowledge",
        urgency: "medium",
        method: "paired knowledge sessions",
        narrative: "Baseline knowledge transfer for critical capability coverage.",
      });
    }

    return pairs;
  }
}

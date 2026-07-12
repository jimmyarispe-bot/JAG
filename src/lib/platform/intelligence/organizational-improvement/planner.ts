/** Improvement planning suite (Sprint 036). */
import type * as C from "@/lib/platform/intelligence/organizational-improvement/contracts";
import type * as T from "@/lib/platform/intelligence/organizational-improvement/types";

function toItem(
  record: T.ImprovementRecord,
  horizon: T.ImprovementHorizon,
  sequence: number,
  ownerHint: string
): T.ImprovementPlanItem {
  return {
    improvementId: record.id,
    title: record.title,
    theme: record.theme,
    horizon,
    sequence,
    ownerHint,
    score: record.score,
    expectedValue: record.estimatedFinancialImpact,
    timelineDays: record.expectedTimelineDays,
    narrative: record.narrative,
  };
}

function planResult(
  horizon: T.ImprovementPlanResult["horizon"],
  items: T.ImprovementPlanItem[],
  narrative: string
): T.ImprovementPlanResult {
  return {
    horizon,
    items,
    totalValue: items.reduce((sum, item) => sum + item.expectedValue, 0),
    narrative,
  };
}

export class QuickWinsPlanner implements C.QuickWinsPlanner {
  plan({ records }: Parameters<C.QuickWinsPlanner["plan"]>[0]): T.ImprovementPlanResult {
    const selected = [...records]
      .filter((r) => r.expectedTimelineDays <= 90)
      .sort((a, b) => a.expectedTimelineDays - b.expectedTimelineDays || b.score - a.score)
      .slice(0, 10);
    const fallback =
      selected.length > 0
        ? selected
        : [...records].sort((a, b) => a.expectedTimelineDays - b.expectedTimelineDays).slice(0, 5);
    const items = fallback.map((r, i) => toItem(r, "weekly", i + 1, "Operating lead"));
    return planResult("quick_wins", items, `${items.length} quick wins sequenced within 90 days.`);
  }
}

export class StrategicInitiativesPlanner implements C.StrategicInitiativesPlanner {
  plan({ records }: Parameters<C.StrategicInitiativesPlanner["plan"]>[0]): T.ImprovementPlanResult {
    const selected = [...records]
      .filter((r) => r.expectedTimelineDays > 90 && r.expectedTimelineDays <= 365)
      .sort((a, b) => b.estimatedFinancialImpact - a.estimatedFinancialImpact || b.score - a.score)
      .slice(0, 10);
    const fallback =
      selected.length > 0
        ? selected
        : [...records].sort((a, b) => b.score - a.score).slice(0, 5);
    const items = fallback.map((r, i) => toItem(r, "quarterly", i + 1, "Initiative owner"));
    return planResult("strategic", items, `${items.length} strategic initiatives shape medium-term value.`);
  }
}

export class LongTermTransformationPlanner implements C.LongTermTransformationPlanner {
  plan({ records }: Parameters<C.LongTermTransformationPlanner["plan"]>[0]): T.ImprovementPlanResult {
    const selected = [...records]
      .filter((r) => r.expectedTimelineDays > 180 || r.theme === "strategic")
      .sort((a, b) => b.estimatedMissionImpact - a.estimatedMissionImpact || b.score - a.score)
      .slice(0, 8);
    const fallback =
      selected.length > 0
        ? selected
        : [...records].sort((a, b) => b.estimatedFinancialImpact - a.estimatedFinancialImpact).slice(0, 4);
    const items = fallback.map((r, i) => toItem(r, "annual", i + 1, "Transformation sponsor"));
    return planResult("transformation", items, `${items.length} long-term transformation moves are staged.`);
  }
}

export class WeeklyPlanComposer implements C.WeeklyPlanComposer {
  plan({ records }: Parameters<C.WeeklyPlanComposer["plan"]>[0]): T.ImprovementPlanResult {
    const selected = [...records].sort((a, b) => b.score - a.score).slice(0, 5);
    const items = selected.map((r, i) => toItem(r, "weekly", i + 1, "Weekly owner"));
    return planResult("weekly", items, `Top ${items.length} improvements for this week's focus.`);
  }
}

export class MonthlyPlanComposer implements C.MonthlyPlanComposer {
  plan({ records }: Parameters<C.MonthlyPlanComposer["plan"]>[0]): T.ImprovementPlanResult {
    const selected = [...records]
      .filter((r) => r.expectedTimelineDays <= 120)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    const fallback = selected.length ? selected : [...records].sort((a, b) => b.score - a.score).slice(0, 8);
    const items = fallback.map((r, i) => toItem(r, "monthly", i + 1, "Monthly owner"));
    return planResult("monthly", items, `${items.length} improvements compose the monthly plan.`);
  }
}

export class QuarterlyPlanComposer implements C.QuarterlyPlanComposer {
  plan({ records }: Parameters<C.QuarterlyPlanComposer["plan"]>[0]): T.ImprovementPlanResult {
    const selected = [...records].sort((a, b) => b.score - a.score).slice(0, 12);
    const items = selected.map((r, i) => toItem(r, "quarterly", i + 1, "Quarterly owner"));
    return planResult("quarterly", items, `${items.length} improvements compose the quarterly roadmap.`);
  }
}

export class AnnualRoadmapComposer implements C.AnnualRoadmapComposer {
  plan({ records }: Parameters<C.AnnualRoadmapComposer["plan"]>[0]): T.ImprovementPlanResult {
    const selected = [...records]
      .sort((a, b) => b.estimatedFinancialImpact + b.estimatedMissionImpact * 1000 - (a.estimatedFinancialImpact + a.estimatedMissionImpact * 1000))
      .slice(0, 16);
    const items = selected.map((r, i) => toItem(r, "annual", i + 1, "Annual sponsor"));
    return planResult("annual", items, `${items.length} improvements compose the annual roadmap.`);
  }
}

export class ImprovementPlanner implements C.ImprovementPlanner {
  private readonly quickWins: C.QuickWinsPlanner;
  private readonly strategic: C.StrategicInitiativesPlanner;
  private readonly transformation: C.LongTermTransformationPlanner;
  private readonly weekly: C.WeeklyPlanComposer;
  private readonly monthly: C.MonthlyPlanComposer;
  private readonly quarterly: C.QuarterlyPlanComposer;
  private readonly annual: C.AnnualRoadmapComposer;

  constructor(d: C.ImprovementDependencies = {}) {
    this.quickWins = d.quickWinsPlanner ?? new QuickWinsPlanner();
    this.strategic = d.strategicInitiatives ?? new StrategicInitiativesPlanner();
    this.transformation = d.longTermTransformation ?? new LongTermTransformationPlanner();
    this.weekly = d.weeklyPlan ?? new WeeklyPlanComposer();
    this.monthly = d.monthlyPlan ?? new MonthlyPlanComposer();
    this.quarterly = d.quarterlyPlan ?? new QuarterlyPlanComposer();
    this.annual = d.annualRoadmap ?? new AnnualRoadmapComposer();
  }

  planAll({ records }: Parameters<C.ImprovementPlanner["planAll"]>[0]): T.ImprovementPlanningSuite {
    return {
      quickWins: this.quickWins.plan({ records }),
      strategicInitiatives: this.strategic.plan({ records }),
      longTermTransformation: this.transformation.plan({ records }),
      weekly: this.weekly.plan({ records }),
      monthly: this.monthly.plan({ records }),
      quarterly: this.quarterly.plan({ records }),
      annual: this.annual.plan({ records }),
    };
  }
}

export {
  QuickWinsPlanner as QuickWinsPlannerImpl,
  StrategicInitiativesPlanner as StrategicInitiativesPlannerImpl,
  LongTermTransformationPlanner as LongTermTransformationPlannerImpl,
  WeeklyPlanComposer as WeeklyPlanComposerImpl,
  MonthlyPlanComposer as MonthlyPlanComposerImpl,
  QuarterlyPlanComposer as QuarterlyPlanComposerImpl,
  AnnualRoadmapComposer as AnnualRoadmapComposerImpl,
  ImprovementPlanner as ImprovementPlannerImpl,
};

/** Opportunity Exchange — common publish contract for all OIOS domains (Sprint 035). */
import type * as C from "@/lib/platform/intelligence/opportunity/contracts";
import { clamp, priorityFromScore } from "@/lib/platform/intelligence/opportunity/models";
import type * as T from "@/lib/platform/intelligence/opportunity/types";

export class OpportunityExchangeStore implements C.OpportunityExchange {
  private readonly records: T.OpportunityExchangeRecord[] = [];

  publish(
    record: Omit<T.OpportunityExchangeRecord, "publishedAt"> & { publishedAt?: string },
    now: Date = new Date()
  ): T.OpportunityExchangeRecord {
    const published: T.OpportunityExchangeRecord = {
      ...record,
      publishedAt: record.publishedAt ?? now.toISOString(),
    };
    this.records.push(published);
    return published;
  }

  publishMany(
    records: Array<Omit<T.OpportunityExchangeRecord, "publishedAt"> & { publishedAt?: string }>,
    now: Date = new Date()
  ): T.OpportunityExchangeRecord[] {
    return records.map((record) => this.publish(record, now));
  }

  list(filter?: { category?: T.OpportunityCategory; domain?: T.OpportunityOriginatingDomain }): T.OpportunityExchangeRecord[] {
    return this.records.filter((record) => {
      if (filter?.category && record.category !== filter.category) return false;
      if (filter?.domain && record.originatingDomain !== filter.domain) return false;
      return true;
    });
  }

  clear(): void {
    this.records.length = 0;
  }

  toExchangeRecords(input: {
    categories: Record<T.OpportunityCategory, T.CategoryOpportunityRecord[]>;
    published?: T.OpportunityExchangeRecord[];
    now: Date;
    dnaAlignment: T.OpportunityDnaAlignment;
  }): T.OpportunityExchangeRecord[] {
    const fromCategories = Object.values(input.categories)
      .flat()
      .map((record) => this.fromCategory(record, input.now, input.dnaAlignment));
    const published = (input.published ?? []).map((record) => ({
      ...record,
      publishedAt: record.publishedAt || input.now.toISOString(),
    }));
    const merged = [...fromCategories, ...published];
    const unique = new Map<string, T.OpportunityExchangeRecord>();
    for (const record of merged) unique.set(record.id, record);
    return [...unique.values()].sort((a, b) => b.score - a.score);
  }

  private fromCategory(
    record: T.CategoryOpportunityRecord,
    now: Date,
    dnaAlignment: T.OpportunityDnaAlignment
  ): T.OpportunityExchangeRecord {
    const risks: T.OpportunityRiskFactor[] = [
      {
        key: "delivery",
        label: "Delivery risk",
        score: clamp(100 - record.score),
        mitigation: "Gate investment behind milestones and owners.",
      },
    ];
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      originatingDomain: record.originatingDomain,
      category: record.category,
      estimatedFinancialImpact: record.estimatedFinancialImpact,
      estimatedMissionImpact: record.estimatedMissionImpact,
      implementationCost: record.implementationCost,
      requiredResources: [
        {
          role: "Opportunity owner",
          effortHours: Math.round(record.expectedTimelineDays * 2),
          skills: [record.categoryLabel],
          budget: Math.round(record.implementationCost * 0.4),
        },
      ],
      expectedTimelineDays: record.expectedTimelineDays,
      confidence: record.confidence,
      priority: record.priority ?? priorityFromScore(record.score),
      dependencies: [
        {
          key: "upstream-domain",
          label: `${record.originatingDomain} signal integrity`,
          blocking: false,
          domain: record.originatingDomain,
        },
      ],
      risks,
      organizationalDnaAlignment: dnaAlignment,
      stage: record.stage,
      score: record.score,
      roi: record.roi,
      lenses: record.lenses,
      narrative: record.narrative,
      publishedAt: now.toISOString(),
    };
  }
}

export { OpportunityExchangeStore as OpportunityExchange };

import type {
  MemoryEntity,
  MemoryRetentionPolicy,
  RetentionRule,
} from "@/lib/platform/intelligence/executive-memory/types";

export const DEFAULT_RETENTION_RULES: RetentionRule[] = [
  {
    id: "permanent-decisions",
    policy: "permanent",
    kinds: ["decision", "outcome", "lesson"],
    description: "Core executive reasoning retained permanently",
  },
  {
    id: "archive-briefs",
    policy: "archive",
    kinds: ["briefing", "meeting"],
    afterDays: 365,
    description: "Briefings archived for year-over-year comparison",
  },
  {
    id: "expire-watch-risks",
    policy: "expire",
    kinds: ["risk", "opportunity"],
    afterDays: 180,
    description: "Stale open signals expire unless legal hold",
  },
];

export function applyRetention(
  entities: MemoryEntity[],
  rules: RetentionRule[],
  now: Date
): MemoryEntity[] {
  return entities.map((entity) => {
    if (entity.retention === "legal_hold") return entity;
    const rule =
      rules.find((r) => r.kinds?.includes(entity.kind)) ??
      rules.find((r) => !r.kinds?.length);
    if (!rule) return entity;

    const retention: MemoryRetentionPolicy = rule.policy;
    let expiresAt = entity.expiresAt ?? null;
    if (retention === "expire" && rule.afterDays != null) {
      const ms = rule.afterDays * 24 * 60 * 60 * 1000;
      const created = new Date(entity.createdAt).getTime();
      expiresAt = new Date(created + ms).toISOString();
    }
    if (retention === "permanent" || retention === "legal_hold") {
      expiresAt = null;
    }

    const expired =
      expiresAt != null && new Date(expiresAt).getTime() <= now.getTime();

    return {
      ...entity,
      retention,
      expiresAt,
      metadata: {
        ...entity.metadata,
        retentionRuleId: rule.id,
        expired: expired || undefined,
      },
    };
  });
}

export function activeEntities(entities: MemoryEntity[]): MemoryEntity[] {
  return entities.filter((e) => {
    if (e.retention === "legal_hold" || e.retention === "permanent") return true;
    if (e.metadata.expired === true) return false;
    if (e.retention === "expire" && e.expiresAt) {
      return new Date(e.expiresAt).getTime() > Date.now();
    }
    return true;
  });
}

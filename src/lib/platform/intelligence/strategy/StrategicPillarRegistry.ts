/**
 * StrategicPillarRegistry — configurable pillars — Sprint 205.
 */

import type { StrategicPillar } from "./types";

const pillars: StrategicPillar[] = [];

export const StrategicPillarRegistry = {
  list(organizationId?: string): readonly StrategicPillar[] {
    const all = pillars.filter((p) => p.active);
    return organizationId
      ? all.filter((p) => p.organizationId === organizationId)
      : all;
  },

  get(id: string): StrategicPillar | null {
    return pillars.find((p) => p.id === id) ?? null;
  },

  upsert(pillar: StrategicPillar): StrategicPillar {
    const idx = pillars.findIndex((p) => p.id === pillar.id);
    if (idx >= 0) pillars[idx] = pillar;
    else pillars.push(pillar);
    return pillar;
  },

  upsertMany(items: readonly StrategicPillar[]): void {
    for (const p of items) this.upsert(p);
  },

  resetForTests(): void {
    pillars.length = 0;
  },
} as const;

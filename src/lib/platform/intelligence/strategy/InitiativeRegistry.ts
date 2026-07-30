/**
 * InitiativeRegistry — goal initiatives — Sprint 205.
 */

import type { StrategicInitiative } from "./types";

const initiatives: StrategicInitiative[] = [];

export const InitiativeRegistry = {
  list(organizationId?: string): readonly StrategicInitiative[] {
    return organizationId
      ? initiatives.filter((i) => i.organizationId === organizationId)
      : initiatives;
  },

  listForGoal(goalId: string): readonly StrategicInitiative[] {
    return initiatives.filter((i) => i.goalId === goalId);
  },

  get(id: string): StrategicInitiative | null {
    return initiatives.find((i) => i.id === id) ?? null;
  },

  upsert(initiative: StrategicInitiative): StrategicInitiative {
    const idx = initiatives.findIndex((i) => i.id === initiative.id);
    if (idx >= 0) initiatives[idx] = initiative;
    else initiatives.unshift(initiative);
    return initiative;
  },

  upsertMany(items: readonly StrategicInitiative[]): void {
    for (const i of items) this.upsert(i);
  },

  resetForTests(): void {
    initiatives.length = 0;
  },
} as const;

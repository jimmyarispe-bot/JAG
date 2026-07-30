/**
 * MissionRegistry — organizational mission / vision / values — Sprint 205.
 */

import type { OrganizationalMission } from "./types";

const missions = new Map<string, OrganizationalMission>();

export const MissionRegistry = {
  get(organizationId: string): OrganizationalMission | null {
    return missions.get(organizationId) ?? null;
  },

  list(): readonly OrganizationalMission[] {
    return [...missions.values()];
  },

  upsert(mission: OrganizationalMission): OrganizationalMission {
    missions.set(mission.organizationId, mission);
    return mission;
  },

  resetForTests(): void {
    missions.clear();
  },
} as const;

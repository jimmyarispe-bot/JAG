import {
  ACADEMYOS_INTELLIGENCE_PACKS,
  listAcademyIntelligencePacks,
  type AcademyIntelligenceDomain,
  type AcademyIntelligencePack,
} from "@/applications/academyos/intelligence";

export type IntelligenceSnapshot = {
  packId: string;
  domain: AcademyIntelligenceDomain;
  title: string;
  kpiKeys: string[];
  entityTypes: string[];
};

/**
 * Surfaces Academy intelligence packs without coupling callers to pack registry internals.
 * Platform Forecasting/Intelligence engines execute metrics later.
 */
export const IntelligencePlatformAdapter = {
  listPacks(): AcademyIntelligencePack[] {
    const registered = listAcademyIntelligencePacks();
    return registered.length ? registered : [...ACADEMYOS_INTELLIGENCE_PACKS];
  },

  getPack(packId: string): AcademyIntelligencePack | null {
    return this.listPacks().find((p) => p.id === packId) ?? null;
  },

  snapshot(domain?: AcademyIntelligenceDomain): IntelligenceSnapshot[] {
    return this.listPacks()
      .filter((p) => (domain ? p.domain === domain : true))
      .map((p) => ({
        packId: p.id,
        domain: p.domain,
        title: p.title,
        kpiKeys: [...p.kpiKeys],
        entityTypes: [...p.entityTypes],
      }));
  },
};

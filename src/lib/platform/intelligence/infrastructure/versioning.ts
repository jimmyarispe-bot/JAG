/**
 * Intelligence Platform Infrastructure — IntelligenceVersioning (Sprint 027).
 */

import type {
  IntelligenceModule,
  IntelligencePlatformClock,
  IntelligenceVersioning as IntelligenceVersioningContract,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import {
  INTELLIGENCE_PLATFORM_VERSION,
  type IntelligenceModuleId,
  type IntelligenceModuleVersion,
} from "@/lib/platform/intelligence/infrastructure/types";
import { createDefaultClock } from "@/lib/platform/intelligence/infrastructure/clock";

function parseSemver(version: string): [number, number, number] {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  if (!match) return [0, 0, 0];
  return [
    Number(match[1] ?? 0),
    Number(match[2] ?? 0),
    Number(match[3] ?? 0),
  ];
}

function gte(version: string, minVersion: string): boolean {
  const [a, b, c] = parseSemver(version);
  const [x, y, z] = parseSemver(minVersion);
  if (a !== x) return a > x;
  if (b !== y) return b > y;
  return c >= z;
}

export class IntelligenceVersioningImpl
  implements IntelligenceVersioningContract
{
  private readonly versions = new Map<string, IntelligenceModuleVersion>();
  private readonly clock: IntelligencePlatformClock;

  constructor(clock: IntelligencePlatformClock = createDefaultClock()) {
    this.clock = clock;
  }

  record(module: IntelligenceModule): IntelligenceModuleVersion {
    const record: IntelligenceModuleVersion = {
      moduleId: module.id,
      version: module.version,
      platformVersion: INTELLIGENCE_PLATFORM_VERSION,
      registeredAt: this.clock.now().toISOString(),
      compatible: Boolean(module.version),
      notes: `${module.name} @ ${module.version}`,
    };
    this.versions.set(module.id, record);
    return { ...record };
  }

  get(moduleId: IntelligenceModuleId): IntelligenceModuleVersion | undefined {
    const record = this.versions.get(moduleId);
    return record ? { ...record } : undefined;
  }

  list(): IntelligenceModuleVersion[] {
    return [...this.versions.values()]
      .map((record) => ({ ...record }))
      .sort((a, b) => String(a.moduleId).localeCompare(String(b.moduleId)));
  }

  isCompatible(moduleId: IntelligenceModuleId, minVersion?: string): boolean {
    const record = this.versions.get(moduleId);
    if (!record || !record.compatible) return false;
    if (!minVersion) return true;
    return gte(record.version, minVersion);
  }

  platformVersion(): string {
    return INTELLIGENCE_PLATFORM_VERSION;
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceVersioningImpl as IntelligenceVersioning };

export function createIntelligenceVersioning(
  clock?: IntelligencePlatformClock
): IntelligenceVersioningImpl {
  return new IntelligenceVersioningImpl(clock);
}

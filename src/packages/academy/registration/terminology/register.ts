import {
  ACADEMY_TERMINOLOGY_PACKS,
  type AcademyTerminologyPack,
} from "@/packages/academy/registration/terminology/packs";

const registry = new Map<string, AcademyTerminologyPack>();

export function registerAcademyPackageTerminology(): void {
  registry.clear();
  for (const pack of ACADEMY_TERMINOLOGY_PACKS) {
    registry.set(pack.id, pack);
  }
}

export function listAcademyTerminologyPacks(): AcademyTerminologyPack[] {
  return [...registry.values()];
}

export function resetAcademyTerminologyForTests(): void {
  registry.clear();
}

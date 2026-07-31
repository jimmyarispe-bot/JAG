import {
  ACADEMY_LOCALIZATION_PACKS,
  type AcademyLocalizationPack,
} from "@/packages/academy/registration/localization/packs";

const registry = new Map<string, AcademyLocalizationPack>();

export function registerAcademyPackageLocalization(): void {
  registry.clear();
  for (const pack of ACADEMY_LOCALIZATION_PACKS) {
    registry.set(pack.id, pack);
  }
}

export function listAcademyLocalizationPacks(): AcademyLocalizationPack[] {
  return [...registry.values()];
}

export function resetAcademyLocalizationForTests(): void {
  registry.clear();
}

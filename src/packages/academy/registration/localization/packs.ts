import { ACADEMY_LOCALIZATION_PACK_IDS } from "@/packages/academy/package";

export type AcademyLocalizationPack = {
  readonly id: string;
  readonly locale: string;
  readonly label: string;
  readonly messages: Readonly<Record<string, string>>;
};

export const ACADEMY_LOCALIZATION_PACKS: readonly AcademyLocalizationPack[] = [
  {
    id: ACADEMY_LOCALIZATION_PACK_IDS[0],
    locale: "en-US",
    label: "Academy English (US)",
    messages: {
      "app.name": "Academy",
      "nav.home": "Home",
    },
  },
];

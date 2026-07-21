import type { BriefingPersonalizer } from "@/lib/platform/intelligence/briefing/types";
import { createFounderPersonalizer } from "@/lib/platform/intelligence/briefing/personalization/founder";
import { createCeoPersonalizer } from "@/lib/platform/intelligence/briefing/personalization/ceo";
import { createExecutivePersonalizer } from "@/lib/platform/intelligence/briefing/personalization/executive";
import { createSchoolLeaderPersonalizer } from "@/lib/platform/intelligence/briefing/personalization/school-leader";
import { createBoardPersonalizer } from "@/lib/platform/intelligence/briefing/personalization/board";

export { resolvePreferences } from "@/lib/platform/intelligence/briefing/personalization/preferences";
export { createFounderPersonalizer } from "@/lib/platform/intelligence/briefing/personalization/founder";
export { createCeoPersonalizer } from "@/lib/platform/intelligence/briefing/personalization/ceo";
export { createExecutivePersonalizer } from "@/lib/platform/intelligence/briefing/personalization/executive";
export { createSchoolLeaderPersonalizer } from "@/lib/platform/intelligence/briefing/personalization/school-leader";
export { createBoardPersonalizer } from "@/lib/platform/intelligence/briefing/personalization/board";

export function createBuiltinPersonalizers(): BriefingPersonalizer[] {
  return [
    createFounderPersonalizer(),
    createCeoPersonalizer(),
    createExecutivePersonalizer(),
    createSchoolLeaderPersonalizer(),
    createBoardPersonalizer(),
  ];
}

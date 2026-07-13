import { createAreaIntelligence } from "@/lib/platform/intelligence/political/area-factory";
export class ElectionsLeadershipIntelligence extends createAreaIntelligence("elections_leadership", ["Election turnover risk", "Leadership continuity"], "Elections & Leadership") {}

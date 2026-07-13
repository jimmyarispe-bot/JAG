import { createAreaIntelligence } from "@/lib/platform/intelligence/institutional-memory/area-factory";
export class ExpertiseIntelligence extends createAreaIntelligence("expertise_intelligence", ["Expertise availability", "Expertise departure risk"], "Expertise Intelligence") {}

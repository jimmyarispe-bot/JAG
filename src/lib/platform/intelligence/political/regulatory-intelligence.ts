import { createAreaIntelligence } from "@/lib/platform/intelligence/political/area-factory";
export class RegulatoryIntelligence extends createAreaIntelligence("regulatory", ["Rulemaking intensity", "Enforcement posture"], "Regulatory") {}

import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class IndustryConditionsIntelligence extends createAreaIntelligence("industry_conditions", ["Sector demand conditions", "Competitive intensity"], "Industry") {}

import { createAreaIntelligence } from "@/lib/platform/intelligence/political/area-factory";
export class HealthcarePolicyIntelligence extends createAreaIntelligence("healthcare_policy", ["Coverage policy shift", "Provider regulation pressure"], "Healthcare Policy") {}

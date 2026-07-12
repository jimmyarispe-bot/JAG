import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class HealthcareIntelligence extends createAreaIntelligence("healthcare", ["Healthcare cost pressure", "Benefits burden"], "Healthcare") {}

import { createAreaIntelligence } from "@/lib/platform/intelligence/ethical/area-factory";
export class FairnessIntelligence extends createAreaIntelligence("fairness", ["Fairness strength signal", "Fairness failure hotspot"], "Fairness") {}

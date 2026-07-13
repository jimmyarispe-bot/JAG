import { createAreaIntelligence } from "@/lib/platform/intelligence/ethical/area-factory";
export class EthicalRiskIntelligence extends createAreaIntelligence("ethical_risk", ["Ethical risk calm", "Ethical risk spike"], "Ethical Risk") {}

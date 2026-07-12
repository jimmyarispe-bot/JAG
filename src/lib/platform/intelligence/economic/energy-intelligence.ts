import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class EnergyIntelligence extends createAreaIntelligence("energy", ["Energy price volatility", "Utility operating cost"], "Energy") {}

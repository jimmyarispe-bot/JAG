import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class CurrencyIntelligence extends createAreaIntelligence("currency", ["Exchange rate exposure", "Cross-border purchasing power"], "Currency") {}

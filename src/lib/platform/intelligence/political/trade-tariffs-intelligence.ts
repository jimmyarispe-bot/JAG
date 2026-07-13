import { createAreaIntelligence } from "@/lib/platform/intelligence/political/area-factory";
export class TradeTariffsIntelligence extends createAreaIntelligence("trade_tariffs", ["Tariff exposure", "Supply trade friction"], "Trade & Tariffs") {}

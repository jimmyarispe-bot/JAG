import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class CommodityPricesIntelligence extends createAreaIntelligence("commodity_prices", ["Commodity input prices", "Raw material volatility"], "Commodity") {}

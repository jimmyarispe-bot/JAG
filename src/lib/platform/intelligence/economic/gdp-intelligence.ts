import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class GdpIntelligence extends createAreaIntelligence("gdp", ["Output growth signal", "Demand momentum"], "GDP") {}

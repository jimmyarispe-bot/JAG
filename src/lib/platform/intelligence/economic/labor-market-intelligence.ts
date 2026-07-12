import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class LaborMarketIntelligence extends createAreaIntelligence("labor_market", ["Talent availability", "Participation and vacancies"], "Labor market") {}

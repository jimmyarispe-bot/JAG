import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class WageTrendsIntelligence extends createAreaIntelligence("wage_trends", ["Wage growth pressure", "Compensation competitiveness"], "Wage trend") {}

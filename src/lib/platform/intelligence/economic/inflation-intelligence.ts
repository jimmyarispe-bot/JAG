import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class InflationIntelligence extends createAreaIntelligence("inflation", ["Consumer price pressure", "Input cost inflation"], "Inflation") {}

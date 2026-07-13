import { createAreaIntelligence } from "@/lib/platform/intelligence/environmental/area-factory";
export class ClimateIntelligence extends createAreaIntelligence("climate", ["Climate trajectory signal", "Climate exposure hotspot"], "Climate") {}

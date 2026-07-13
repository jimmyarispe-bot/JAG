import { createAreaIntelligence } from "@/lib/platform/intelligence/ecosystem/area-factory";
export class AllianceIntelligence extends createAreaIntelligence("alliance_intelligence", ["Alliance cohesion signal", "Alliance defection hotspot"], "Alliance Intelligence") {}

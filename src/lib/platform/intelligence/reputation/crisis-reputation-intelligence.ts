import { createAreaIntelligence } from "@/lib/platform/intelligence/reputation/area-factory";
export class CrisisReputationIntelligence extends createAreaIntelligence("crisis_reputation", ["Crisis readiness signal", "Crisis exposure hotspot"], "Crisis Reputation") {}

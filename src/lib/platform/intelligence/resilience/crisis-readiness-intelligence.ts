import { createAreaIntelligence } from "@/lib/platform/intelligence/resilience/area-factory";
export class CrisisReadinessIntelligence extends createAreaIntelligence("crisis_readiness", ["Crisis readiness signal", "Crisis response gap"], "Crisis Readiness") {}

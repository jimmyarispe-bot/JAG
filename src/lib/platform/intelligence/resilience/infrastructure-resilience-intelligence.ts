import { createAreaIntelligence } from "@/lib/platform/intelligence/resilience/area-factory";
export class InfrastructureResilienceIntelligence extends createAreaIntelligence("infrastructure_resilience", ["Infrastructure readiness", "Infrastructure failure hotspot"], "Infrastructure Resilience") {}

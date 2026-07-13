import { createAreaIntelligence } from "@/lib/platform/intelligence/resilience/area-factory";
export class RedundancyPlanningIntelligence extends createAreaIntelligence("redundancy_planning", ["Redundancy planning strength", "Redundancy gap hotspot"], "Redundancy Planning") {}

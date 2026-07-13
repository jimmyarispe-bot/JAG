import { createAreaIntelligence } from "@/lib/platform/intelligence/resilience/area-factory";
export class OperationalRecoveryIntelligence extends createAreaIntelligence("operational_recovery", ["Operational recovery strength", "Operational recovery lag"], "Operational Recovery") {}

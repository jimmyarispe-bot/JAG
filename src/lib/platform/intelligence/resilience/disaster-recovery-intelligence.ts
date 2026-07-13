import { createAreaIntelligence } from "@/lib/platform/intelligence/resilience/area-factory";
export class DisasterRecoveryIntelligence extends createAreaIntelligence("disaster_recovery", ["Disaster recovery readiness", "Recovery lag hotspot"], "Disaster Recovery") {}

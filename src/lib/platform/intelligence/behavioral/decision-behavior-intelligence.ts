import { createAreaIntelligence } from "@/lib/platform/intelligence/behavioral/area-factory";
export class DecisionBehaviorIntelligence extends createAreaIntelligence("decision_behavior", ["Decision quality signal", "Decision friction hotspot"], "Decision Behavior") {}

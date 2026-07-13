import { createAreaIntelligence } from "@/lib/platform/intelligence/institutional-memory/area-factory";
export class DecisionHistoryIntelligence extends createAreaIntelligence("decision_history", ["Decision history integrity", "Provenance break risk"], "Decision History") {}

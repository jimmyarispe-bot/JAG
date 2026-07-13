import { createAreaIntelligence } from "@/lib/platform/intelligence/institutional-memory/area-factory";
export class PolicyKnowledgeIntelligence extends createAreaIntelligence("policy_knowledge", ["Policy knowledge currency", "Policy staleness hotspot"], "Policy Knowledge") {}

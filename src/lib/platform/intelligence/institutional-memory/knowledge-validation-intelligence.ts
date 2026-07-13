import { createAreaIntelligence } from "@/lib/platform/intelligence/institutional-memory/area-factory";
export class KnowledgeValidationIntelligence extends createAreaIntelligence("knowledge_validation", ["Knowledge validation strength", "Validation failure hotspot"], "Knowledge Validation") {}

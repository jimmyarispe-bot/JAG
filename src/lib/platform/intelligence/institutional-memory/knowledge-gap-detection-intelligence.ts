import { createAreaIntelligence } from "@/lib/platform/intelligence/institutional-memory/area-factory";
export class KnowledgeGapDetectionIntelligence extends createAreaIntelligence("knowledge_gap_detection", ["Gap detection coverage", "Gap cascade hotspot"], "Knowledge Gap Detection") {}

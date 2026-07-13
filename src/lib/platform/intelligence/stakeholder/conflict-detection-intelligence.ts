import { createAreaIntelligence } from "@/lib/platform/intelligence/stakeholder/area-factory";
export class ConflictDetectionIntelligence extends createAreaIntelligence("conflict_detection", ["Conflict early signal", "Escalation pathway risk"], "Conflict Detection") {}

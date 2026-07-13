import { createAreaIntelligence } from "@/lib/platform/intelligence/reputation/area-factory";
export class PressCoverageIntelligence extends createAreaIntelligence("press_coverage", ["Press coverage quality", "Negative press hotspot"], "Press Coverage") {}

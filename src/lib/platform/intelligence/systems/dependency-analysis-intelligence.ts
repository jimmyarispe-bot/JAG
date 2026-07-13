import { createAreaIntelligence } from "@/lib/platform/intelligence/systems/area-factory";
export class DependencyAnalysisIntelligence extends createAreaIntelligence("dependency_analysis", ["Dependency clarity signal", "Hidden dependency hotspot"], "Dependency Analysis") {}

import { createAreaIntelligence } from "@/lib/platform/intelligence/reputation/area-factory";
export class CredibilityIntelligence extends createAreaIntelligence("credibility", ["Credibility index signal", "Credibility deficit hotspot"], "Credibility") {}

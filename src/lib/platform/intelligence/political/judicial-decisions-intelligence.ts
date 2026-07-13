import { createAreaIntelligence } from "@/lib/platform/intelligence/political/area-factory";
export class JudicialDecisionsIntelligence extends createAreaIntelligence("judicial_decisions", ["Precedent reversal risk", "Court docket exposure"], "Judicial Decisions") {}

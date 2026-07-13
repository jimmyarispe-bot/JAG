import { createAreaIntelligence } from "@/lib/platform/intelligence/political/area-factory";
export class LegislativeIntelligence extends createAreaIntelligence("legislative", ["Bill pipeline pressure", "Legislative calendar risk"], "Legislative") {}

import { createAreaIntelligence } from "@/lib/platform/intelligence/resilience/area-factory";
export class BusinessContinuityIntelligence extends createAreaIntelligence("business_continuity", ["Continuity readiness signal", "Continuity gap hotspot"], "Business Continuity") {}

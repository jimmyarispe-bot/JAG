import { createAreaIntelligence } from "@/lib/platform/intelligence/reputation/area-factory";
export class BrandReputationIntelligence extends createAreaIntelligence("brand_reputation", ["Brand equity signal", "Brand erosion hotspot"], "Brand Reputation") {}

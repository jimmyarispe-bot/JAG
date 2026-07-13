import { createAreaIntelligence } from "@/lib/platform/intelligence/political/area-factory";
export class PublicFundingIntelligence extends createAreaIntelligence("public_funding", ["Appropriation opportunity", "Funding freeze exposure"], "Public Funding") {}

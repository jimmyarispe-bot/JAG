import { createAreaIntelligence } from "@/lib/platform/intelligence/reputation/area-factory";
export class RegulatoryReputationIntelligence extends createAreaIntelligence("regulatory_reputation", ["Regulatory standing signal", "Regulatory censure risk"], "Regulatory Reputation") {}

import { createAreaIntelligence } from "@/lib/platform/intelligence/reputation/area-factory";
export class PartnerReputationIntelligence extends createAreaIntelligence("partner_reputation", ["Partner confidence signal", "Partner disavowal risk"], "Partner Reputation") {}

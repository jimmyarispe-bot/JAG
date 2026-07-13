import { createAreaIntelligence } from "@/lib/platform/intelligence/stakeholder/area-factory";
export class PartnerStakeholdersIntelligence extends createAreaIntelligence("partner_stakeholders", ["Partner alliance strength", "Partner defection risk"], "Partner Stakeholders") {}

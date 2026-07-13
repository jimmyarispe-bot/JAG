import { createAreaIntelligence } from "@/lib/platform/intelligence/stakeholder/area-factory";
export class CommunityStakeholdersIntelligence extends createAreaIntelligence("community_stakeholders", ["Community support signal", "Community opposition risk"], "Community Stakeholders") {}

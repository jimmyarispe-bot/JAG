import { createAreaIntelligence } from "@/lib/platform/intelligence/reputation/area-factory";
export class CommunityReputationIntelligence extends createAreaIntelligence("community_reputation", ["Community standing signal", "Community backlash risk"], "Community Reputation") {}

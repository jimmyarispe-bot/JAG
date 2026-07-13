import { createAreaIntelligence } from "@/lib/platform/intelligence/stakeholder/area-factory";
export class InvestorDonorIntelligence extends createAreaIntelligence("investor_donor", ["Investor/donor confidence", "Withdrawal risk signal"], "Investor Donor") {}

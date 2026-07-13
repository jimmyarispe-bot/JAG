import { createAreaIntelligence } from "@/lib/platform/intelligence/political/area-factory";
export class TaxPolicyIntelligence extends createAreaIntelligence("tax_policy", ["Tax reform exposure", "Incentive retention"], "Tax Policy") {}

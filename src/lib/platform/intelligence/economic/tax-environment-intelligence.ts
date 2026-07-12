import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class TaxEnvironmentIntelligence extends createAreaIntelligence("tax_environment", ["Tax burden trajectory", "Incentive climate"], "Tax environment") {}

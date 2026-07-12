import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class InterestRatesIntelligence extends createAreaIntelligence("interest_rates", ["Borrowing cost trajectory", "Credit availability"], "Interest rate") {}

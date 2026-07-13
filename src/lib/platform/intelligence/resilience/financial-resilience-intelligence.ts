import { createAreaIntelligence } from "@/lib/platform/intelligence/resilience/area-factory";
export class FinancialResilienceIntelligence extends createAreaIntelligence("financial_resilience", ["Financial resilience signal", "Financial shock exposure"], "Financial Resilience") {}

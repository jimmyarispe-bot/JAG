import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class ConsumerSpendingIntelligence extends createAreaIntelligence("consumer_spending", ["Household demand", "Discretionary spend resilience"], "Consumer spending") {}

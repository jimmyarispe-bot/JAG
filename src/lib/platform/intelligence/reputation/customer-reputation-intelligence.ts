import { createAreaIntelligence } from "@/lib/platform/intelligence/reputation/area-factory";
export class CustomerReputationIntelligence extends createAreaIntelligence("customer_reputation", ["Customer reputation signal", "Customer advocacy gap"], "Customer Reputation") {}

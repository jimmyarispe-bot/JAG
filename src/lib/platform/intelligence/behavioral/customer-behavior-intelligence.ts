import { createAreaIntelligence } from "@/lib/platform/intelligence/behavioral/area-factory";
export class CustomerBehaviorIntelligence extends createAreaIntelligence("customer_behavior", ["Customer response signal", "Customer friction hotspot"], "Customer Behavior") {}

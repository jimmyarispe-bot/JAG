import { createAreaIntelligence } from "@/lib/platform/intelligence/systems/area-factory";
export class ResourceFlowIntelligence extends createAreaIntelligence("resource_flow", ["Resource flow health", "Resource flow collapse"], "Resource Flow") {}

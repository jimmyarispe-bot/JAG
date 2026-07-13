import { createAreaIntelligence } from "@/lib/platform/intelligence/environmental/area-factory";
export class CarbonEmissionsIntelligence extends createAreaIntelligence("carbon_emissions", ["Carbon intensity trend", "Abatement pathway readiness"], "Carbon Emissions") {}

import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class HousingIntelligence extends createAreaIntelligence("housing", ["Housing affordability", "Shelter cost trajectory"], "Housing") {}

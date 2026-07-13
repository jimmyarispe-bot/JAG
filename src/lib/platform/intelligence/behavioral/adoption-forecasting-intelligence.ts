import { createAreaIntelligence } from "@/lib/platform/intelligence/behavioral/area-factory";
export class AdoptionForecastingIntelligence extends createAreaIntelligence("adoption_forecasting", ["Adoption trajectory signal", "Adoption stall hotspot"], "Adoption Forecasting") {}

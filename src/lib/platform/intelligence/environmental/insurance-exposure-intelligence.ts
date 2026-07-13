import { createAreaIntelligence } from "@/lib/platform/intelligence/environmental/area-factory";
export class InsuranceExposureIntelligence extends createAreaIntelligence("insurance_exposure", ["Insurance premium pressure", "Coverage gap risk"], "Insurance Exposure") {}

import { createAreaIntelligence } from "@/lib/platform/intelligence/environmental/area-factory";
export class NaturalDisasterIntelligence extends createAreaIntelligence("natural_disaster", ["Disaster proximity index", "Recovery capacity signal"], "Natural Disaster") {}

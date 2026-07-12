import { createAreaIntelligence } from "@/lib/platform/intelligence/economic/area-factory";
export class EmploymentIntelligence extends createAreaIntelligence("employment", ["Employment level stability", "Job creation pace"], "Employment") {}

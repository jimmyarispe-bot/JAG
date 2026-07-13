import { createAreaIntelligence } from "@/lib/platform/intelligence/collective/area-factory";
export class ExpertWeightingIntelligence extends createAreaIntelligence("expert_weighting", ["Expert weighting accuracy", "Weighting distortion risk"], "Expert Weighting") {}

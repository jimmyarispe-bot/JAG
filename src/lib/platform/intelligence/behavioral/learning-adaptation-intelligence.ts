import { createAreaIntelligence } from "@/lib/platform/intelligence/behavioral/area-factory";
export class LearningAdaptationIntelligence extends createAreaIntelligence("learning_adaptation", ["Learning velocity signal", "Adaptation lag hotspot"], "Learning Adaptation") {}

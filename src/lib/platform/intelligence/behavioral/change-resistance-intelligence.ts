import { createAreaIntelligence } from "@/lib/platform/intelligence/behavioral/area-factory";
export class ChangeResistanceIntelligence extends createAreaIntelligence("change_resistance", ["Resistance monitoring signal", "Resistance spike hotspot"], "Change Resistance") {}

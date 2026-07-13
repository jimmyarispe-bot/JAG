import { createAreaIntelligence } from "@/lib/platform/intelligence/systems/area-factory";
export class BottleneckDetectionIntelligence extends createAreaIntelligence("bottleneck_detection", ["Bottleneck visibility", "Bottleneck saturation hotspot"], "Bottleneck Detection") {}

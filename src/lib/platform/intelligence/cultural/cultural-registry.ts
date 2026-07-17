import type { CulturalRegistry } from "@/lib/platform/intelligence/cultural/contracts";
import type { CulturalPublisher } from "@/lib/platform/intelligence/cultural/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class CulturalRegistryStore
  extends PublisherRegistryArray<CulturalPublisher>
  implements CulturalRegistry {}

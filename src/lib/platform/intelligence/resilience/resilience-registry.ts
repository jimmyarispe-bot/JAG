import type { ResilienceRegistry } from "@/lib/platform/intelligence/resilience/contracts";
import type { ResiliencePublisher } from "@/lib/platform/intelligence/resilience/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class ResilienceRegistryStore
  extends PublisherRegistryArray<ResiliencePublisher>
  implements ResilienceRegistry {}

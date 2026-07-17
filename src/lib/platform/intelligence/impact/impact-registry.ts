import type { ImpactRegistry as Contract } from "@/lib/platform/intelligence/impact/contracts";
import type { ImpactPublisher } from "@/lib/platform/intelligence/impact/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class ImpactRegistryStore
  extends PublisherRegistryArray<ImpactPublisher>
  implements Contract {}

export { ImpactRegistryStore as ImpactRegistry };

import type { CollectiveRegistry } from "@/lib/platform/intelligence/collective/contracts";
import type { CollectivePublisher } from "@/lib/platform/intelligence/collective/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class CollectiveRegistryStore
  extends PublisherRegistryArray<CollectivePublisher>
  implements CollectiveRegistry {}

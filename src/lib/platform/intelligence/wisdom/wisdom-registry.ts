import type { WisdomRegistry } from "@/lib/platform/intelligence/wisdom/contracts";
import type { WisdomPublisher } from "@/lib/platform/intelligence/wisdom/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class WisdomRegistryStore
  extends PublisherRegistryArray<WisdomPublisher>
  implements WisdomRegistry {}

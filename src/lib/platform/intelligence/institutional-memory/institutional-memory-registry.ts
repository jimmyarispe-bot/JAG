import type { InstitutionalMemoryRegistry } from "@/lib/platform/intelligence/institutional-memory/contracts";
import type { InstitutionalMemoryPublisher } from "@/lib/platform/intelligence/institutional-memory/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class InstitutionalMemoryRegistryStore
  extends PublisherRegistryArray<InstitutionalMemoryPublisher>
  implements InstitutionalMemoryRegistry {}

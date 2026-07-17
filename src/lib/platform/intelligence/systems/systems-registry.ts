import type { SystemsRegistry } from "@/lib/platform/intelligence/systems/contracts";
import type { SystemsPublisher } from "@/lib/platform/intelligence/systems/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class SystemsRegistryStore
  extends PublisherRegistryArray<SystemsPublisher>
  implements SystemsRegistry {}

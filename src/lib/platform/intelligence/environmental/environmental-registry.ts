import type { EnvironmentalRegistry as Contract } from "@/lib/platform/intelligence/environmental/contracts";
import type { EnvironmentalPublisher } from "@/lib/platform/intelligence/environmental/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class EnvironmentalRegistryStore
  extends PublisherRegistryArray<EnvironmentalPublisher>
  implements Contract {}

export { EnvironmentalRegistryStore as EnvironmentalRegistry };

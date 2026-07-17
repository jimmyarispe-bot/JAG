import type { PoliticalRegistry as Contract } from "@/lib/platform/intelligence/political/contracts";
import type { PoliticalPublisher } from "@/lib/platform/intelligence/political/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class PoliticalRegistryStore
  extends PublisherRegistryArray<PoliticalPublisher>
  implements Contract {}

export { PoliticalRegistryStore as PoliticalRegistry };

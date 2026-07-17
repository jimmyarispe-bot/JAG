import type { EconomicRegistry as Contract } from "@/lib/platform/intelligence/economic/contracts";
import type { EconomicPublisher } from "@/lib/platform/intelligence/economic/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class EconomicRegistryStore
  extends PublisherRegistryArray<EconomicPublisher>
  implements Contract {}

export { EconomicRegistryStore as EconomicRegistry };

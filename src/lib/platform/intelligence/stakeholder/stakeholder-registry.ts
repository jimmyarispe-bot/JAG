import type { StakeholderRegistry as Contract } from "@/lib/platform/intelligence/stakeholder/contracts";
import type { StakeholderPublisher } from "@/lib/platform/intelligence/stakeholder/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class StakeholderRegistryStore
  extends PublisherRegistryArray<StakeholderPublisher>
  implements Contract {}

export { StakeholderRegistryStore as StakeholderRegistry };

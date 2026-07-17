import type { ReputationRegistry as Contract } from "@/lib/platform/intelligence/reputation/contracts";
import type { ReputationPublisher } from "@/lib/platform/intelligence/reputation/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class ReputationRegistryStore
  extends PublisherRegistryArray<ReputationPublisher>
  implements Contract {}

export { ReputationRegistryStore as ReputationRegistry };

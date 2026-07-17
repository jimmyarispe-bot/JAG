import type { CompetitiveRegistry as Contract } from "@/lib/platform/intelligence/competitive/contracts";
import type { CompetitivePublisher } from "@/lib/platform/intelligence/competitive/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class CompetitiveRegistryStore
  extends PublisherRegistryArray<CompetitivePublisher>
  implements Contract {}

export { CompetitiveRegistryStore as CompetitiveRegistry };

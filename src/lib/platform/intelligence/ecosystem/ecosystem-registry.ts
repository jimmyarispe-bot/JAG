import type { EcosystemRegistry } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { EcosystemPublisher } from "@/lib/platform/intelligence/ecosystem/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class EcosystemRegistryStore
  extends PublisherRegistryArray<EcosystemPublisher>
  implements EcosystemRegistry {}

import type { EthicalRegistry } from "@/lib/platform/intelligence/ethical/contracts";
import type { EthicalPublisher } from "@/lib/platform/intelligence/ethical/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class EthicalRegistryStore
  extends PublisherRegistryArray<EthicalPublisher>
  implements EthicalRegistry {}

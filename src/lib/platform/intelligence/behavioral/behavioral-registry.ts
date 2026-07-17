import type { BehavioralRegistry as Contract } from "@/lib/platform/intelligence/behavioral/contracts";
import type { BehavioralPublisher } from "@/lib/platform/intelligence/behavioral/types";
import { PublisherRegistryArray } from "@/lib/platform/intelligence/common";

export class BehavioralRegistryStore
  extends PublisherRegistryArray<BehavioralPublisher>
  implements Contract {}

export { BehavioralRegistryStore as BehavioralRegistry };

/**
 * Intelligence DI registration — modular composition entry.
 */

export type { CreateIntelligenceServiceOptions, DnaOiosWiring } from "./options";
export { registerCognitiveDomains } from "./cognitive";
export { registerFoundationStacks, type FoundationStacks } from "./foundation";
export { registerProductStacks, type ProductStacks } from "./product";
export { registerExternalStacks, type ExternalStacks } from "./external";
export { registerRelationshipStacks, type RelationshipStacks } from "./relationship";
export { registerSystemsStacks, type SystemsStacks } from "./systems";
export { registerMemoryStacks, type MemoryStacks } from "./memory";
export { registerWisdomStacks, type WisdomStacks } from "./wisdom";
export {
  registerPlatformStack,
  type DomainStacks,
} from "./compose";

import type { IntelligencePlatformStack } from "@/lib/platform/intelligence/infrastructure";
import type { CreateIntelligenceServiceOptions } from "./options";
import { registerFoundationStacks } from "./foundation";
import { registerProductStacks } from "./product";
import { registerExternalStacks } from "./external";
import { registerRelationshipStacks } from "./relationship";
import { registerSystemsStacks } from "./systems";
import { registerMemoryStacks } from "./memory";
import { registerWisdomStacks } from "./wisdom";
import { registerPlatformStack, type DomainStacks } from "./compose";

export type IntelligenceServiceStacks = DomainStacks & {
  intelligencePlatform: IntelligencePlatformStack;
};

/**
 * Compose all intelligence stacks in dependency order.
 * Preserves the same wiring semantics as the former monolithic factory.
 */
export function composeIntelligenceStacks(
  options: CreateIntelligenceServiceOptions = {}
): IntelligenceServiceStacks {
  const foundation = registerFoundationStacks(options);
  const wiring = {
    organizationDna: foundation.organizationDna,
    oios: foundation.oios,
  };
  const product = registerProductStacks(options, wiring);
  const external = registerExternalStacks(options, wiring);
  const relationship = registerRelationshipStacks(options, wiring);
  const systems = registerSystemsStacks(options, wiring);
  const memory = registerMemoryStacks(options, wiring);
  const wisdom = registerWisdomStacks(options, wiring);

  const domains: DomainStacks = {
    ...foundation,
    ...product,
    ...external,
    ...relationship,
    ...systems,
    ...memory,
    ...wisdom,
  };

  return {
    ...domains,
    intelligencePlatform: registerPlatformStack(options, domains),
  };
}

/**
 * Declarative license catalog for capability packs.
 */

import type { CapabilityPackLicense } from "@/jag/blueprints/contracts";

export const CAPABILITY_PACK_LICENSE_CATALOG: readonly CapabilityPackLicense[] =
  Object.freeze([
    Object.freeze({
      id: "jag.platform",
      name: "The JAG™ Platform License",
      commercial: true,
    }),
    Object.freeze({
      id: "jag.reference",
      name: "JAG Reference Pack License",
      commercial: false,
    }),
    Object.freeze({
      id: "Apache-2.0",
      name: "Apache License 2.0",
      spdx: "Apache-2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0",
      commercial: false,
    }),
    Object.freeze({
      id: "MIT",
      name: "MIT License",
      spdx: "MIT",
      url: "https://opensource.org/licenses/MIT",
      commercial: false,
    }),
  ]);

export function getCapabilityPackLicense(
  id: string
): CapabilityPackLicense | undefined {
  return CAPABILITY_PACK_LICENSE_CATALOG.find((l) => l.id === id);
}

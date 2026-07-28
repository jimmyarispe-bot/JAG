/**
 * Tax hooks — 1099 / compliance placeholders (no filing engine in P-008).
 */

import { listVendors } from "../store";

export function list1099Vendors(organizationId: string): readonly {
  readonly vendorId: string;
  readonly name: string;
}[] {
  return Object.freeze(
    listVendors(organizationId)
      .filter((v) => v.is1099 && v.active)
      .map((v) => Object.freeze({ vendorId: v.id, name: v.name }))
  );
}

export const TAX_FOUNDATION_NOTE =
  "Tax calculation and e-filing are out of scope for Finance Foundation; vendor 1099 flags are captured for later compliance sprints.";

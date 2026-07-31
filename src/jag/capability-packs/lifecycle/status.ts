/**
 * Pack lifecycle — draft → published → deprecated → retired.
 */

import type { CapabilityPackStatus } from "@/jag/blueprints/contracts";

const ALLOWED: Readonly<
  Record<CapabilityPackStatus, readonly CapabilityPackStatus[]>
> = {
  draft: ["published", "retired"],
  published: ["deprecated", "retired"],
  deprecated: ["retired", "published"],
  retired: [],
};

export function canTransitionPackStatus(
  from: CapabilityPackStatus,
  to: CapabilityPackStatus
): boolean {
  if (from === to) return false;
  return ALLOWED[from].includes(to);
}

export function assertPackStatusTransition(
  from: CapabilityPackStatus,
  to: CapabilityPackStatus
): { ok: true } | { ok: false; code: string; message: string } {
  if (!canTransitionPackStatus(from, to)) {
    return {
      ok: false,
      code: "illegal_pack_status_transition",
      message: `Cannot transition pack status from "${from}" to "${to}"`,
    };
  }
  return { ok: true };
}

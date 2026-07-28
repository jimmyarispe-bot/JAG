/**
 * Configurable funding sources — education presets available, never hardcoded.
 */

import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../permissions";
import { listFunding, upsertFunding } from "./store";
import type { FundingSource, FundingSourceKind } from "./types";
import { EDUCATION_FUNDING_PRESETS } from "./types";

export function registerFundingSource(input: {
  organizationId: string;
  userId: string;
  kind: FundingSourceKind;
  name: string;
  metadata?: Readonly<Record<string, unknown>>;
}): FundingSource | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  return upsertFunding({
    id: `fund:${randomUUID()}`,
    organizationId: input.organizationId,
    kind: input.kind,
    name: input.name,
    active: true,
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
  });
}

/** Seeds common education funding kinds as inactive-until-used presets. */
export function seedEducationFundingPresets(input: {
  organizationId: string;
  userId: string;
}): readonly FundingSource[] | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "financial_administrator",
  });
  if ("error" in gate) return gate;
  const existing = new Set(listFunding(input.organizationId).map((f) => f.kind));
  const created: FundingSource[] = [];
  for (const kind of EDUCATION_FUNDING_PRESETS) {
    if (existing.has(kind)) continue;
    created.push(
      upsertFunding({
        id: `fund:${randomUUID()}`,
        organizationId: input.organizationId,
        kind,
        name: kind.replace(/_/g, " "),
        active: true,
        metadata: Object.freeze({ preset: "education", configurable: true }),
      })
    );
  }
  return Object.freeze(created);
}

export { listFunding, EDUCATION_FUNDING_PRESETS };

import { newId, nowIso } from "../../ids";
import type { DimensionDefinition, DimensionTag, DimensionValue } from "../types";
import {
  listDimensionValues,
  listDimensions,
  listTags,
  upsertDimension,
  upsertDimensionValue,
  upsertTag,
} from "../store";

export function defineDimension(input: {
  organizationId: string;
  key: string;
  label: string;
}): DimensionDefinition {
  const key = input.key.trim().toLowerCase().replace(/\s+/g, "_");
  if (!key) throw new Error("dimension key required");
  const existing = listDimensions(input.organizationId).find((d) => d.key === key);
  if (existing) return existing;
  return upsertDimension({
    id: newId("dim"),
    organizationId: input.organizationId,
    key,
    label: input.label.trim() || key,
    active: true,
    createdAt: nowIso(),
  });
}

export function setDimensionValue(input: {
  organizationId: string;
  dimensionId: string;
  code: string;
  label: string;
}): DimensionValue {
  const dim = listDimensions(input.organizationId).find(
    (d) => d.id === input.dimensionId
  );
  if (!dim) throw new Error("dimension not found");
  const code = input.code.trim();
  if (!code) throw new Error("dimension value code required");
  const existing = listDimensionValues(input.organizationId, dim.id).find(
    (v) => v.code === code
  );
  if (existing) return existing;
  return upsertDimensionValue({
    id: newId("dimv"),
    organizationId: input.organizationId,
    dimensionId: dim.id,
    code,
    label: input.label.trim() || code,
    active: true,
    createdAt: nowIso(),
  });
}

export function tagRecord(input: {
  organizationId: string;
  recordType: string;
  recordId: string;
  dimensionKey: string;
  dimensionValueCode: string;
}): DimensionTag {
  const key = input.dimensionKey.trim().toLowerCase();
  const dim = listDimensions(input.organizationId).find((d) => d.key === key);
  if (!dim) throw new Error(`dimension not defined: ${key}`);
  const value = listDimensionValues(input.organizationId, dim.id).find(
    (v) => v.code === input.dimensionValueCode
  );
  if (!value) throw new Error(`dimension value not found: ${input.dimensionValueCode}`);
  return upsertTag({
    id: newId("dtag"),
    organizationId: input.organizationId,
    recordType: input.recordType,
    recordId: input.recordId,
    dimensionKey: key,
    dimensionValueCode: value.code,
    createdAt: nowIso(),
  });
}

/** Returns true when record matches all dimensionFilters (empty filters = match all). */
export function recordMatchesFilters(
  organizationId: string,
  recordType: string,
  recordId: string,
  filters: Readonly<Record<string, string>>
): boolean {
  const entries = Object.entries(filters);
  if (entries.length === 0) return true;
  const tags = listTags(organizationId, recordType, recordId);
  return entries.every(([key, code]) =>
    tags.some((t) => t.dimensionKey === key && t.dimensionValueCode === code)
  );
}

export { listDimensions, listDimensionValues, listTags };

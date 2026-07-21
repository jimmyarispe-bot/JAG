import type { ImportLookupContext, ImportRow } from "../../types";

function normalizePhone(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeEmail(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeAddress(mapped: Record<string, unknown>): string {
  return [
    mapped.address,
    mapped.city,
    mapped.state,
    mapped.zip,
  ]
    .map((v) => String(v ?? "").trim().toLowerCase())
    .join("|");
}

export function familyGroupKey(mapped: Record<string, unknown>): string | null {
  const email = normalizeEmail(mapped.parent_email as string);
  const phone = normalizePhone(mapped.parent_phone as string);
  const address = normalizeAddress(mapped);
  if (email) return `email:${email}`;
  if (phone && phone.length >= 7) return `phone:${phone}`;
  if (address !== "|||") return `address:${address}`;
  return null;
}

export function applyFamilyGrouping(rows: ImportRow[]): {
  rows: ImportRow[];
  familyGroupCount: number;
} {
  const groups = new Map<string, number>();
  const updated = rows.map((row) => {
    const key = familyGroupKey(row.mapped);
    if (key) {
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    return { ...row, familyGroupKey: key };
  });
  const multi = [...groups.values()].filter((n) => n > 1).length;
  return { rows: updated, familyGroupCount: multi };
}

export function findExistingFamily(
  mapped: Record<string, unknown>,
  ctx: ImportLookupContext,
  schoolId: string
): { familyId: string; guardianId?: string } | null {
  const email = normalizeEmail(mapped.parent_email as string);
  const phone = normalizePhone(mapped.parent_phone as string);
  const address = normalizeAddress(mapped);

  if (email) {
    const guardian = ctx.existingGuardians.find(
      (g) => normalizeEmail(g.email) === email
    );
    if (guardian) return { familyId: guardian.family_id, guardianId: guardian.id };

    const family = ctx.existingFamilies.find(
      (f) => f.school_id === schoolId && normalizeEmail(f.billing_email) === email
    );
    if (family) return { familyId: family.id };
  }

  if (phone && phone.length >= 7) {
    const guardian = ctx.existingGuardians.find(
      (g) => normalizePhone(g.phone) === phone
    );
    if (guardian) return { familyId: guardian.family_id, guardianId: guardian.id };

    const family = ctx.existingFamilies.find(
      (f) => f.school_id === schoolId && normalizePhone(f.billing_phone) === phone
    );
    if (family) return { familyId: family.id };
  }

  if (address !== "|||") {
    const family = ctx.existingFamilies.find((f) => {
      if (f.school_id !== schoolId) return false;
      const key = [
        f.primary_address,
        f.city,
        f.state,
        f.zip_code,
      ]
        .map((v) => String(v ?? "").trim().toLowerCase())
        .join("|");
      return key === address;
    });
    if (family) return { familyId: family.id };
  }

  return null;
}

export function splitParentName(parentName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const trimmed = String(parentName ?? "").trim();
  if (!trimmed) return { firstName: "Parent", lastName: "Guardian" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "Guardian" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

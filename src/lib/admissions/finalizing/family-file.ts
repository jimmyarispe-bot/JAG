/**
 * WHAT THE FAMILY GAVE US, ON THE FINALIZING CARD.
 *
 * Jimmy, 23 October 2026, on Alexandra Gallardo: "cannot see or click on his
 * scholarship. i have to be able to see this document myself, in addition to
 * relying on the jag to pull information/data from it". Her award letter was
 * uploaded on 18 September - as a photo, which the letter reader (PDF only)
 * cannot read - and nothing on Finalizing Contract showed it existed.
 *
 * And: "i need to be able to retrieve/see the parent's physical address and
 * resident address" - asked on the application from v43 (migration 587).
 */

type AnyClient = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export interface FamilyDocument {
  id: string;
  label: string;
  uploadedAt: string | null;
  /** Looks like an award letter or other scholarship paper. Listed first. */
  isScholarship: boolean;
}

export interface PostalAddress {
  street: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
}

export interface HomeAddress {
  home: PostalAddress | null;
  /** Null when the residence is the same as home, or not given. */
  residence: PostalAddress | null;
  residenceSameAsHome: boolean | null;
}

const SCHOLARSHIP_PATTERN = /scholar|award|step_up|funding|voucher|esa|gsns|special_needs/i;

function labelFor(type: string | null, fileName: string | null): string {
  const base = (type ?? "document")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return fileName ? `${base} (${fileName})` : base;
}

/** Every document the family uploaded, by lead. Scholarship papers first. */
export async function readFamilyDocuments(
  db: AnyClient,
  leadIds: readonly string[]
): Promise<Map<string, FamilyDocument[]>> {
  const byLead = new Map<string, FamilyDocument[]>();
  if (leadIds.length === 0) return byLead;
  const { data } = await db
    .from("application_documents")
    .select("id, lead_id, document_type, file_name, storage_path, created_at")
    .in("lead_id", leadIds as string[])
    .order("created_at", { ascending: false });
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    if (!row.storage_path) continue;
    const leadId = String(row.lead_id);
    const type = typeof row.document_type === "string" ? row.document_type : null;
    const fileName = typeof row.file_name === "string" ? row.file_name : null;
    const list = byLead.get(leadId) ?? [];
    list.push({
      id: String(row.id),
      label: labelFor(type, fileName),
      uploadedAt: typeof row.created_at === "string" ? row.created_at : null,
      isScholarship: SCHOLARSHIP_PATTERN.test(`${type ?? ""} ${fileName ?? ""}`),
    });
    byLead.set(leadId, list);
  }
  for (const list of byLead.values()) {
    list.sort((a, b) => Number(b.isScholarship) - Number(a.isScholarship));
  }
  return byLead;
}

const ADDRESS_KEYS = [
  "home_street", "home_line_2", "home_city", "home_state", "home_postal_code",
  "residence_same_as_home",
  "residence_street", "residence_line_2", "residence_city", "residence_state", "residence_postal_code",
] as const;

function s(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function addressFrom(get: (k: string) => unknown, prefix: "home" | "residence"): PostalAddress | null {
  const street = s(get(`${prefix}_street`));
  const city = s(get(`${prefix}_city`));
  const state = s(get(`${prefix}_state`));
  const postalCode = s(get(`${prefix}_postal_code`));
  if (!street && !city && !state && !postalCode) return null;
  return {
    street: street ?? "",
    line2: s(get(`${prefix}_line_2`)),
    city: city ?? "",
    state: state ?? "",
    postalCode: postalCode ?? "",
  };
}

/** The newest answers to the v43 address questions, by lead. */
export async function readHomeAddresses(
  db: AnyClient,
  leadIds: readonly string[]
): Promise<Map<string, HomeAddress>> {
  const out = new Map<string, HomeAddress>();
  if (leadIds.length === 0) return out;
  const { data: subs } = await db
    .from("admissions_interest_submissions")
    .select("id, lead_id, submitted_at")
    .in("lead_id", leadIds as string[])
    .order("submitted_at", { ascending: false });
  const subRows = (subs ?? []) as Array<{ id: string; lead_id: string }>;
  if (subRows.length === 0) return out;
  const rank = new Map(subRows.map((r, i) => [r.id, i]));
  const leadOf = new Map(subRows.map((r) => [r.id, String(r.lead_id)]));

  const { data: answers } = await db
    .from("admissions_interest_answers")
    .select("submission_id, question_key, value")
    .in("submission_id", subRows.map((r) => r.id))
    .in("question_key", ADDRESS_KEYS as unknown as string[]);

  const best = new Map<string, Map<string, { r: number; value: unknown }>>();
  for (const a of (answers ?? []) as Array<{ submission_id: string; question_key: string; value: unknown }>) {
    const leadId = leadOf.get(a.submission_id);
    if (!leadId) continue;
    const r = rank.get(a.submission_id) ?? 999;
    const forLead = best.get(leadId) ?? new Map();
    const prev = forLead.get(a.question_key);
    if (!prev || r < prev.r) forLead.set(a.question_key, { r, value: a.value });
    best.set(leadId, forLead);
  }

  for (const [leadId, forLead] of best) {
    const get = (k: string) => forLead.get(k)?.value;
    const same = s(get("residence_same_as_home"));
    out.set(leadId, {
      home: addressFrom(get, "home"),
      residence: same === "No" ? addressFrom(get, "residence") : null,
      residenceSameAsHome: same === "Yes" ? true : same === "No" ? false : null,
    });
  }
  return out;
}

export function formatAddress(a: PostalAddress): string {
  return [a.street, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.postalCode]
    .filter(Boolean)
    .join(" · ");
}

export const GUARDIAN_RELATIONSHIPS = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "parent", label: "Parent" },
  { value: "guardian", label: "Legal Guardian" },
  { value: "grandparent", label: "Grandparent" },
  { value: "foster_parent", label: "Foster Parent" },
  { value: "other", label: "Other" },
] as const;

export type GuardianRelationshipValue = (typeof GUARDIAN_RELATIONSHIPS)[number]["value"];

export const PREFERRED_CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "sms", label: "Text / SMS" },
  { value: "any", label: "Any method" },
] as const;

export type PreferredContactMethodValue = (typeof PREFERRED_CONTACT_METHODS)[number]["value"];

export type FamilyGuardianInput = {
  first_name: string;
  last_name: string;
  relationship: string;
  email?: string | null;
  phone?: string | null;
  is_primary?: boolean;
  is_emergency_contact?: boolean;
  preferred_contact_method?: string | null;
};

export function deriveFamilyName(primaryLastName: string, studentLastName?: string | null): string {
  const last = (primaryLastName || studentLastName || "Family").trim();
  if (!last) return "Family";
  if (/family$/i.test(last)) return last;
  return `${last} Family`;
}

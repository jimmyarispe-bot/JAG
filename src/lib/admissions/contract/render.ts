/**
 * Putting a family's own figures into the contract they sign.
 *
 * WHY THIS EXISTS. `enrollment_packet_templates.body_html` is static text, one
 * row per campus, and it is rendered to the family exactly as stored. Nothing
 * about the child, the plan or the money can reach it. That is why the tuition
 * template still reads, in its entirety, "I agree to the tuition and payment
 * schedule outlined by the school" - a sentence with no figure in it, which a
 * family can sign without agreeing to any particular sum.
 *
 * Jimmy, 28 September: the Schedule of Tuition Payments renders on the face of
 * the contract. The old text had the family upload a PDF the school had
 * emailed them, which is the manual process written into the document. A
 * schedule the software computes and the contract states is one fact; a
 * schedule emailed, uploaded and referred to is three copies of a fact.
 *
 * THE RULE THIS MODULE ENFORCES: NOTHING UNRESOLVED REACHES A FAMILY.
 *
 * A contract that prints `{{annual_tuition}}` is embarrassing. A contract that
 * prints nothing where the tuition should be is enforceable against the school
 * and not against the family. Both come from the same place - a renderer that
 * carries on when it does not know something. This one throws, and the message
 * names the placeholder and the template it is in.
 *
 * Unknown placeholders throw as well. A typo in a template is then caught the
 * first time anyone renders it, rather than by a parent reading `{{studnet_name}}`.
 */

import { formatUsd } from "@/lib/finance/plan-builder";

/** One row of the schedule as it appears on the contract. */
export interface ContractInstalment {
  readonly label: string;
  /** ISO date, or null for "Due Upon Signing Contract". */
  readonly dueDate: string | null;
  readonly amount: number;
}

/**
 * Everything a contract may refer to.
 *
 * Every field is required in the type so that a caller cannot forget one:
 * the ones that may legitimately be absent are `| null` and must be passed as
 * null deliberately. A field that is null and is used by the template throws,
 * unless it is listed in OPTIONAL_FIELDS below - "Parent/Guardian 2" is
 * genuinely optional; "annual tuition" is not.
 */
export interface ContractFields {
  readonly student_name: string;
  readonly student_birthdate: string | null;
  readonly student_grade: string | null;
  readonly school_year: string;

  readonly guardian_1_name: string;
  readonly guardian_2_name: string | null;

  /** "The Academy GA" - how a family refers to it. */
  readonly school_name: string;
  /** "The Academy GA, LLC. dba The Academy" - how the contract names it. */
  readonly school_legal_name: string;

  /** The full-year published figure, before anything is taken off. */
  readonly annual_tuition: number;
  /** The prorated figure, or null when the whole year applies. */
  readonly prorated_tuition: number | null;
  /** "8 of 10 months", or null. */
  readonly proration_label: string | null;
  /** What is actually billed from. */
  readonly billing_basis: number;
  readonly scholarship_total: number;
  /** What the family owes after everything. */
  readonly remaining_due: number;
  /** Month-to-month plans only. */
  readonly monthly_amount: number | null;

  /** 2.5% of the annual figure, stated so a family can choose. */
  readonly tuition_insurance_cost: number;

  readonly instalments: readonly ContractInstalment[];
}

/**
 * Fields a contract may legitimately render as blank.
 *
 * Everything else, if null, is a refusal. A second guardian may not exist; a
 * tuition figure always does, and a contract missing one is not a contract.
 */
const OPTIONAL_FIELDS: ReadonlySet<string> = new Set([
  "guardian_2_name",
  "student_birthdate",
  "student_grade",
  "proration_label",
  "prorated_tuition",
  "monthly_amount",
]);

/** A complete field set, used to enumerate what a contract may refer to. */
const SAMPLE_FIELDS: ContractFields = {
  student_name: "",
  student_birthdate: null,
  student_grade: null,
  school_year: "",
  guardian_1_name: "",
  guardian_2_name: null,
  school_name: "",
  school_legal_name: "",
  annual_tuition: 0,
  prorated_tuition: null,
  proration_label: null,
  billing_basis: 0,
  scholarship_total: 0,
  remaining_due: 0,
  monthly_amount: null,
  tuition_insurance_cost: 0,
  instalments: [],
};

/** Placeholders that expand to generated HTML rather than to a value. */
const BLOCKS: ReadonlySet<string> = new Set(["schedule_of_payments", "tuition_derivation"]);

const PLACEHOLDER = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 2026-10-25 -> "25 October 2026". Parsed as text: see school-year-months.ts. */
export function longDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthIndex = Number(m[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return iso;
  return `${Number(m[3])} ${months[monthIndex]} ${m[1]}`;
}

/**
 * The schedule, as a table on the contract.
 *
 * Zero-amount rows are kept. Every hand-built schedule in the folder lists the
 * months a family owes nothing, and dropping them makes the document look like
 * months were skipped - which is what a family notices and asks about.
 */
export function renderScheduleTable(instalments: readonly ContractInstalment[]): string {
  if (instalments.length === 0) {
    throw new Error(
      "The contract asks for the Schedule of Tuition Payments but the plan has no instalments. " +
        "A schedule with no rows is not a schedule; build the plan before sending the contract."
    );
  }

  const rows = instalments
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.label)}</td>` +
        `<td>${i.dueDate ? escapeHtml(longDate(i.dueDate)) : "Upon signing"}</td>` +
        `<td style="text-align:right">${escapeHtml(formatUsd(i.amount))}</td></tr>`
    )
    .join("");

  const total = instalments.reduce((sum, i) => sum + i.amount, 0);

  return (
    `<table class="contract-schedule">` +
    `<thead><tr><th>Payment</th><th>Due</th><th style="text-align:right">Amount</th></tr></thead>` +
    `<tbody>${rows}</tbody>` +
    `<tfoot><tr><th>Total</th><th></th>` +
    `<th style="text-align:right">${escapeHtml(formatUsd(total))}</th></tr></tfoot>` +
    `</table>`
  );
}

/**
 * How the figure was arrived at, on the face of the contract.
 *
 * Jimmy chose this on 27 September over stating the net figure alone: a family
 * that sees only what they owe cannot check it, and a family that later
 * disputes it has nothing to check it against. Published tuition, proration if
 * any, scholarships, what is left.
 */
export function renderDerivation(f: ContractFields): string {
  const lines: string[] = [
    `<tr><td>Published annual tuition</td>` +
      `<td style="text-align:right">${escapeHtml(formatUsd(f.annual_tuition))}</td></tr>`,
  ];

  if (f.prorated_tuition !== null && f.proration_label) {
    lines.push(
      `<tr><td>Prorated — ${escapeHtml(f.proration_label)}</td>` +
        `<td style="text-align:right">${escapeHtml(formatUsd(f.prorated_tuition))}</td></tr>`
    );
  }

  if (f.scholarship_total > 0) {
    lines.push(
      `<tr><td>Less scholarships</td>` +
        `<td style="text-align:right">−${escapeHtml(formatUsd(f.scholarship_total))}</td></tr>`
    );
  }

  lines.push(
    `<tr><th>Your responsibility</th>` +
      `<th style="text-align:right">${escapeHtml(formatUsd(f.remaining_due))}</th></tr>`
  );

  return `<table class="contract-derivation"><tbody>${lines.join("")}</tbody></table>`;
}

function valueFor(name: string, f: ContractFields): string {
  switch (name) {
    case "student_name":
      return escapeHtml(f.student_name);
    case "student_birthdate":
      return f.student_birthdate ? escapeHtml(longDate(f.student_birthdate)) : "";
    case "student_grade":
      return f.student_grade ? escapeHtml(f.student_grade) : "";
    case "school_year":
      return escapeHtml(f.school_year);
    case "guardian_1_name":
      return escapeHtml(f.guardian_1_name);
    case "guardian_2_name":
      return f.guardian_2_name ? escapeHtml(f.guardian_2_name) : "";
    case "school_name":
      return escapeHtml(f.school_name);
    case "school_legal_name":
      return escapeHtml(f.school_legal_name);
    case "annual_tuition":
      return escapeHtml(formatUsd(f.annual_tuition));
    case "prorated_tuition":
      return f.prorated_tuition === null ? "" : escapeHtml(formatUsd(f.prorated_tuition));
    case "proration_label":
      return f.proration_label ? escapeHtml(f.proration_label) : "";
    case "billing_basis":
      return escapeHtml(formatUsd(f.billing_basis));
    case "scholarship_total":
      return escapeHtml(formatUsd(f.scholarship_total));
    case "remaining_due":
      return escapeHtml(formatUsd(f.remaining_due));
    case "monthly_amount":
      return f.monthly_amount === null ? "" : escapeHtml(formatUsd(f.monthly_amount));
    case "tuition_insurance_cost":
      return escapeHtml(formatUsd(f.tuition_insurance_cost));
    default:
      throw new Error(`unknown placeholder ${name}`);
  }
}

function isMissing(name: string, f: ContractFields): boolean {
  const record = f as unknown as Record<string, unknown>;
  const v = record[name];
  return v === null || v === undefined || v === "";
}

export interface RenderOptions {
  /** Named in every error, so a bad template is identifiable without guessing. */
  readonly templateKey: string;
}

/**
 * Render one template against one family's figures.
 *
 * Throws, naming the template and the placeholder, when:
 *   - the placeholder is not one this module knows (a typo in the template)
 *   - the value is required and absent (a figure nobody has decided)
 *   - the schedule is asked for and the plan has no instalments
 *
 * It never substitutes a blank, a zero or the placeholder's own text for a
 * figure it does not have.
 */
export function renderContractTemplate(
  bodyHtml: string,
  fields: ContractFields,
  options: RenderOptions
): string {
  const where = `template "${options.templateKey}"`;

  return bodyHtml.replace(PLACEHOLDER, (_match, rawName: string) => {
    const name = rawName.toLowerCase();

    if (name === "schedule_of_payments") return renderScheduleTable(fields.instalments);
    if (name === "tuition_derivation") return renderDerivation(fields);

    let rendered: string;
    try {
      rendered = valueFor(name, fields);
    } catch {
      throw new Error(
        `${where} uses {{${rawName}}}, which is not a field a contract can fill. ` +
          `Check the spelling against ContractFields, or add the field there first.`
      );
    }

    if (rendered === "" && !OPTIONAL_FIELDS.has(name) && isMissing(name, fields)) {
      throw new Error(
        `${where} needs ${name}, and this plan has no value for it. ` +
          `Refusing to render a contract with a blank where a figure belongs.`
      );
    }

    return rendered;
  });
}

/**
 * Every placeholder a template uses, for checking a template before it is
 * saved rather than when a family opens it.
 */
export function placeholdersIn(bodyHtml: string): string[] {
  const found = new Set<string>();
  for (const m of bodyHtml.matchAll(PLACEHOLDER)) {
    found.add(m[1].toLowerCase());
  }
  return Array.from(found).sort();
}

/**
 * Placeholders in a template that this module cannot fill.
 *
 * Empty means the template is renderable. Anything returned is a typo or a
 * field that has to be added to ContractFields - and it is better found when
 * the template is written than when a contract is sent.
 */
export function unfillablePlaceholders(bodyHtml: string): string[] {
  const known = new Set<string>([...BLOCKS]);
  const sample = SAMPLE_FIELDS;
  for (const key of Object.keys(sample)) {
    if (key !== "instalments") known.add(key);
  }
  return placeholdersIn(bodyHtml).filter((p) => !known.has(p));
}

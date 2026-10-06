/**
 * The background check intake, and the one email it produces.
 *
 * Jimmy, 6 October 2026: "i need the results of this form to be sent to me in
 * an email. not the form itself just the answers in the email. also need a url
 * to send to staff to complete this form."
 *
 * So: a public form at /background-check, one row written, one email to Jimmy
 * and Danni carrying the answers as text. No template, no queue, no chase.
 * This is not an admissions letter and it has no business in that engine.
 *
 * ── THE FULL SSN IS IN THE EMAIL AND NOWHERE ELSE ───────────────────────────
 *
 * The Clearinghouse needs nine digits. Jimmy needs to read them and type them
 * into crw.flclearinghouse.com. Neither of those requires the platform to KEEP
 * them, and this table would keep them forever. So the row stores ssn_last4 -
 * the same four the Clearinghouse itself shows as XXX-XX-2907 - and the full
 * value exists only in the message. Migration 510 has no column for it.
 *
 * WHO GETS IT. NETWORK_ESCALATION_EMAILS, which is already Jimmy and Danni and
 * is the same pair the 72-hour admissions escalation goes to. Not a new
 * constant: "only danni n me see anything related to money" is the same rule,
 * and a staff member's date of birth is held to it.
 *
 * NO `import "server-only"`. Adding it to email/divert.ts on 3 October failed
 * a Vercel build in eight seconds, because the validation gates run under tsx
 * where that alias does not exist.
 */

import { randomUUID } from "node:crypto";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/platform/email/send";
import { NETWORK_ESCALATION_EMAILS } from "@/lib/admissions/communications/network-office";
import {
  EYE_COLOR_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HEIGHT_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
  RACE_OPTIONS,
  SEX_OPTIONS,
  US_STATES,
} from "@/lib/employees/background-check-options";

type Row = Record<string, unknown>;
type Answer<T> = PromiseLike<{ data: T; error: { message: string } | null }>;

interface Query {
  insert: (row: Row) => Query & Answer<Row[] | null>;
  update: (row: Row) => Query & Answer<null>;
  select: (columns: string) => Query & Answer<Row[] | null>;
  eq: (column: string, value: string) => Query & Answer<null>;
  single: () => Answer<Row | null>;
}

interface UntypedAdmin {
  from: (table: string) => Query;
}

/** src/types/database.ts predates this table by three months. */
function admin(): UntypedAdmin {
  return createServiceRoleClient() as unknown as UntypedAdmin;
}

/* ───────────────────── the signed acknowledgement ────────────────────── */

/**
 * THE BLANK FORM AND THE BUCKET IT COMES BACK TO.
 *
 * The blank Clearinghouse Privacy Policy Acknowledgement is the same document
 * for every hire, so it is a static asset. Only the SIGNED copy is
 * per-person, and only the signed copy is stored - in a private bucket, at a
 * path keyed by the row it belongs to.
 */
export const PRIVACY_ACK_BLANK_URL = "/privacy-policy-acknowledgement.pdf";
export const PRIVACY_ACK_BUCKET = "employee-documents";

/** The bucket enforces 10MB too; this refuses first, with our own wording. */
const PRIVACY_ACK_MAX_BYTES = 10 * 1024 * 1024;

/**
 * A signed sheet arrives as a scan or as a phone photograph. Refusing the
 * photograph would mean a new hire with a pen and a phone cannot finish.
 */
const PRIVACY_ACK_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

interface StorageBucket {
  upload: (
    path: string,
    body: ArrayBuffer | Uint8Array,
    options: { contentType: string; upsert: boolean }
  ) => PromiseLike<{ error: { message: string } | null }>;
}

interface StorageClient {
  storage: { from: (bucket: string) => StorageBucket };
}

function storage(): StorageClient {
  return createServiceRoleClient() as unknown as StorageClient;
}

export function readAcknowledgement(form: FormData): File | null {
  const entry = form.get("privacyAck");
  if (!entry || typeof entry === "string") return null;
  return entry.size > 0 ? entry : null;
}

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/* ─────────────────────────────── the shape ─────────────────────────────── */

export interface BackgroundCheckSubmission {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  aliases: string;
  /** Nine digits, no punctuation. Never persisted. */
  ssn: string;
  dateOfBirth: string;
  placeOfBirth: string;
  mailingAddress: string;
  aptUnitSuite: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  emailAddress: string;
  sex: string;
  race: string;
  hairColor: string;
  eyeColor: string;
  height: string;
}

export function readSubmission(form: FormData): BackgroundCheckSubmission {
  return {
    firstName: text(form.get("firstName")),
    middleName: text(form.get("middleName")),
    lastName: text(form.get("lastName")),
    suffix: text(form.get("suffix")),
    aliases: text(form.get("aliases")),
    ssn: text(form.get("ssn")).replace(/\D/g, ""),
    dateOfBirth: text(form.get("dateOfBirth")),
    placeOfBirth: text(form.get("placeOfBirth")),
    mailingAddress: text(form.get("mailingAddress")),
    aptUnitSuite: text(form.get("aptUnitSuite")),
    city: text(form.get("city")),
    state: text(form.get("state")),
    zipCode: text(form.get("zipCode")),
    phoneNumber: text(form.get("phoneNumber")),
    emailAddress: text(form.get("emailAddress")),
    sex: text(form.get("sex")),
    race: text(form.get("race")),
    hairColor: text(form.get("hairColor")),
    eyeColor: text(form.get("eyeColor")),
    height: text(form.get("height")),
  };
}

/* ─────────────────────────────── validation ────────────────────────────── */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Every message here is addressed to the person filling the form in, not to a
 * developer. They are a new hire on their first day and a validation error is
 * the first thing the school has ever said to them.
 */
export function validate(
  input: BackgroundCheckSubmission,
  acknowledgement: File | null
): string[] {
  const problems: string[] = [];

  /*
   * THE SIGNED FORM IS CHECKED FIRST, BECAUSE IT IS THE ONE THEY MIGHT MISS.
   *
   * Jimmy, 6 October: "they cannot submit the form without uploading this
   * signed and dated". Every other field is on the screen in front of them;
   * this one needs downloading, printing or annotating, signing and sending
   * back, so it is the single most likely thing to be left undone - and the
   * screening cannot proceed without it.
   */
  if (!acknowledgement) {
    problems.push(
      "Please attach your signed Privacy Policy Acknowledgement. Download it from the link on this page, sign and date it, then upload it here."
    );
  } else if (!PRIVACY_ACK_TYPES[acknowledgement.type]) {
    problems.push(
      "Please attach the signed form as a PDF or a photo (JPG, PNG, WEBP or HEIC)."
    );
  } else if (acknowledgement.size > PRIVACY_ACK_MAX_BYTES) {
    problems.push(
      "That file is larger than 10 MB. A photo of each signed page, or a black-and-white scan, will be small enough."
    );
  }

  if (!input.firstName) problems.push("Please enter your first name.");
  if (!input.lastName) problems.push("Please enter your last name.");

  if (input.ssn.length !== 9) {
    problems.push("Please enter your Social Security Number as nine digits.");
  }

  if (!input.dateOfBirth) {
    problems.push("Please enter your date of birth.");
  } else {
    const dob = new Date(`${input.dateOfBirth}T00:00:00`);
    if (Number.isNaN(dob.getTime())) {
      problems.push("That date of birth is not a date we can read.");
    } else if (dob > new Date()) {
      problems.push("That date of birth is in the future.");
    } else if (new Date().getFullYear() - dob.getFullYear() > 120) {
      problems.push("Please check the year on your date of birth.");
    }
  }

  const inList = (value: string, list: readonly string[]) => list.includes(value);

  if (!inList(input.placeOfBirth, PLACE_OF_BIRTH_OPTIONS.map((o) => o.value))) {
    problems.push("Please choose your place of birth.");
  }
  if (!input.mailingAddress) problems.push("Please enter your mailing address.");
  if (!input.city) problems.push("Please enter your city.");
  if (!inList(input.state, US_STATES.map((o) => o.value))) {
    problems.push("Please choose your state.");
  }
  if (!/^\d{5}(-\d{4})?$/.test(input.zipCode)) {
    problems.push("Please enter your ZIP code as 5 digits.");
  }
  if (input.phoneNumber.replace(/\D/g, "").length < 10) {
    problems.push("Please enter a phone number with at least 10 digits.");
  }
  if (!EMAIL_PATTERN.test(input.emailAddress)) {
    problems.push("Please enter an email address we can reach you at.");
  }

  if (!inList(input.sex, SEX_OPTIONS)) problems.push("Please choose sex.");
  if (!inList(input.race, RACE_OPTIONS)) problems.push("Please choose race.");
  if (!inList(input.hairColor, HAIR_COLOR_OPTIONS)) {
    problems.push("Please choose hair color.");
  }
  if (!inList(input.eyeColor, EYE_COLOR_OPTIONS)) {
    problems.push("Please choose eye color.");
  }
  if (!inList(input.height, HEIGHT_OPTIONS)) problems.push("Please choose height.");

  return problems;
}

/* ───────────────────────────────── the email ───────────────────────────── */

function labelFor(value: string, list: readonly { value: string; label: string }[]) {
  return list.find((o) => o.value === value)?.label ?? value;
}

function spokenDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * THE ANSWERS, IN THE ORDER THE CLEARINGHOUSE ASKS FOR THEM.
 *
 * Jimmy reads this with crw.flclearinghouse.com/Person/Create open beside it,
 * so the order is theirs, not ours, and an optional field left blank still
 * gets a line. A missing line would make him wonder whether it was asked.
 */
export function composeEmail(
  input: BackgroundCheckSubmission,
  acknowledgement: string | null
): {
  subject: string;
  body: string;
} {
  const fullName = [input.firstName, input.middleName, input.lastName, input.suffix]
    .filter(Boolean)
    .join(" ");

  const ssnFormatted = `${input.ssn.slice(0, 3)}-${input.ssn.slice(3, 5)}-${input.ssn.slice(5)}`;
  const blank = "(not provided)";

  const lines = [
    `${fullName} completed the background screening form.`,
    "",
    "Enter these into the Florida Clearinghouse at",
    "https://crw.flclearinghouse.com/Person/Create",
    "",
    "────────────────────────────────────────",
    "NAME",
    `First Name:        ${input.firstName}`,
    `Middle Name:       ${input.middleName || blank}`,
    `Last Name:         ${input.lastName}`,
    `Suffix:            ${input.suffix || blank}`,
    `Aliases:           ${input.aliases || blank}`,
    "",
    "IDENTITY",
    `SSN:               ${ssnFormatted}`,
    `Date of Birth:     ${spokenDate(input.dateOfBirth)}`,
    `Place of Birth:    ${labelFor(input.placeOfBirth, PLACE_OF_BIRTH_OPTIONS)}`,
    "",
    "ADDRESS",
    `Mailing Address:   ${input.mailingAddress}`,
    `Apt/Unit/Suite:    ${input.aptUnitSuite || blank}`,
    `City:              ${input.city}`,
    `State:             ${labelFor(input.state, US_STATES)}`,
    `Zip Code:          ${input.zipCode}`,
    "",
    "CONTACT",
    `Phone Number:      ${input.phoneNumber}`,
    `Email Address:     ${input.emailAddress}`,
    "",
    "DESCRIPTION",
    `Sex:               ${input.sex}`,
    `Race:              ${input.race}`,
    `Hair Color:        ${input.hairColor}`,
    `Eye Color:         ${input.eyeColor}`,
    `Height:            ${input.height}`,
    "",
    "SIGNED PRIVACY ACKNOWLEDGEMENT",
    acknowledgement
      ? `Received: ${acknowledgement}`
      : "*** NOT RECEIVED - the screening cannot proceed ***",
    "Stored in The JAG against this person's record, in the private",
    "employee-documents bucket. It is not attached to this email.",
    "────────────────────────────────────────",
    "",
    "The platform has kept only the last four digits of the SSN. The nine",
    "digits above exist in this email and nowhere else, so do not delete it",
    "until the screening is entered.",
  ];

  return {
    subject: `Background screening — ${fullName}`,
    body: lines.join("\n"),
  };
}

/* ──────────────────────────────── the submit ───────────────────────────── */

export async function submitBackgroundCheck(
  input: BackgroundCheckSubmission,
  acknowledgement: File | null
): Promise<{ ok: true } | { problems: string[] }> {
  const problems = validate(input, acknowledgement);
  if (problems.length) return { problems };

  const db = admin();

  /*
   * THE DOCUMENT GOES UP BEFORE THE ROW GOES IN.
   *
   * The row id is generated here rather than by the database so the storage
   * path can be keyed to it, which means no row ever exists without its
   * signed form: if the upload fails, nothing is written and the hire is
   * asked to try again. The other order leaves a record that claims a
   * screening is ready when the document behind it is missing.
   *
   * A failed insert after a good upload leaves one orphan file named by a
   * uuid. That is harmless and traceable, and it is the right way round.
   */
  const rowId = randomUUID();
  const file = acknowledgement as File;
  const extension = PRIVACY_ACK_TYPES[file.type] ?? "pdf";
  const storagePath = `${rowId}/privacy-policy-acknowledgement.${extension}`;

  const { error: uploadError } = await storage()
    .storage.from(PRIVACY_ACK_BUCKET)
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[background-check] upload failed:", uploadError.message);
    return {
      problems: [
        "Your signed form did not upload. Please try once more, and if it fails again tell the person who sent you this link.",
      ],
    };
  }

  /*
   * THE ROW IS WRITTEN BEFORE THE EMAIL IS SENT, AND ON PURPOSE.
   *
   * If Resend is down, the answers still exist and the row says the
   * notification failed. The other order loses a new hire's submission to an
   * outage and asks them to type their SSN in again.
   */
  const { data: inserted, error: insertError } = await db
    .from("employee_background_checks")
    .insert({
      id: rowId,
      first_name: input.firstName,
      middle_name: input.middleName || null,
      last_name: input.lastName,
      suffix: input.suffix || null,
      aliases: input.aliases || null,
      ssn_last4: input.ssn.slice(-4),
      date_of_birth: input.dateOfBirth,
      place_of_birth: input.placeOfBirth,
      mailing_address: input.mailingAddress,
      apt_unit_suite: input.aptUnitSuite || null,
      city: input.city,
      state: input.state,
      zip_code: input.zipCode,
      phone_number: input.phoneNumber,
      email_address: input.emailAddress,
      sex: input.sex,
      race: input.race,
      hair_color: input.hairColor,
      eye_color: input.eyeColor,
      height: input.height,
      privacy_ack_path: storagePath,
      privacy_ack_filename: file.name,
      privacy_ack_bytes: file.size,
      privacy_ack_content_type: file.type,
      privacy_ack_uploaded_at: new Date().toISOString(),
    })
    .select("id");

  if (insertError) {
    console.error("[background-check] insert failed:", insertError.message);
    return {
      problems: [
        "Something went wrong saving your answers. Please try once more, and if it fails again tell the person who sent you this link.",
      ],
    };
  }

  void inserted;
  const { subject, body } = composeEmail(
    input,
    `${file.name} (${Math.round(file.size / 1024)} KB) — ${PRIVACY_ACK_BUCKET}/${storagePath}`
  );

  let sendError: string | null = null;
  try {
    const result = await sendTransactionalEmail({
      to: [...NETWORK_ESCALATION_EMAILS],
      subject,
      body,
      text: body,
      kind: "system_notification",
    });
    if (!result.success) sendError = result.error ?? "unknown send failure";
  } catch (caught) {
    sendError = caught instanceof Error ? caught.message : String(caught);
  }

  if (rowId) {
    await db
      .from("employee_background_checks")
      .update(
        sendError
          ? { notify_error: sendError }
          : { notified_at: new Date().toISOString(), notify_error: null }
      )
      .eq("id", rowId);
  }

  /*
   * A FAILED NOTIFICATION IS NOT THE NEW HIRE'S PROBLEM.
   *
   * Their answers are saved and notify_error records what happened. Telling
   * them to try again would have them re-enter an SSN to fix something on our
   * side, and a second row with the same nine digits in a second email is
   * worse than one row nobody was told about.
   */
  if (sendError) {
    console.error("[background-check] notification failed:", sendError);
  }

  return { ok: true };
}

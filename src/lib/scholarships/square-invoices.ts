import type { SupabaseClient } from "@supabase/supabase-js";

import { squarePost } from "@/lib/connectors/square/client";

import { easternToday } from "./gsns";
import { statePaymentSchedule } from "./state-payments";

/**
 * SQUARE INVOICES FOR STATE SCHOLARSHIP PAYMENTS.
 *
 * Jimmy, 20 October 2026: "even for scholarship payment in any state, let's
 * create square invoices for these. and when we receive the payment from the
 * state we will mark them as paid via state scholarship. for better record
 * keeping"
 *
 * Decided the same evening: records only, one invoice per state payment,
 * created when the tuition plan is marked final.
 *
 * RECORDS ONLY. delivery_method SHARE_MANUALLY: Square sends the family
 * nothing. No reminders are set, because Square emails reminders even on a
 * manually shared invoice.
 *
 * PAID IS MARKED IN SQUARE BY JIMMY. Square: "Square APIs cannot be used to
 * pay invoices or set invoice status." The JAG records the state's payment
 * and links straight to the invoice for the one tap.
 *
 * RESUMABLE. Each Square id is saved as soon as Square returns it, and every
 * request carries an idempotency key built from the row, so running it again
 * after a failure finishes the job instead of making a second invoice.
 */

// Untyped: scholarship_invoices (migration 573) is hand-run and not in the
// generated types.
type AnyClient = SupabaseClient;

export function squareInvoiceDashboardUrl(invoiceId: string): string {
  return `https://app.squareup.com/dashboard/invoices/${invoiceId}`;
}

interface InvoiceRow {
  id: string;
  award_id: string;
  student_id: string;
  school_id: string;
  sequence: number;
  label: string;
  due_date: string;
  amount: number | string;
  status: string;
  square_location_id: string | null;
  square_customer_id: string | null;
  square_order_id: string | null;
  square_invoice_id: string | null;
}

export interface InvoiceRunResult {
  created: number;
  failed: number;
  errors: string[];
}

/**
 * Makes the rows for every awarded scholarship on this student, then pushes
 * each unfinished one to Square.
 */
export async function createScholarshipInvoices(
  supabase: AnyClient,
  input: { studentId: string; planId: string | null }
): Promise<InvoiceRunResult | { error: string }> {
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, first_name, last_name, school_id, admissions_lead_id, schools(name, square_location_id)")
    .eq("id", input.studentId)
    .maybeSingle();
  if (studentError) return { error: studentError.message };
  if (!student) return { error: "Student not found." };
  const s = student as unknown as {
    first_name: string | null;
    last_name: string | null;
    school_id: string;
    admissions_lead_id: string | null;
    schools: { name: string | null; square_location_id: string | null } | null;
  };
  const locationId = s.schools?.square_location_id?.trim() || null;
  if (!locationId) return { error: `${s.schools?.name ?? "This campus"} has no Square location recorded.` };

  const { data: awards, error: awardsError } = await supabase
    .from("scholarship_awards")
    .select("id, program_code, program_name, award_year, awarded_amount, award_percent, status")
    .eq("student_id", input.studentId)
    .eq("status", "awarded");
  if (awardsError) return { error: awardsError.message };

  const codes = [...new Set((awards ?? []).map((a) => a.program_code).filter(Boolean))] as string[];
  const scheduleByCode = new Map<string, string | null>();
  if (codes.length > 0) {
    const { data: catalog } = await supabase
      .from("funding_program_catalog")
      .select("program_code, payment_schedule")
      .in("program_code", codes);
    for (const c of catalog ?? []) scheduleByCode.set(c.program_code as string, (c.payment_schedule as string) ?? null);
  }

  // Rows first. An award that already has rows keeps them - the schedule is
  // not silently rewritten under invoices that already exist in Square.
  for (const a of awards ?? []) {
    const { count } = await supabase
      .from("scholarship_invoices")
      .select("id", { count: "exact", head: true })
      .eq("award_id", a.id as string)
      .neq("status", "cancelled");
    if ((count ?? 0) > 0) continue;
    const schedule = statePaymentSchedule({
      programCode: (a.program_code as string | null) ?? null,
      programName: a.program_name as string,
      awardYear: a.award_year as string,
      awardedAmount: Number(a.awarded_amount ?? 0),
      awardPercent: a.award_percent === null || a.award_percent === undefined ? null : Number(a.award_percent),
      paymentSchedule: scheduleByCode.get(a.program_code as string) ?? null,
    });
    if (schedule.length === 0) continue;
    const { error } = await supabase.from("scholarship_invoices").insert(
      schedule.map((p) => ({
        award_id: a.id,
        plan_id: input.planId,
        student_id: input.studentId,
        school_id: s.school_id,
        sequence: p.sequence,
        label: p.estimated ? `${p.label} (dates estimated)` : p.label,
        due_date: p.dueDate,
        amount: p.amount,
        square_location_id: locationId,
      }))
    );
    if (error) return { error: error.message };
  }

  const { data: rows, error: rowsError } = await supabase
    .from("scholarship_invoices")
    .select(
      "id, award_id, student_id, school_id, sequence, label, due_date, amount, status, square_location_id, square_customer_id, square_order_id, square_invoice_id"
    )
    .eq("student_id", input.studentId)
    .in("status", ["pending", "error"])
    .order("due_date", { ascending: true });
  if (rowsError) return { error: rowsError.message };

  const result: InvoiceRunResult = { created: 0, failed: 0, errors: [] };
  if (!rows || rows.length === 0) return result;

  const customer = await ensureCustomer(supabase, s, input.studentId);
  if ("error" in customer) {
    await supabase
      .from("scholarship_invoices")
      .update({ status: "error", last_error: customer.error })
      .in("id", rows.map((r) => r.id as string));
    return { created: 0, failed: rows.length, errors: [customer.error] };
  }

  const childName = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
  for (const row of rows as InvoiceRow[]) {
    const outcome = await pushOne(supabase, row, {
      customerId: customer.customerId,
      locationId: row.square_location_id ?? locationId,
      childName,
    });
    if ("error" in outcome) {
      result.failed += 1;
      result.errors.push(`${row.label}: ${outcome.error}`);
      await supabase.from("scholarship_invoices").update({ status: "error", last_error: outcome.error }).eq("id", row.id);
    } else {
      result.created += 1;
    }
  }
  return result;
}

export async function ensureCustomer(
  supabase: AnyClient,
  s: { first_name: string | null; last_name: string | null; admissions_lead_id: string | null },
  studentId: string
): Promise<{ customerId: string } | { error: string }> {
  // The parent on the lead is the invoice's recipient, as Square requires one.
  let given = "";
  let family = "";
  let email: string | null = null;
  if (s.admissions_lead_id) {
    const { data: lead } = await supabase
      .from("admissions_leads")
      .select("guardian_first_name, guardian_last_name, guardian_email")
      .eq("id", s.admissions_lead_id)
      .maybeSingle();
    given = ((lead?.guardian_first_name as string | null) ?? "").trim();
    family = ((lead?.guardian_last_name as string | null) ?? "").trim();
    email = ((lead?.guardian_email as string | null) ?? "").trim().toLowerCase() || null;
  }
  if (!given && !family) {
    given = s.first_name ?? "";
    family = `${s.last_name ?? ""} (family)`.trim();
  }

  if (email) {
    const found = await squarePost("/v2/customers/search", {
      limit: 1,
      query: { filter: { email_address: { exact: email } } },
    });
    if (!found.ok) return { error: `Square customer search failed: ${found.error}` };
    const id = (found.data as { customers?: { id: string }[] }).customers?.[0]?.id;
    if (id) return { customerId: id };
  }

  const created = await squarePost("/v2/customers", {
    idempotency_key: `jag-cust-${studentId}`,
    given_name: given || undefined,
    family_name: family || undefined,
    email_address: email ?? undefined,
    reference_id: studentId,
    note: "Created by the JAG for state scholarship invoices.",
  });
  if (!created.ok) return { error: `Square could not create the customer: ${created.error}` };
  const id = (created.data as { customer?: { id: string } }).customer?.id;
  return id ? { customerId: id } : { error: "Square returned no customer id." };
}

async function pushOne(
  supabase: AnyClient,
  row: InvoiceRow,
  ctx: { customerId: string; locationId: string; childName: string }
): Promise<{ ok: true } | { error: string }> {
  const amountCents = Math.round(Number(row.amount) * 100);
  const today = easternToday();
  // Square refuses a due date in the past; a payment already due is due today.
  const dueDate = row.due_date < today ? today : row.due_date;

  let orderId = row.square_order_id;
  if (!orderId) {
    const order = await squarePost("/v2/orders", {
      idempotency_key: `jag-si-${row.id}-order`,
      order: {
        location_id: ctx.locationId,
        customer_id: ctx.customerId,
        reference_id: row.id,
        line_items: [
          {
            name: `${row.label} — ${ctx.childName}`.slice(0, 500),
            quantity: "1",
            base_price_money: { amount: amountCents, currency: "USD" },
            note: "Paid by the state scholarship program. Not billed to the family.",
          },
        ],
      },
    });
    if (!order.ok) return { error: `Square order: ${order.error}` };
    orderId = (order.data as { order?: { id: string } }).order?.id ?? null;
    if (!orderId) return { error: "Square returned no order id." };
    await supabase
      .from("scholarship_invoices")
      .update({ square_order_id: orderId, square_customer_id: ctx.customerId })
      .eq("id", row.id);
  }

  let invoiceId = row.square_invoice_id;
  let version = 0;
  if (!invoiceId) {
    const invoice = await squarePost("/v2/invoices", {
      idempotency_key: `jag-si-${row.id}-invoice`,
      invoice: {
        location_id: ctx.locationId,
        order_id: orderId,
        primary_recipient: { customer_id: ctx.customerId },
        payment_requests: [{ request_type: "BALANCE", due_date: dueDate }],
        delivery_method: "SHARE_MANUALLY",
        // Square requires one method on. Never offered: the invoice is not sent.
        accepted_payment_methods: {
          bank_account: true,
          card: false,
          square_gift_card: false,
          buy_now_pay_later: false,
          cash_app_pay: false,
        },
        title: `State scholarship — ${ctx.childName}`.slice(0, 255),
        description:
          `${row.label}. Paid by the state, not the family. Records only - mark paid ` +
          `"Other: State scholarship" when the state's payment arrives.`,
      },
    });
    if (!invoice.ok) return { error: `Square invoice: ${invoice.error}` };
    const inv = (invoice.data as { invoice?: { id: string; version?: number; invoice_number?: string } }).invoice;
    if (!inv?.id) return { error: "Square returned no invoice id." };
    invoiceId = inv.id;
    version = inv.version ?? 0;
    await supabase
      .from("scholarship_invoices")
      .update({ square_invoice_id: invoiceId, square_invoice_number: inv.invoice_number ?? null })
      .eq("id", row.id);
  } else {
    // Created before but not published: read its version.
    const { squareGet } = await import("@/lib/connectors/square/client");
    const read = await squareGet(`/v2/invoices/${invoiceId}`);
    if (!read.ok) return { error: `Square invoice read: ${read.error}` };
    const inv = (read.data as { invoice?: { version?: number; status?: string; invoice_number?: string } }).invoice;
    if (inv?.status && inv.status !== "DRAFT") {
      await supabase
        .from("scholarship_invoices")
        .update({ status: "open", last_error: null, square_invoice_number: inv.invoice_number ?? null })
        .eq("id", row.id);
      return { ok: true };
    }
    version = inv?.version ?? 0;
  }

  const published = await squarePost(`/v2/invoices/${invoiceId}/publish`, {
    version,
    idempotency_key: `jag-si-${row.id}-publish-${version}`,
  });
  if (!published.ok) return { error: `Square publish: ${published.error}` };
  const pub = (published.data as { invoice?: { invoice_number?: string } }).invoice;
  await supabase
    .from("scholarship_invoices")
    .update({ status: "open", last_error: null, square_invoice_number: pub?.invoice_number ?? null })
    .eq("id", row.id);
  return { ok: true };
}

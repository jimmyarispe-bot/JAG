import type { SupabaseClient } from "@supabase/supabase-js";

import { squareGet, squarePost } from "@/lib/connectors/square/client";
import { easternToday } from "@/lib/scholarships/gsns";
import { ensureCustomer } from "@/lib/scholarships/square-invoices";

/**
 * THE FIRST TUITION PAYMENT, INVOICED BY SQUARE THE MOMENT THE CONTRACT IS SIGNED.
 *
 * The contract letter has always said "Once it is signed, you will receive an
 * invoice for your first tuition payment." Until 20 October 2026 nothing sent
 * it. Jimmy, tapped that evening: "Square invoice, emailed".
 *
 * Square emails the parent (delivery_method EMAIL) and takes card or bank
 * payment. Recording the payment in the JAG stays as it is - Jimmy records it
 * on Finalizing Contract, which enrolls the child.
 *
 * NEVER THROWS, never blocks the signature: the contract is signed whatever
 * Square says. A failure is saved on the instalment and shown on the card.
 */

type AnyClient = SupabaseClient;

export async function invoiceFirstPayment(
  db: AnyClient,
  input: { planId: string; leadId: string }
): Promise<{ ok: true; invoiceNumber: string | null } | { error: string }> {
  try {
    const { data: plan } = await db
      .from("student_tuition_plans")
      .select("id, student_id, students(first_name, last_name, school_id, admissions_lead_id, schools(name, square_location_id))")
      .eq("id", input.planId)
      .maybeSingle();
    const p = plan as unknown as {
      student_id: string;
      students: {
        first_name: string | null;
        last_name: string | null;
        admissions_lead_id: string | null;
        schools: { name: string | null; square_location_id: string | null } | null;
      } | null;
    } | null;
    if (!p?.students) return { error: "Plan or student not found." };
    const locationId = p.students.schools?.square_location_id?.trim();
    if (!locationId) return { error: `${p.students.schools?.name ?? "This campus"} has no Square location.` };

    const { data: rows } = await db
      .from("student_tuition_instalments")
      .select("id, sequence, label, due_date, amount, is_paid, square_invoice_id")
      .eq("plan_id", input.planId)
      .gt("amount", 0)
      .eq("is_paid", false)
      .order("sequence", { ascending: true })
      .limit(1);
    const first = (rows ?? [])[0] as
      | { id: string; label: string | null; due_date: string | null; amount: number | string; square_invoice_id: string | null }
      | undefined;
    if (!first) return { error: "No unpaid instalment to invoice." };
    if (first.square_invoice_id) return { ok: true, invoiceNumber: null };

    const record = async (patch: Record<string, unknown>) =>
      db.from("student_tuition_instalments").update(patch).eq("id", first.id);

    const customer = await ensureCustomer(
      db,
      {
        first_name: p.students.first_name,
        last_name: p.students.last_name,
        admissions_lead_id: p.students.admissions_lead_id ?? input.leadId,
      },
      p.student_id
    );
    if ("error" in customer) {
      await record({ square_invoice_error: customer.error });
      return customer;
    }

    const child = `${p.students.first_name ?? ""} ${p.students.last_name ?? ""}`.trim();
    const amountCents = Math.round(Number(first.amount) * 100);
    const today = easternToday();
    const due = first.due_date && first.due_date > today ? first.due_date : today;

    const order = await squarePost("/v2/orders", {
      idempotency_key: `jag-first-${first.id}-order`,
      order: {
        location_id: locationId,
        customer_id: customer.customerId,
        reference_id: first.id,
        line_items: [
          {
            name: `${first.label ?? "First tuition payment"} — ${child}`.slice(0, 500),
            quantity: "1",
            base_price_money: { amount: amountCents, currency: "USD" },
          },
        ],
      },
    });
    if (!order.ok) {
      await record({ square_invoice_error: `Square order: ${order.error}` });
      return { error: order.error };
    }
    const orderId = (order.data as { order?: { id: string } }).order?.id;
    if (!orderId) return { error: "Square returned no order id." };

    const created = await squarePost("/v2/invoices", {
      idempotency_key: `jag-first-${first.id}-invoice`,
      invoice: {
        location_id: locationId,
        order_id: orderId,
        primary_recipient: { customer_id: customer.customerId },
        payment_requests: [{ request_type: "BALANCE", due_date: due }],
        delivery_method: "EMAIL",
        accepted_payment_methods: {
          card: true,
          bank_account: true,
          square_gift_card: false,
          buy_now_pay_later: false,
          cash_app_pay: false,
        },
        title: `Tuition — ${child}`.slice(0, 255),
        description: `${first.label ?? "First tuition payment"}, per ${child}'s signed Enrollment and Tuition Contract.`,
      },
    });
    if (!created.ok) {
      await record({ square_invoice_error: `Square invoice: ${created.error}` });
      return { error: created.error };
    }
    const inv = (created.data as { invoice?: { id: string; version?: number } }).invoice;
    if (!inv?.id) return { error: "Square returned no invoice id." };
    await record({ square_invoice_id: inv.id, square_invoice_error: null });

    const published = await squarePost(`/v2/invoices/${inv.id}/publish`, {
      version: inv.version ?? 0,
      idempotency_key: `jag-first-${first.id}-publish`,
    });
    if (!published.ok) {
      await record({ square_invoice_error: `Square publish: ${published.error}` });
      return { error: published.error };
    }
    const number = (published.data as { invoice?: { invoice_number?: string } }).invoice?.invoice_number ?? null;
    await record({ square_invoice_number: number, square_invoice_error: null });
    return { ok: true, invoiceNumber: number };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** For a retry after a failure that left an unpublished invoice behind. */
export async function squareInvoiceStatus(invoiceId: string): Promise<string | null> {
  const read = await squareGet(`/v2/invoices/${invoiceId}`);
  if (!read.ok) return null;
  return (read.data as { invoice?: { status?: string } }).invoice?.status ?? null;
}

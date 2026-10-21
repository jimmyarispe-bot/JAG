"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";

import {
  addScholarshipAction,
  applyGsnsShareAction,
  createScholarshipInvoicesAction,
  createStudentRecordAction,
  markSquareInvoicePaidAction,
  editScholarshipAction,
  invoiceFirstPaymentAction,
  markPlanFinalAction,
  readAwardLetterAction,
  recordStatePaymentAction,
  recordPaymentAction,
  undoPaymentAction,
  updateChildDetailsAction,
  updatePlacementAction,
  updateScholarshipAction,
} from "@/lib/admissions/finalizing/actions";
import type {
  FinalizingAward,
  FinalizingChild,
  FinalizingInstalment,
  FinalizingStateInvoice,
} from "@/lib/admissions/finalizing/load";
import { GRADES, gradeLabel } from "@/lib/constants/grades";
import { decidedOn, easternToday, gsnsShareOn, shareOf } from "@/lib/scholarships/gsns";
import {
  HS_OPTIONS,
  HS_OPTION_MATH_TUTORING,
  HS_OPTION_SL_TUTORING,
  describeChoice,
  longDay,
} from "@/lib/admissions/placement";

/**
 * ONE CHILD ON FINALIZING CONTRACT - FIVE STEPS, EACH SAYING WHAT IS DONE AND
 * WHAT IS NEXT. A step that cannot start yet says what it is waiting for
 * rather than offering a button that would fail.
 */

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ach: "ACH / bank transfer",
  credit_card: "Credit or debit card",
  check: "Check",
  cash: "Cash",
  square: "Square",
  classwallet: "ClassWallet",
  state_direct: "Paid by the state",
  scholarship: "Scholarship funds",
  other: "Other",
};

function usd(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function shortDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function Step({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
        }`}
        aria-label={done ? "Done" : "Not done"}
      >
        {done ? "✓" : n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <div className="mt-1 space-y-2 text-sm text-slate-600">{children}</div>
      </div>
    </div>
  );
}

const button =
  "rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800 disabled:opacity-50";
const quietButton =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const input = "w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800";

function UndoPayment({
  instalmentId,
  leadId,
  disabled,
  onUndo,
}: {
  instalmentId: string;
  leadId: string;
  disabled: boolean;
  onUndo: (fd: FormData) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="text-[11px] text-slate-500 underline"
      onClick={() => {
        if (!window.confirm("Remove this recorded payment?")) return;
        const fd = new FormData();
        fd.set("instalment_id", instalmentId);
        fd.set("lead_id", leadId);
        onUndo(fd);
      }}
    >
      Undo
    </button>
  );
}

/**
 * GSNS: the letter's total, the share, and whether the share still holds.
 * "we would need to receive the signed contract and first payment before these
 * dates for the corresponding scholarship percentage to apply" (Jimmy, 20 Oct).
 */
function GsnsShareLine({
  award,
  signedAt,
  firstPaidAt,
  disabled,
  onApply,
}: {
  award: FinalizingAward;
  signedAt: string | null;
  firstPaidAt: string | null;
  disabled: boolean;
  onApply: () => void;
}) {
  const total = award.totalAwardAmount ?? 0;
  const decided = decidedOn(signedAt, firstPaidAt);
  const now = gsnsShareOn(decided ?? easternToday(), award.awardYear);
  const held = award.awardPercent;
  const moved = now !== null && held !== null && now.percent !== held;
  return (
    <div className="mt-1 space-y-1 text-[11px] text-slate-600">
      <p>
        Letter total {usd(total)}
        {award.stateStudentNumber ? ` · GTID ${award.stateStudentNumber}` : ""}
        {held !== null ? ` · ${held}%` : ""}
      </p>
      {moved && now ? (
        <div className="flex flex-wrap items-center gap-2 rounded bg-amber-50 px-2 py-1 text-amber-900">
          <span>
            {decided
              ? `Contract and first payment both in on ${shortDate(decided)}: ${now.percent}% = ${usd(shareOf(total, now.percent))}.`
              : `The ${shortDate(award.awardPercentDeadline)} deadline passed. Now ${now.percent}% = ${usd(shareOf(total, now.percent))}.`}
          </span>
          <button type="button" className="underline" disabled={disabled} onClick={onApply}>
            Apply {now.percent}%
          </button>
        </div>
      ) : decided ? (
        <p className="text-emerald-700">Decided: contract and first payment both in on {shortDate(decided)}.</p>
      ) : award.awardPercentDeadline ? (
        <p>Holds if the contract is signed and the first payment made before {shortDate(award.awardPercentDeadline)}.</p>
      ) : null}
    </div>
  );
}

/**
 * The preferred start the parent gave, and at HS what the school leader
 * placed. Jimmy, 20 Oct 2026: "Preferred and start are both shown" ... "That
 * then needs to be included in the information sent to me."
 */
function StartAndClasses({
  child,
  disabled,
  onSave,
}: {
  child: FinalizingChild;
  disabled: boolean;
  onSave: (fd: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ask = child.familyAsk;
  const placed = child.placement;
  const seed = placed.recordedAt ? placed : { ...ask, actualStartDate: ask.preferredStart };
  return (
    <div className="space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-700">
      <p>
        <span className="font-semibold text-slate-900">Parent&rsquo;s preferred start:</span> {longDay(ask.preferredStart)}
      </p>
      {child.isHs ? (
        <>
          <p>
            <span className="font-semibold text-slate-900">Parent asked for:</span> {describeChoice(ask)}
          </p>
          <p>
            <span className="font-semibold text-slate-900">School leader placed:</span>{" "}
            {placed.recordedAt ? describeChoice(placed) : <span className="text-amber-700">not chosen at Accept</span>}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Actual start date:</span>{" "}
            {placed.actualStartDate ? longDay(placed.actualStartDate) : <span className="text-amber-700">not chosen</span>}
          </p>
          {editing ? (
            <form
              className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-white p-3"
              onSubmit={(e) => {
                e.preventDefault();
                onSave(new FormData(e.currentTarget));
                setEditing(false);
              }}
            >
              <input type="hidden" name="lead_id" value={child.leadId} />
              {HS_OPTIONS.map((option) => (
                <div key={option}>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" name="placement_option" value={option} defaultChecked={seed.options.includes(option)} className="mt-0.5" />
                    <span>{option}</span>
                  </label>
                  {option === HS_OPTION_SL_TUTORING || option === HS_OPTION_MATH_TUTORING ? (
                    <label className="ml-6 flex items-center gap-2 text-[11px] text-slate-600">
                      Days per month
                      <input
                        type="number"
                        min={1}
                        max={31}
                        name={option === HS_OPTION_SL_TUTORING ? "placement_sl_days" : "placement_math_days"}
                        defaultValue={(option === HS_OPTION_SL_TUTORING ? seed.slTutoringDays : seed.mathTutoringDays) ?? ""}
                        className="w-16 rounded border border-slate-200 px-1 py-0.5"
                      />
                    </label>
                  ) : null}
                </div>
              ))}
              <label className="block">
                Actual start date{" "}
                <input type="date" name="actual_start_date" defaultValue={seed.actualStartDate ?? ""} className="rounded border border-slate-200 px-1 py-0.5" />
              </label>
              <div className="flex gap-2">
                <button type="submit" className={button} disabled={disabled}>Save</button>
                <button type="button" className={quietButton} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button type="button" className="text-[11px] text-brand-700 underline" onClick={() => setEditing(true)}>
              {placed.recordedAt ? "Change classes or start date" : "Set classes and start date"}
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}

/**
 * The state's payments, one Square invoice each - records only, never sent.
 * "when we receive the payment from the state we will mark them as paid via
 * state scholarship" (Jimmy, 20 Oct 2026). Square will not let the JAG mark
 * them paid, so the JAG records the payment and opens the invoice in Square.
 */
function StateInvoices({
  invoices,
  hasAwards,
  awardTotal,
  disabled,
  onCreate,
  onRecord,
  onMarkedPaid,
}: {
  invoices: FinalizingStateInvoice[];
  hasAwards: boolean;
  awardTotal: number;
  disabled: boolean;
  onCreate: () => void;
  onRecord: (fd: FormData) => void;
  onMarkedPaid: (id: string) => void;
}) {
  const [recording, setRecording] = useState<string | null>(null);
  if (!hasAwards && invoices.length === 0) return null;
  const needsWork = invoices.length === 0 || invoices.some((i) => i.status === "pending" || i.status === "error");
  const invoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const mismatch = invoices.length > 0 && Math.abs(invoiced - awardTotal) > 0.009;
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-800">State scholarship invoices (Square · not sent to the family)</p>
      {mismatch ? (
        <p className="rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
          Invoices total {usd(invoiced)}; the scholarship is now {usd(awardTotal)}. Adjust them in Square.
        </p>
      ) : null}
      {invoices.length > 0 ? (
        <ul className="divide-y divide-slate-100 text-xs">
          {invoices.map((i) => (
            <li key={i.id} className="space-y-1 py-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {i.label} · due {shortDate(i.dueDate)}
                  {i.squareInvoiceNumber ? ` · Square #${i.squareInvoiceNumber}` : ""}
                </span>
                <span className="flex items-center gap-2">
                  {usd(i.amount)}
                  {i.squareMarkedPaidAt ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">Paid by the state</span>
                  ) : i.receiptId ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">Received · mark paid in Square</span>
                  ) : i.status === "open" ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Open</span>
                  ) : i.status === "error" ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-800">Not in Square</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Not in Square yet</span>
                  )}
                </span>
              </div>
              {i.status === "error" && i.lastError ? <p className="text-[11px] text-red-700">{i.lastError}</p> : null}
              <div className="flex flex-wrap gap-3 text-[11px]">
                {i.squareInvoiceId ? (
                  <a
                    className="text-brand-700 underline"
                    href={`https://app.squareup.com/dashboard/invoices/${i.squareInvoiceId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Square
                  </a>
                ) : null}
                {i.status === "open" && !i.receiptId ? (
                  <button type="button" className="text-brand-700 underline" disabled={disabled} onClick={() => setRecording(i.id)}>
                    Record state payment
                  </button>
                ) : null}
                {i.receiptId && !i.squareMarkedPaidAt ? (
                  <button type="button" className="text-brand-700 underline" disabled={disabled} onClick={() => onMarkedPaid(i.id)}>
                    I marked it paid in Square
                  </button>
                ) : null}
              </div>
              {recording === i.id ? (
                <form
                  className="grid gap-2 rounded bg-slate-50 p-2 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onRecord(new FormData(e.currentTarget));
                    setRecording(null);
                  }}
                >
                  <input type="hidden" name="invoice_id" value={i.id} />
                  <input name="amount" defaultValue={i.amount.toFixed(2)} className={input} inputMode="decimal" aria-label="Amount the state paid" />
                  <input name="received_on" type="date" defaultValue={today()} className={input} aria-label="Date it arrived" />
                  <input name="reference" placeholder="Check # (optional)" className={input} />
                  <div className="flex gap-2 sm:col-span-3">
                    <button type="submit" className={button} disabled={disabled}>
                      Record state payment
                    </button>
                    <button type="button" className={quietButton} onClick={() => setRecording(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {needsWork ? (
        <button type="button" className={quietButton} disabled={disabled} onClick={onCreate}>
          {invoices.length === 0 ? "Make the Square invoices" : "Retry in Square"}
        </button>
      ) : null}
    </div>
  );
}

export function FinalizingChildCard({ child }: { child: FinalizingChild }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [paying, setPaying] = useState<FinalizingInstalment | null>(null);
  const [addingAward, setAddingAward] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingAwardId, setEditingAwardId] = useState<string | null>(null);
  // An award just added shows at once; the page refresh then replaces it.
  const [justAdded, setJustAdded] = useState<FinalizingAward[]>([]);

  const name = `${child.firstName} ${child.lastName}`.trim();
  const plan = child.plan;
  const planFinal = plan ? ["final", "contracted"].includes(plan.lifecycle) : false;
  const contractSigned = child.packetStatus === "completed";
  const firstPaid = Boolean(child.firstPayable?.isPaid);

  function run(task: () => Promise<unknown>, okText: string) {
    setMessage(null);
    startTransition(async () => {
      const result = (await task()) as { error?: string; warning?: string; enrolled?: boolean } | undefined;
      if (result && typeof result === "object" && "error" in result && result.error) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      if (result && typeof result === "object" && "warning" in result && result.warning) {
        setMessage({ tone: "error", text: result.warning });
      } else if (result && typeof result === "object" && "enrolled" in result && result.enrolled) {
        setMessage({ tone: "ok", text: `${name} is enrolled and on Enrolled Students.` });
      } else if (result && typeof result === "object" && "message" in result && typeof result.message === "string") {
        setMessage({ tone: "ok", text: result.message });
      } else {
        setMessage({ tone: "ok", text: okText });
      }
      if (result && typeof result === "object" && "openUrl" in result && typeof result.openUrl === "string") {
        window.open(result.openUrl, "_blank", "noopener");
      }
      if (result && typeof result === "object" && "award" in result && result.award) {
        setJustAdded((prev) => [...prev, (result as { award: FinalizingAward }).award]);
      }
      setPaying(null);
      setAddingAward(false);
      setEditingAwardId(null);
      if (!(result && typeof result === "object" && "warning" in result && result.warning)) setEditing(false);
      router.refresh();
    });
  }

  function submitForm(action: (fd: FormData) => Promise<unknown>, okText: string) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const fd = new FormData(event.currentTarget);
      run(() => action(fd), okText);
    };
  }

  const knownIds = new Set(child.awards.map((a) => a.id));
  const openAwards = [...child.awards, ...justAdded.filter((a) => !knownIds.has(a.id))].filter(
    (a) => a.status === "applied" || a.status === "awarded"
  );
  // Scholarship entries can be corrected until the contract goes to the parent.
  const awardsLocked = Boolean(child.packetStatus);

  return (
    <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            href={`/dashboard/admissions/cases/${child.leadId}/full`}
            className="text-base font-semibold text-slate-900 hover:text-brand-700"
          >
            {name}
          </Link>
          <p className="text-xs text-slate-500">
            {child.grade ? `${gradeLabel(child.grade)} · ` : ""}
            {child.guardianName || "Parent not named"}
            {child.guardianEmail ? ` · ${child.guardianEmail}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
            Accepted {shortDate(child.stageEnteredAt)}
          </span>
          <button type="button" className={quietButton} onClick={() => setEditing((v) => !v)}>
            {editing ? "Close" : "Edit details"}
          </button>
        </div>
      </header>

      {editing ? (
        <form
          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
          onSubmit={submitForm(updateChildDetailsAction, "Details saved.")}
        >
          <input type="hidden" name="lead_id" value={child.leadId} />
          {child.details.parent2 ? <input type="hidden" name="parent2_id" value={child.details.parent2.id} /> : null}
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Child</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate-600">Legal first name
              <input name="first_name" defaultValue={child.details.firstName} className={input} />
            </label>
            <label className="text-xs text-slate-600">Last name
              <input name="last_name" defaultValue={child.details.lastName} className={input} />
            </label>
            <label className="text-xs text-slate-600">Preferred name
              <input name="preferred_name" defaultValue={child.details.preferredName ?? ""} className={input} />
            </label>
            <label className="text-xs text-slate-600">Date of birth
              <input name="date_of_birth" type="date" defaultValue={child.details.dateOfBirth ?? ""} className={input} />
            </label>
            <label className="text-xs text-slate-600">Grade for the contract year
              <select name="applying_for_grade" defaultValue={child.details.applyingForGrade ?? ""} className={input}>
                <option value="">—</option>
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parent 1 (signs, receives the contract)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate-600">First name
              <input name="guardian_first_name" defaultValue={child.details.guardianFirstName ?? ""} className={input} />
            </label>
            <label className="text-xs text-slate-600">Last name
              <input name="guardian_last_name" defaultValue={child.details.guardianLastName ?? ""} className={input} />
            </label>
            <label className="text-xs text-slate-600">Email
              <input name="guardian_email" type="email" defaultValue={child.details.guardianEmail ?? ""} className={input} />
            </label>
            <label className="text-xs text-slate-600">Phone
              <input name="guardian_phone" defaultValue={child.details.guardianPhone ?? ""} className={input} />
            </label>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parent 2 (optional)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate-600">First name
              <input name="parent2_first_name" defaultValue={child.details.parent2?.firstName ?? ""} className={input} />
            </label>
            <label className="text-xs text-slate-600">Last name
              <input name="parent2_last_name" defaultValue={child.details.parent2?.lastName ?? ""} className={input} />
            </label>
            <label className="text-xs text-slate-600">Email
              <input name="parent2_email" type="email" defaultValue={child.details.parent2?.email ?? ""} className={input} />
            </label>
            <label className="text-xs text-slate-600">Phone
              <input name="parent2_phone" defaultValue={child.details.parent2?.phone ?? ""} className={input} />
            </label>
          </div>
          {contractSigned ? (
            <p className="text-[11px] text-slate-600">
              The contract is already signed. Changes here update the records; the signed contract stays as signed.
            </p>
          ) : null}
          <div className="flex gap-2">
            <button type="submit" className={button} disabled={pending}>
              {pending ? "Saving…" : "Save details"}
            </button>
            <button type="button" className={quietButton} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`rounded-lg px-3 py-2 text-xs ${
            message.tone === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <StartAndClasses child={child} disabled={pending} onSave={(fd) => run(() => updatePlacementAction(fd), "Saved.")} />

      <div className="space-y-4">
        {/* 1 */}
        <Step n={1} title="Student record" done={Boolean(child.studentId)}>
          {child.studentId ? (
            <p>Created. Not billed, not activated.</p>
          ) : (
            <button
              type="button"
              className={button}
              disabled={pending}
              onClick={() => run(() => createStudentRecordAction(child.leadId), "Student record created.")}
            >
              Create student record
            </button>
          )}
        </Step>

        {/* 2 */}
        <Step
          n={2}
          title="Scholarships"
          done={Boolean(child.studentId) && openAwards.every((a) => a.status === "awarded")}
        >
          {child.statedFunding.programCode || child.statedFunding.awardAmount ? (
            <p className="text-xs text-slate-500">
              Family said on the inquiry form: {child.statedFunding.programCode ?? "a program"}
              {child.statedFunding.awardAmount !== null ? `, ${usd(child.statedFunding.awardAmount)}` : ""}
              {child.statedFunding.awardId ? `, award ID ${child.statedFunding.awardId}` : ""}
            </p>
          ) : null}

          {openAwards.length === 0 ? <p>None recorded.</p> : null}
          <ul className="space-y-2">
            {openAwards.map((award) => (
              <li key={award.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">
                    {award.programName} · {award.awardYear}
                  </span>
                  <span>{award.status === "awarded" ? usd(award.awardedAmount) : "Amount not known yet"}</span>
                </div>
                {award.totalAwardAmount !== null ? (
                  <GsnsShareLine
                    award={award}
                    signedAt={child.contractSignedAt}
                    firstPaidAt={child.firstPayable?.isPaid ? child.firstPayable.paidAt : null}
                    disabled={pending}
                    onApply={() => run(() => applyGsnsShareAction(award.id, child.leadId), "Share updated.")}
                  />
                ) : null}
                {editingAwardId === award.id ? (
                  <form
                    className="mt-2 space-y-2"
                    onSubmit={submitForm(editScholarshipAction, "Scholarship updated.")}
                  >
                    <input type="hidden" name="award_id" value={award.id} />
                    <input name="program_name" defaultValue={award.programName} className={input} aria-label="Scholarship name" />
                    <input name="program_code" defaultValue={award.programCode ?? ""} placeholder="Code (optional)" className={input} aria-label="Code" />
                    <input name="award_year" defaultValue={award.awardYear} className={input} aria-label="School year" />
                    <select name="status" defaultValue={award.status} className={input} aria-label="Status">
                      <option value="awarded">Awarded — amount known</option>
                      <option value="applied">Applied for — amount not known yet</option>
                    </select>
                    <input
                      name="amount"
                      defaultValue={award.awardedAmount ?? ""}
                      placeholder="Amount (awarded only)"
                      className={input}
                      inputMode="decimal"
                      aria-label="Amount"
                    />
                    <input
                      name="total_award_amount"
                      defaultValue={award.totalAwardAmount ?? ""}
                      placeholder="GA Special Needs only: letter's total (works out the %)"
                      className={input}
                      inputMode="decimal"
                      aria-label="Letter total"
                    />
                    <input
                      name="state_student_number"
                      defaultValue={award.stateStudentNumber ?? ""}
                      placeholder="GTID (optional)"
                      className={input}
                      aria-label="GTID"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className={button} disabled={pending}>
                        {pending ? "Saving…" : "Save changes"}
                      </button>
                      <button type="button" className={quietButton} onClick={() => setEditingAwardId(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
                {award.status === "applied" && !awardsLocked && editingAwardId !== award.id ? (
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={submitForm(updateScholarshipAction, "Scholarship amount recorded.")}
                  >
                    <input type="hidden" name="award_id" value={award.id} />
                    <input name="amount" placeholder="Awarded amount" className={input} inputMode="decimal" />
                    <button type="submit" className={button} disabled={pending}>
                      Save
                    </button>
                  </form>
                ) : null}
                {awardsLocked ? (
                  <p className="mt-1 text-[11px] text-slate-500">Locked — the contract has been sent.</p>
                ) : editingAwardId === award.id ? null : (
                  <div className="mt-1 flex gap-3">
                    <button
                      type="button"
                      className="text-[11px] text-brand-700 underline"
                      disabled={pending}
                      onClick={() => setEditingAwardId(award.id)}
                    >
                      Edit
                    </button>
                    <form onSubmit={submitForm(updateScholarshipAction, "Scholarship removed.")}>
                      <input type="hidden" name="award_id" value={award.id} />
                      <input type="hidden" name="intent" value="withdraw" />
                      <button
                        type="submit"
                        className="text-[11px] text-slate-500 underline"
                        disabled={pending}
                        onClick={(e) => {
                          if (!window.confirm(`Remove ${award.programName}?`)) e.preventDefault();
                        }}
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {child.studentId && !awardsLocked ? (
            addingAward ? (
              <form
                className="space-y-2 rounded-lg border border-slate-200 p-3"
                onSubmit={submitForm(addScholarshipAction, "Scholarship added.")}
              >
                <input type="hidden" name="student_id" value={child.studentId} />
                <input type="hidden" name="school_id" value={child.schoolId} />
                <input name="program_name" placeholder="Scholarship name, e.g. GA Special Needs Scholarship" className={input} />
                <input
                  name="program_code"
                  placeholder="Code (optional), e.g. ga_esa"
                  defaultValue={child.statedFunding.programCode ?? ""}
                  className={input}
                />
                <input name="award_year" placeholder="School year" defaultValue="2026-2027" className={input} />
                <select name="status" className={input} defaultValue="awarded">
                  <option value="awarded">Awarded — amount known</option>
                  <option value="applied">Applied for — amount not known yet</option>
                </select>
                <input
                  name="amount"
                  placeholder="Amount (awarded only)"
                  defaultValue={child.statedFunding.awardAmount ?? ""}
                  className={input}
                  inputMode="decimal"
                />
                <input
                  name="total_award_amount"
                  placeholder="GA Special Needs only: letter's total (works out the %)"
                  className={input}
                  inputMode="decimal"
                />
                <input name="state_student_number" placeholder="GTID (optional)" className={input} />
                <div className="flex gap-2">
                  <button type="submit" className={button} disabled={pending}>
                    Add scholarship
                  </button>
                  <button type="button" className={quietButton} onClick={() => setAddingAward(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap gap-2">
                {!openAwards.some((a) => a.totalAwardAmount !== null) ? (
                  <button
                    type="button"
                    className={quietButton}
                    disabled={pending}
                    onClick={() => run(() => readAwardLetterAction(child.leadId), "Letter read.")}
                  >
                    Read the GSNS award letter
                  </button>
                ) : null}
                <button type="button" className={quietButton} onClick={() => setAddingAward(true)}>
                  + Add scholarship
                </button>
              </div>
            )
          ) : !child.studentId ? (
            <p className="text-xs text-slate-500">Waiting on the student record.</p>
          ) : null}
        </Step>

        {/* 3 */}
        <Step n={3} title="Tuition plan and Schedule of Tuition Payments" done={planFinal}>
          {!child.studentId ? (
            <p className="text-xs text-slate-500">Waiting on the student record.</p>
          ) : !plan ? (
            <Link href={`/dashboard/finance/plan/${child.studentId}`} className={button}>
              Build the tuition plan
            </Link>
          ) : (
            <>
              <p>
                {plan.billingMode === "scheduled"
                  ? `Annual ${usd(plan.annualTuition)} · family owes ${usd(plan.remainingDue)} · ${plan.instalments.length} payments`
                  : `Month to month · ${usd(plan.monthlyAmount)} a month`}
              </p>
              <p className="text-xs">
                Status:{" "}
                <span className="font-medium text-slate-800">
                  {plan.lifecycle === "awaiting_scholarship_amounts"
                    ? `Waiting — ${plan.awaitingReason ?? "a scholarship amount"}`
                    : plan.lifecycle.replace(/_/g, " ")}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/finance/plan/${child.studentId}`} className={quietButton}>
                  {planFinal ? "View plan" : "Edit plan"}
                </Link>
                <Link
                  href={`/dashboard/finance/schedules/${plan.id}/document`}
                  className={quietButton}
                  target="_blank"
                >
                  Schedule of Tuition Payments (print / PDF)
                </Link>
                {plan.lifecycle === "draft" ? (
                  <button
                    type="button"
                    className={button}
                    disabled={pending}
                    onClick={() => run(() => markPlanFinalAction(plan.id), "Plan is final.")}
                  >
                    Mark plan final
                  </button>
                ) : null}
              </div>
              {planFinal ? (
                <StateInvoices
                  invoices={child.stateInvoices}
                  hasAwards={openAwards.some((a) => a.status === "awarded" && (a.awardedAmount ?? 0) > 0)}
                  awardTotal={openAwards
                    .filter((a) => a.status === "awarded")
                    .reduce((sum, a) => sum + (a.awardedAmount ?? 0), 0)}
                  disabled={pending}
                  onCreate={() =>
                    run(() => createScholarshipInvoicesAction(child.studentId as string, plan.id), "Invoices made.")
                  }
                  onRecord={(fd) => run(() => recordStatePaymentAction(fd), "State payment recorded.")}
                  onMarkedPaid={(id) => run(() => markSquareInvoicePaidAction(id), "Marked paid in Square.")}
                />
              ) : null}
            </>
          )}
        </Step>

        {/* 4 */}
        <Step n={4} title="Contract signed by the parent" done={contractSigned}>
          {!planFinal ? (
            <p className="text-xs text-slate-500">Waiting on a final tuition plan. Nothing is sent before every figure is known.</p>
          ) : (
            <>
              <p className="text-xs">
                {contractSigned
                  ? "Signed by the parent."
                  : child.packetStatus
                    ? `Sent — ${child.packetStatus === "partially_signed" ? "partly initialled" : "waiting on the parent"}.`
                    : "Not sent yet."}
              </p>
              <Link
                href={`/dashboard/admissions/finalizing/${child.leadId}/contract`}
                className={contractSigned || child.packetStatus ? quietButton : button}
              >
                {contractSigned ? "View signed contract (print / PDF)" : child.packetStatus ? "View contract" : "Preview and send contract"}
              </Link>
            </>
          )}
        </Step>

        {/* 5 */}
        <Step n={5} title="First tuition payment" done={firstPaid}>
          {plan && contractSigned && child.firstPayable && !child.firstPayable.isPaid ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {child.firstPayable.squareInvoiceId ? (
                <span className="text-slate-700">
                  Square invoice{child.firstPayable.squareInvoiceNumber ? ` #${child.firstPayable.squareInvoiceNumber}` : ""} emailed to the family.
                </span>
              ) : (
                <>
                  <span className={child.firstPayable.squareInvoiceError ? "text-red-700" : "text-slate-600"}>
                    {child.firstPayable.squareInvoiceError
                      ? `Invoice not sent: ${child.firstPayable.squareInvoiceError}`
                      : "No Square invoice yet."}
                  </span>
                  <button
                    type="button"
                    className={quietButton}
                    disabled={pending}
                    onClick={() => run(() => invoiceFirstPaymentAction(plan.id, child.leadId), "Invoice sent.")}
                  >
                    Email the Square invoice
                  </button>
                </>
              )}
            </div>
          ) : null}
          {!plan ? (
            <p className="text-xs text-slate-500">Waiting on the tuition plan.</p>
          ) : plan.billingMode === "scheduled" && (plan.remainingDue ?? 0) <= 0 ? (
            <p className="text-xs text-slate-600">
              Nothing owed after scholarships. Signing the contract moves {name} to Enrolled Students.
            </p>
          ) : plan.instalments.length === 0 ? (
            <p className="text-xs text-slate-500">This plan has no payment schedule.</p>
          ) : (
            <>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 text-xs">
                {plan.instalments
                  .filter((i) => i.amount > 0)
                  .slice(0, 3)
                  .map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                      <span>
                        {i.label ?? `Payment ${i.sequence}`} · due {shortDate(i.dueDate)}
                      </span>
                      <span className="flex items-center gap-2">
                        {usd(i.amount)}
                        {i.isPaid ? (
                          <>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">
                              Paid {shortDate(i.paidAt)}
                            </span>
                            <UndoPayment
                              instalmentId={i.id}
                              leadId={child.leadId}
                              disabled={pending}
                              onUndo={(fd) => run(() => undoPaymentAction(fd), "Payment removed.")}
                            />
                          </>
                        ) : (
                          <>
                            {i.paidAmount ? (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
                                {usd(i.paidAmount)} received
                              </span>
                            ) : null}
                          <button
                            type="button"
                            className="text-brand-700 underline"
                            onClick={() => setPaying(i)}
                            disabled={pending}
                          >
                            Record payment
                          </button>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
              </ul>

              {paying ? (
                <form
                  className="space-y-2 rounded-lg border border-brand-200 bg-brand-50/40 p-3"
                  onSubmit={submitForm(recordPaymentAction, "Payment recorded.")}
                >
                  <p className="text-xs font-medium text-slate-800">
                    {paying.label ?? `Payment ${paying.sequence}`} — {usd(paying.amount)}
                    {paying.paidAmount ? ` (${usd(paying.paidAmount)} already received)` : ""}
                  </p>
                  <input type="hidden" name="instalment_id" value={paying.id} />
                  <input type="hidden" name="lead_id" value={child.leadId} />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="amount"
                      defaultValue={(paying.amount - (paying.paidAmount ?? 0)).toFixed(2)}
                      className={input}
                      inputMode="decimal"
                      aria-label="Amount received"
                    />
                    <input name="paid_on" type="date" defaultValue={today()} className={input} aria-label="Date received" />
                  </div>
                  <select name="method" className={input} defaultValue="" aria-label="How it was paid">
                    <option value="" disabled>
                      How was it paid?
                    </option>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input name="reference" placeholder="Reference / check # (optional)" className={input} />
                  <input name="notes" placeholder="Note (optional)" className={input} />
                  {child.firstPayable?.id === paying.id ? (
                    <p className="text-[11px] text-slate-600">
                      This is the first payment. Paid in full, {name} moves to Enrolled Students.
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <button type="submit" className={button} disabled={pending}>
                      {pending ? "Saving…" : "Record payment"}
                    </button>
                    <button type="button" className={quietButton} onClick={() => setPaying(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </>
          )}
        </Step>
      </div>
    </article>
  );
}

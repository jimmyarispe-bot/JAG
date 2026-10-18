"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";

import {
  addScholarshipAction,
  createStudentRecordAction,
  markPlanFinalAction,
  recordPaymentAction,
  updateScholarshipAction,
} from "@/lib/admissions/finalizing/actions";
import type { FinalizingChild, FinalizingInstalment } from "@/lib/admissions/finalizing/load";
import { gradeLabel } from "@/lib/constants/grades";

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

export function FinalizingChildCard({ child }: { child: FinalizingChild }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [paying, setPaying] = useState<FinalizingInstalment | null>(null);
  const [addingAward, setAddingAward] = useState(false);

  const name = `${child.firstName} ${child.lastName}`.trim();
  const plan = child.plan;
  const planFinal = plan ? ["final", "contracted"].includes(plan.lifecycle) : false;
  const contractSigned = child.packetStatus === "completed";
  const firstPaid = Boolean(child.firstPayable?.isPaid);

  function run(task: () => Promise<{ error?: string; warning?: string; enrolled?: boolean } | unknown>, okText: string) {
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
      } else {
        setMessage({ tone: "ok", text: okText });
      }
      setPaying(null);
      setAddingAward(false);
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

  const openAwards = child.awards.filter((a) => a.status === "applied" || a.status === "awarded");

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
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
          Accepted {shortDate(child.stageEnteredAt)}
        </span>
      </header>

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
                {award.status === "applied" ? (
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
                <form
                  className="mt-1"
                  onSubmit={submitForm(updateScholarshipAction, "Scholarship removed.")}
                >
                  <input type="hidden" name="award_id" value={award.id} />
                  <input type="hidden" name="intent" value="withdraw" />
                  <button type="submit" className="text-[11px] text-slate-500 underline" disabled={pending}>
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>

          {child.studentId ? (
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
              <button type="button" className={quietButton} onClick={() => setAddingAward(true)}>
                + Add scholarship
              </button>
            )
          ) : (
            <p className="text-xs text-slate-500">Waiting on the student record.</p>
          )}
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
            </>
          )}
        </Step>

        {/* 4 */}
        <Step n={4} title="Contract signed by the parent" done={contractSigned}>
          {!planFinal ? (
            <p className="text-xs text-slate-500">Waiting on a final tuition plan. Nothing is sent before every figure is known.</p>
          ) : contractSigned ? (
            <p>Signed.</p>
          ) : (
            <p className="text-xs text-slate-500">
              {child.packetStatus
                ? `Contract ${child.packetStatus.replace(/_/g, " ")}.`
                : "Sending the contract to the parent's JAG login is the next part of this build."}
            </p>
          )}
        </Step>

        {/* 5 */}
        <Step n={5} title="First tuition payment" done={firstPaid}>
          {!plan ? (
            <p className="text-xs text-slate-500">Waiting on the tuition plan.</p>
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
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">
                            Paid {shortDate(i.paidAt)}
                          </span>
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

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  checkApplicationFeePayment,
  startApplicationFeePayment,
} from "@/lib/admissions/fee/actions";

/**
 * The $100, at the end of the application and before it can be submitted.
 *
 * WHY THIS SITS ABOVE THE SUBMIT BUTTON AND NOT INSIDE IT. The gate that
 * actually stops an unpaid submission is on the server (gate.ts, called by
 * submitApplication). This panel is not that gate - it is the family being
 * told, before they press anything, what is outstanding and how to settle it.
 * A server refusal with no way to act on it is a dead end, and a button that
 * looks available and then refuses is worse than one that explains itself.
 *
 * WHY THERE IS A "CHECK" BUTTON. The return trip from Square is not reliable
 * and is not trusted. A parent can pay and close the tab, pay on a phone and
 * come back on a laptop, or lose signal on the way back. Every one of those
 * ends with money taken and this page not knowing. Check asks Square directly
 * about the order we recorded, so the way out of a lost return trip is never
 * "pay again".
 */

interface ApplicationFeePanelProps {
  applicationId: string;
  status: string;
  amountCents: number;
  /** True once the application is past the point where the fee is collected. */
  alreadySubmitted: boolean;
}

function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function ApplicationFeePanel({
  applicationId,
  status,
  amountCents,
  alreadySubmitted,
}: ApplicationFeePanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"pay" | "check" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // A campus that charges nothing has nothing to show a family.
  if (amountCents === 0) return null;

  if (status === "paid") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <span className="font-semibold">Application fee paid</span> — {usd(amountCents)}. Thank you.
      </div>
    );
  }

  if (status === "waived") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <span className="font-semibold">Application fee waived</span> — nothing is owed.
      </div>
    );
  }

  async function handlePay() {
    setError(null);
    setNote(null);
    setBusy("pay");
    try {
      const result = await startApplicationFeePayment(applicationId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      // Same tab. A new tab is blocked by default on most phones, and a family
      // who never sees the payment page believes the button is broken.
      window.location.href = result.url;
    } catch {
      setError("We could not start the payment just now. Nothing has been charged.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCheck() {
    setError(null);
    setNote(null);
    setBusy("check");
    try {
      const result = await checkApplicationFeePayment(applicationId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setNote("Payment confirmed. Thank you.");
      router.refresh();
    } catch {
      setError("We could not reach Square just now. Please try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  const unknownFee = status === "unknown";

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-lg font-semibold text-amber-900">
        Application fee — {usd(amountCents)}
      </h2>

      {unknownFee ? (
        <p className="mt-1 text-sm text-amber-900">
          This application was started before the JAG tracked fees, so we cannot tell whether
          the fee was paid. Please contact the school office and we will check — do not pay
          again until we have.
        </p>
      ) : (
        <p className="mt-1 text-sm text-amber-900">
          The {usd(amountCents)} application fee is due before this application can be
          submitted. It is per child and is not refunded. Payment is taken by Square — card
          details are never entered on this page.
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {note && <p className="mt-3 text-sm text-emerald-800">{note}</p>}

      {!alreadySubmitted && !unknownFee && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePay}
            disabled={busy !== null}
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
          >
            {busy === "pay" ? "Opening Square…" : `Pay ${usd(amountCents)}`}
          </button>
          <button
            type="button"
            onClick={handleCheck}
            disabled={busy !== null}
            className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60"
          >
            {busy === "check" ? "Checking…" : "I have already paid — check"}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useFormStatus } from "react-dom";

/**
 * THE SAVE BUTTON, WHICH CAN ONLY BE PRESSED ONCE.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * On 11 October one family's notes were submitted SIX times, five of them
 * between 14:10:54 and 14:10:59 UTC - one second apart. The page was a plain
 * server-rendered form with a plain submit button and no JavaScript on it at
 * all, so a second press while the first was still in flight simply posted
 * again. Each post mailed the parent another tour invitation: five identical
 * "come and tour our school" letters in five seconds.
 *
 * The real protection is in recordPostCallDecision, which now refuses to
 * repeat an invitation a family has already had since landing on this step -
 * a guard on the server, where it cannot be clicked past. This is the other
 * half: stop the second press happening in the first place, so a school
 * leader who taps twice on a phone does not quietly create a second record
 * of a conversation she had once.
 *
 * ── WHY A CLIENT COMPONENT FOR ONE BUTTON ───────────────────────────────────
 *
 * useFormStatus reads the pending state of the form it sits inside, and only
 * works in a client component below the <form>. One button is the smallest
 * thing that can know. The page around it stays a server component, the form
 * still posts to a server action, and the page still works with JavaScript
 * off - it just loses the disabling, which is why the server guard is the one
 * that matters and this is the courtesy.
 *
 * ── IT SAYS SO, TOO ─────────────────────────────────────────────────────────
 *
 * A button that goes grey and silent reads as broken, and a school leader who
 * thinks it is broken is exactly the person who presses it again. So it says
 * "Saving..." while it works.
 */
export function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="mt-6 w-full rounded-md bg-slate-900 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

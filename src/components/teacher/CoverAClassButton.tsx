"use client";

import { useState, useTransition } from "react";
import {
  classesICouldCoverAction,
  claimClassAsGuestAction,
} from "@/lib/finance/teacher-week-actions";

type Coverable = {
  sessionId: string;
  startsAtIso: string;
  courseName: string;
  sectionCode: string;
  teacherName: string;
  alreadyCovered: boolean;
};

/**
 * "I covered a class for someone."
 *
 * NOTHING COULD RECORD COVER BEFORE THIS. A teacher who stood in for a
 * colleague had no way to say so, so the class stayed on the absent teacher's
 * week and the person who actually taught it was paid nothing for it - the
 * same shape of silent underpayment found on 21 September, when 33 of 42
 * sections were pricing without children they could not see.
 *
 * LOADED ON DEMAND. A teacher opens this on the rare day she covered
 * something; fetching every other teacher's timetable for all five days on
 * every page load would be a lot of work for a screen that is usually just
 * confirming her own classes.
 *
 * THE REFUSALS ARE SENTENCES. claim_class_as_guest() answers 'ok' or a reason -
 * the week is submitted, she was teaching her own class at that hour, the
 * class is not at her school - and the reason is shown. A claim that quietly
 * fails is a teacher who believes she recorded her work and did not.
 */
export function CoverAClassButton({
  date,
  timeZone,
  disabled,
}: {
  date: string;
  timeZone: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<Coverable[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (disabled) return null;

  const show = (iso: string) => {
    if (!iso) return "";
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(iso));
    } catch {
      return "";
    }
  };

  const load = () => {
    setOpen(true);
    setMessage(null);
    startTransition(async () => {
      const result = await classesICouldCoverAction(date);
      if ("error" in result && result.error) {
        setMessage(result.error);
        setClasses([]);
        return;
      }
      setClasses(("classes" in result ? result.classes : []) as Coverable[]);
    });
  };

  const claim = (sessionId: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await claimClassAsGuestAction(sessionId);
      if (result && "error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setOpen(false);
      setClasses(null);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={load}
        className="text-xs font-medium text-brand-700 underline decoration-dotted underline-offset-4 hover:text-brand-800"
      >
        I covered a class for someone
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700">
          Which class did you cover?
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>

      {pending && classes === null ? (
        <p className="mt-2 text-xs text-slate-400">Looking…</p>
      ) : null}

      {classes !== null && classes.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          No other classes were scheduled at your school that day.
        </p>
      ) : null}

      {classes !== null && classes.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {classes.map((c) => (
            <li key={c.sessionId} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-600">
                {show(c.startsAtIso)} {c.courseName}
                <span className="text-slate-400"> — {c.teacherName}</span>
                {c.alreadyCovered ? (
                  <span className="text-amber-700"> (already covered)</span>
                ) : null}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => claim(c.sessionId)}
                className="whitespace-nowrap rounded-lg bg-brand-600 px-2.5 py-1 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                I taught this
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {message ? <p className="mt-2 text-xs text-rose-700">{message}</p> : null}
    </div>
  );
}

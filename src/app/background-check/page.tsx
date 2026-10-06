import type { Metadata } from "next";

import { submitBackgroundCheckAction } from "@/app/background-check/actions";
import {
  EYE_COLOR_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HEIGHT_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
  RACE_OPTIONS,
  SEX_OPTIONS,
  US_STATES,
} from "@/lib/employees/background-check-options";

export const metadata: Metadata = {
  title: "Background Screening — The Academy Way",
  robots: { index: false, follow: false },
};

/**
 * The background screening form a new hire fills in.
 *
 * Jimmy, 6 October 2026. Recreates the Florida Clearinghouse person profile at
 * crw.flclearinghouse.com/Person/Create - same fields, same required-ness,
 * same order - with WEIGHT DELETED at his instruction.
 *
 * WHY IT MIRRORS THEIR FORM SO CLOSELY. Jimmy reads the email this produces
 * with their page open beside it and retypes. Every field we reorder or rename
 * is a field he has to hunt for.
 *
 * NO SIGN-IN. One open link, his decision on 6 October. middleware.ts protects
 * by an explicit list of paths and /background-check is not on it, so this
 * page is public without touching auth.
 *
 * NOT INDEXED. robots noindex above, because a page that asks for a social
 * security number has no business in a search result.
 */

const LABEL = "block text-sm font-medium text-slate-700";
const FIELD =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 " +
  "focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

function Required() {
  return <span className="text-red-600"> *</span>;
}

function Optional() {
  return <span className="font-normal text-slate-500"> (optional)</span>;
}

export default async function BackgroundCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ problem?: string | string[]; done?: string }>;
}) {
  const { problem, done } = await searchParams;
  const problems = problem ? (Array.isArray(problem) ? problem : [problem]) : [];

  if (done === "1") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">Thank you.</h1>
        <p className="mt-4 text-slate-700">
          Your information has been sent to The Academy Way network office. They
          will start your background screening with the Florida Clearinghouse.
        </p>
        <p className="mt-4 text-slate-700">
          The Clearinghouse will email you a privacy notice at the address you
          gave us. Watch for it — your screening cannot be completed until you
          have read it and been fingerprinted.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Nothing else is needed from you right now. You can close this page.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm uppercase tracking-wide text-slate-500">
        The Academy Way Network of Schools
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        Background Screening
      </h1>
      <p className="mt-4 max-w-2xl text-slate-700">
        Every person who works with our students is screened by the State of
        Florida before they start. Please complete this once. Your answers go
        only to the network office and are used to start your screening with the
        Florida Care Provider Background Screening Clearinghouse.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-slate-600">
        Enter your legal name exactly as it appears on your Social Security card
        and your driver&apos;s license. A mismatch is the most common reason a
        screening is delayed.
      </p>

      {problems.length > 0 ? (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Please check the following, then fill the form in again:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
            {problems.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-red-700">
            For your security the form does not keep what you typed, so your
            Social Security Number is never put in a web address. You will need
            to enter your answers again.
          </p>
        </div>
      ) : null}

      <form action={submitBackgroundCheckAction} className="mt-8 space-y-10">
        {/* ── Name ────────────────────────────────────────────────────── */}
        <section className="rounded-lg border border-slate-200 p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className={LABEL} htmlFor="firstName">
                First Name
                <Required />
              </label>
              <input id="firstName" name="firstName" required className={FIELD} autoComplete="given-name" />
            </div>
            <div>
              <label className={LABEL} htmlFor="middleName">
                Middle Name
                <Optional />
              </label>
              <input id="middleName" name="middleName" className={FIELD} autoComplete="additional-name" />
            </div>
            <div>
              <label className={LABEL} htmlFor="lastName">
                Last Name
                <Required />
              </label>
              <input id="lastName" name="lastName" required className={FIELD} autoComplete="family-name" />
            </div>
            <div>
              <label className={LABEL} htmlFor="suffix">
                Suffix
                <Optional />
              </label>
              <input id="suffix" name="suffix" className={FIELD} placeholder="Jr., III" />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL} htmlFor="aliases">
                Aliases
                <Optional />
              </label>
              <input
                id="aliases"
                name="aliases"
                className={FIELD}
                placeholder="Maiden name, or any other name you have used"
              />
            </div>
          </div>

          {/* ── Identity ──────────────────────────────────────────────── */}
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <label className={LABEL} htmlFor="ssn">
                Social Security Number
                <Required />
              </label>
              <input
                id="ssn"
                name="ssn"
                required
                inputMode="numeric"
                autoComplete="off"
                placeholder="123-45-6789"
                className={FIELD}
              />
              <p className="mt-1 text-xs text-slate-500">
                Required by the State of Florida. Only the last four digits are
                kept on file.
              </p>
            </div>
            <div>
              <label className={LABEL} htmlFor="dateOfBirth">
                Date of Birth
                <Required />
              </label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" required className={FIELD} />
            </div>
            <div>
              <label className={LABEL} htmlFor="placeOfBirth">
                Place of Birth
                <Required />
              </label>
              <select id="placeOfBirth" name="placeOfBirth" required defaultValue="" className={FIELD}>
                <option value="" disabled>
                  -- Please Select --
                </option>
                {PLACE_OF_BIRTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Address ───────────────────────────────────────────────── */}
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className={LABEL} htmlFor="mailingAddress">
                Mailing Address
                <Required />
              </label>
              <input id="mailingAddress" name="mailingAddress" required className={FIELD} autoComplete="street-address" />
            </div>
            <div>
              <label className={LABEL} htmlFor="aptUnitSuite">
                Apt/Unit/Suite
                <Optional />
              </label>
              <input id="aptUnitSuite" name="aptUnitSuite" className={FIELD} />
            </div>
            <div>
              <label className={LABEL} htmlFor="city">
                City
                <Required />
              </label>
              <input id="city" name="city" required className={FIELD} autoComplete="address-level2" />
            </div>
            <div>
              <label className={LABEL} htmlFor="state">
                State
                <Required />
              </label>
              <select id="state" name="state" required defaultValue="" className={FIELD}>
                <option value="" disabled>
                  -- Please Select --
                </option>
                {US_STATES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="zipCode">
                Zip Code
                <Required />
              </label>
              <input id="zipCode" name="zipCode" required inputMode="numeric" className={FIELD} autoComplete="postal-code" />
            </div>
          </div>

          {/* ── Contact ───────────────────────────────────────────────── */}
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="phoneNumber">
                Phone Number
                <Required />
              </label>
              <input id="phoneNumber" name="phoneNumber" type="tel" required className={FIELD} autoComplete="tel" />
            </div>
            <div>
              <label className={LABEL} htmlFor="emailAddress">
                Email Address
                <Required />
              </label>
              <input id="emailAddress" name="emailAddress" type="email" required className={FIELD} autoComplete="email" />
              <p className="mt-1 text-xs text-slate-500">
                The Clearinghouse will send your privacy notice here.
              </p>
            </div>
          </div>
        </section>

        {/* ── Description. No weight field: Jimmy deleted it. ─────────── */}
        <section className="rounded-lg border border-slate-200 p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className={LABEL} htmlFor="sex">
                Sex
                <Required />
              </label>
              <select id="sex" name="sex" required defaultValue="" className={FIELD}>
                <option value="" disabled>
                  -- Please Select --
                </option>
                {SEX_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="race">
                Race
                <Required />
              </label>
              <select id="race" name="race" required defaultValue="" className={FIELD}>
                <option value="" disabled>
                  -- Please Select --
                </option>
                {RACE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="hairColor">
                Hair Color
                <Required />
              </label>
              <select id="hairColor" name="hairColor" required defaultValue="" className={FIELD}>
                <option value="" disabled>
                  -- Please Select --
                </option>
                {HAIR_COLOR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="eyeColor">
                Eye Color
                <Required />
              </label>
              <select id="eyeColor" name="eyeColor" required defaultValue="" className={FIELD}>
                <option value="" disabled>
                  -- Please Select --
                </option>
                {EYE_COLOR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="height">
                Height
                <Required />
              </label>
              <select id="height" name="height" required defaultValue="" className={FIELD}>
                <option value="" disabled>
                  -- Please Select --
                </option>
                {HEIGHT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div>
          <p className="text-sm text-slate-500">
            <span className="text-red-600">*</span> = Required
          </p>
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-slate-900 px-4 py-4 text-lg font-medium text-white md:w-auto md:px-10"
          >
            Submit
          </button>
        </div>
      </form>
    </main>
  );
}

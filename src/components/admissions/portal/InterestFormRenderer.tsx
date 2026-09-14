"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitInterestFormAction } from "@/lib/admissions/interest-form/actions";
import {
  isQuestionVisible,
  isSectionVisible,
  pruneAnswersForHiddenSections,
  resolveStaticOptions,
} from "@/lib/admissions/interest-form/definition";
import {
  INTEREST_FORM_PROGRAM_OPTIONS,
  INTEREST_FORM_PROGRAM_QUESTION_HELP,
  INTEREST_FORM_PROGRAM_QUESTION_LABEL,
  normalizeInterestProgramSelections,
} from "@/lib/admissions/interest-form/program-options";
import type {
  InterestFormValues,
  InterestQuestionDefinition,
  PublishedInterestForm,
} from "@/lib/admissions/interest-form/types";
import { FundingSourceCheckboxes } from "@/components/ui/FundingSourceCheckboxes";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { checkEmailAddress } from "@/lib/admissions/email-check";
import { ageLabelFromDateOfBirth } from "@/lib/format/age";
import {
  MAX_UPLOAD_LABEL,
  checkFileBeforeUpload,
  describeUploadFailure,
} from "@/lib/admissions/interest-form/upload-limits";
import {
  portalInputClass,
  portalLabelClass,
  portalSectionClass,
} from "@/components/admissions/portal/styles";

type InterestFormRendererProps = {
  published: PublishedInterestForm;
};

function defaultValues(published: PublishedInterestForm): InterestFormValues {
  const values: InterestFormValues = {};
  for (const q of published.definition.questions) {
    if (q.defaultValue !== undefined) values[q.key] = q.defaultValue;
  }
  return values;
}



function FileQuestion({
  question,
  value,
  onChange,
}: {
  question: InterestQuestionDefinition;
  value: string;
  onChange: (key: string, next: unknown) => void;
}) {
  const id = question.key;
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function upload(file: File) {
    /**
     * Refuse before the round trip. The platform rejects an oversized body
     * before our route ever runs, so waiting for the server to say so means
     * waiting for a plain-text 413 that this function then has to guess at.
     */
    const refusal = checkFileBeforeUpload(file);
    if (refusal) {
      onChange(question.key, "");
      setFileName(null);
      setStatus("error");
      setMessage(refusal);
      return;
    }

    setStatus("uploading");
    setMessage(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/apply/upload", { method: "POST", body });

      /**
       * NOT response.json().
       *
       * This line used to be `await response.json()` with nothing guarding it.
       * When the platform refused the request it answered "Request Entity Too
       * Large" as plain text, the parse threw, and a family trying to attach
       * proof of income was shown:
       *
       *     Unexpected token 'R', "Request En"... is not valid JSON
       *
       * Read the body as text first, parse only if it parses, and let the
       * status decide the wording when it does not.
       */
      const raw = await response.text();
      let result: { path?: string; fileName?: string; error?: string } = {};
      try {
        result = raw ? (JSON.parse(raw) as typeof result) : {};
      } catch {
        console.error(
          `[apply/upload] non-JSON response, status ${response.status}:`,
          raw.slice(0, 200)
        );
      }

      if (!response.ok || !result.path) {
        throw new Error(result.error ?? describeUploadFailure(response.status));
      }
      onChange(question.key, result.path);
      setFileName(result.fileName ?? file.name);
      setStatus("idle");
    } catch (err) {
      // The answer is cleared on failure. Leaving a previous path in place
      // would tell the family their new file was accepted when it was not.
      onChange(question.key, "");
      setFileName(null);
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "We could not save that file.");
    }
  }

  return (
    <div className="sm:col-span-2">
      <label className={portalLabelClass} htmlFor={id}>
        {question.label}
        {question.required ? " *" : ""}
      </label>
      {question.helpText ? (
        <p className="mt-1 text-sm text-slate-500">{question.helpText}</p>
      ) : null}

      <input
        id={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
        // Disabled while a file is in flight. A phone photograph can take
        // several seconds on a bad connection, and choosing a second file
        // mid-upload leaves two requests racing for one answer.
        disabled={status === "uploading"}
        className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {/* What actually submits. `required` lives here so an empty upload fails
          the same way an empty text box does. */}
      <input type="hidden" name={id} value={value} required={question.required} />

      {status === "uploading" && (
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-600" role="status">
          <span
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
          Uploading…
        </p>
      )}
      {status === "error" && message && (
        <p className="mt-1 text-sm text-red-700" role="alert">
          {message}
        </p>
      )}
      {value && fileName && status === "idle" && (
        <p className="mt-1 text-sm text-emerald-700">Attached: {fileName}</p>
      )}
      <p className="mt-1 text-xs text-slate-400">
        PDF, JPG or PNG, up to {MAX_UPLOAD_LABEL}.
      </p>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  schools,
}: {
  question: InterestQuestionDefinition;
  value: unknown;
  onChange: (key: string, next: unknown) => void;
  schools: readonly { id: string; name: string }[];
}) {
  const id = question.key;
  const label = (
    <label className={portalLabelClass} htmlFor={id}>
      {question.label}
      {question.required ? " *" : ""}
    </label>
  );

  if (question.type === "school_selector") {
    return (
      <div>
        {label}
        <select
          id={id}
          name={id}
          required={question.required}
          className={portalInputClass}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(question.key, e.target.value)}
        >
          <option value="" disabled>
            Select school
          </option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (question.type === "program_selector") {
    const selected = new Set(normalizeInterestProgramSelections(value));
    /**
     * The network's five programme types are the default, not the law. A
     * campus that runs two of them says so in its own question, and the
     * validator holds the server to the same narrower list.
     */
    const programOptions = question.options?.length
      ? question.options
      : INTEREST_FORM_PROGRAM_OPTIONS;
    return (
      <div className="sm:col-span-2">
        <fieldset>
          <legend className={portalLabelClass}>
            {INTEREST_FORM_PROGRAM_QUESTION_LABEL}
            {question.required ? " *" : ""}
          </legend>
          <p className="mt-1 text-sm text-slate-500">
            {question.helpText ?? INTEREST_FORM_PROGRAM_QUESTION_HELP}
          </p>
          <div className="mt-3 grid gap-2">
            {programOptions.map((option) => {
              const checked = selected.has(option.value);
              const optionId = `${id}-${option.value}`;
              return (
                <label
                  key={option.value}
                  htmlFor={optionId}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    checked
                      ? "border-brand-500 bg-brand-50 text-slate-900"
                      : "border-slate-100 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    id={optionId}
                    name={id}
                    type="checkbox"
                    value={option.value}
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(option.value);
                      else next.delete(option.value);
                      onChange(question.key, [...next]);
                    }}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    );
  }

  if (question.type === "multiselect" && question.optionSource === "funding_sources") {
    return (
      <div className="sm:col-span-2">
        <FundingSourceCheckboxes />
      </div>
    );
  }

  /**
   * Every other multiselect — a checkbox group from the question's own options.
   *
   * Until v3 the only multiselect on any published form was funding sources,
   * which has its own component above. A multiselect defined with plain
   * `options` fell through every branch here and landed on the generic text
   * input at the bottom of this function: a single-line box, for a question
   * whose answer is a list. It would have looked like it worked.
   *
   * `required` is enforced by the submit validator rather than by the inputs.
   * Putting `required` on each checkbox would demand all ten be ticked; putting
   * it on none leaves the browser silent. The server already rejects an empty
   * required answer, so the honest thing is to let it.
   */
  if (question.type === "multiselect") {
    const options = resolveStaticOptions(question);
    const selected = new Set(
      Array.isArray(value) ? (value as unknown[]).map((entry) => String(entry)) : []
    );

    return (
      <div className="sm:col-span-2">
        <fieldset>
          <legend className={portalLabelClass}>
            {question.label}
            {question.required ? " *" : ""}
          </legend>
          {question.helpText ? (
            <p className="mt-1 text-sm text-slate-500">{question.helpText}</p>
          ) : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const optionId = `${id}-${option.value}`;
              const checked = selected.has(option.value);
              return (
                <label
                  key={option.value}
                  htmlFor={optionId}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    id={optionId}
                    // The form submits `new FormData(form)`, so an input
                    // without a name is invisible to it. Repeated keys are
                    // collected into an array by formDataToInterestValues.
                    name={question.key}
                    value={option.value}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(option.value);
                      else next.delete(option.value);
                      onChange(question.key, [...next]);
                    }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    );
  }

  if (question.type === "rich_text") {
    return (
      <div className="sm:col-span-2">
        {label}
        <textarea
          id={id}
          name={id}
          rows={3}
          className={portalInputClass}
          placeholder={question.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(question.key, e.target.value)}
          required={question.required}
        />
      </div>
    );
  }

  if (question.type === "select") {
    const options = resolveStaticOptions(question);
    return (
      <div>
        {label}
        <select
          id={id}
          name={id}
          className={portalInputClass}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(question.key, e.target.value)}
          required={question.required}
        >
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (question.type === "boolean" || question.type === "consent") {
    return (
      <div className="flex items-center gap-2 sm:col-span-2">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(question.key, e.target.checked)}
          required={question.required}
        />
        <label className={portalLabelClass} htmlFor={id}>
          {question.label}
          {question.required ? " *" : ""}
        </label>
      </div>
    );
  }

  const inputType =
    question.type === "email"
      ? "email"
      : question.type === "phone"
        ? "tel"
        : question.type === "date"
          ? "date"
          : question.type === "number" || question.type === "currency"
            ? "number"
            : "text";

  const text = typeof value === "string" || typeof value === "number" ? value : "";

  /**
   * A "did you mean" hint, for email fields only.
   *
   * Two addresses reached production through this form that its validation
   * could not catch, because both were perfectly well-formed and simply
   * addressed to the wrong place: `yahoo.con`, which bounced every message
   * since August, and `gmil.com`, which did not bounce at all.
   *
   * The hint SUGGESTS. It never blocks and never rewrites what was typed. A
   * parent on an unusual domain must be able to submit, and refusing a real
   * address is worse than accepting a typo — a typo can be corrected by anyone
   * who notices it, but a family told their email is invalid simply leaves.
   */
  const emailHint =
    question.type === "email" && typeof text === "string" && text.trim() !== ""
      ? checkEmailAddress(text)
      : null;

  /**
   * Age, shown back to the parent as they type the birthdate.
   *
   * It is not a field and it is not submitted. Asking for both a birthdate and
   * an age invites them to disagree, and the age is the one that goes stale.
   * Showing the derived value is also the cheapest possible check on a typo —
   * a parent who meant 2011 and typed 2001 sees "24 years old" under a
   * kindergarten application and fixes it themselves.
   */
  const ageHint =
    question.type === "date" && typeof text === "string" && text.trim() !== ""
      ? ageLabelFromDateOfBirth(text)
      : null;

  /**
   * Money gets a dollar sign, and it sits INSIDE the field rather than in the
   * label. A parent reading an award letter is copying a figure across; the
   * symbol beside the box they are typing into is what tells them the box wants
   * dollars, and a label saying "amount ($)" is read once and then forgotten
   * while they type.
   *
   * The input stays type="number" — the symbol is decoration, not a character
   * anyone has to type or delete. The submit validator strips a typed "$" and
   * any commas anyway, because a parent copying "$10,463.00" is reading
   * correctly and should not be told they are wrong.
   */
  /**
   * A statement, and the name the person types to stand behind it.
   *
   * The statement is the label and it is rendered in full, as body text rather
   * than as a form label, because it is something to read rather than a caption
   * on a box. Long text set in a small grey label is text nobody reads, and an
   * unread acknowledgement is worth nothing to anybody.
   *
   * No date field. The submission already records `submitted_at`, and a second
   * date the parent can type is a date that can disagree with the record.
   */
  /**
   * A document upload, for a family who has no account yet.
   *
   * The file goes to /api/apply/upload the moment it is chosen, and what is
   * kept in the form is the storage path that route returns. Uploading on
   * choose rather than on submit means a parent learns their file is too large
   * while they are still looking at the field, instead of after filling in
   * everything else.
   *
   * The hidden input is what actually submits. The file input itself has no
   * name, deliberately — a File in the FormData would be a second copy of a
   * document already in storage, and a request body large enough to be refused.
   */
  if (question.type === "file") {
    return (
      <FileQuestion
        question={question}
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
      />
    );
  }

  if (question.type === "signature") {
    return (
      <div className="sm:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {/**
            * The wording a family is signing. Omitted when the question has no
            * label of its own, because from v18 the GA GOAL text lives in the
            * section description above this box — and rendering the label
            * anyway printed a second, unbolded "Signature" above the real one.
            */}
          {question.label ? (
            <p className="text-sm leading-relaxed text-slate-800">{question.label}</p>
          ) : null}
          <div className={question.label ? "mt-4" : undefined}>
            <label className={portalLabelClass} htmlFor={id}>
              Signature{question.required ? " *" : ""}
            </label>
            <input
              id={id}
              name={id}
              type="text"
              autoComplete="name"
              className={portalInputClass}
              placeholder="Type your full name"
              value={text}
              onChange={(e) => onChange(question.key, e.target.value)}
              required={question.required}
            />
            {/**
              * No "Typing your full name here is your signature, dated today."
              * It sat under every signature box on the form, and by the GA GOAL
              * block the section above it already ends "Type your signature
              * below acknowledging that you have read and understand..." — the
              * same instruction, twice, in smaller grey type.
              */}
          </div>
        </div>
      </div>
    );
  }

  if (question.type === "currency") {
    return (
      <div>
        {label}
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500"
          >
            $
          </span>
          <input
            id={id}
            name={id}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className={`${portalInputClass} pl-7`}
            placeholder={question.placeholder}
            value={text}
            onChange={(e) => onChange(question.key, e.target.value)}
            required={question.required}
          />
        </div>
        {question.helpText ? (
          <p className="mt-1 text-sm text-slate-500">{question.helpText}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {label}
      <input
        id={id}
        name={id}
        type={inputType}
        className={portalInputClass}
        placeholder={question.placeholder}
        value={text}
        onChange={(e) => onChange(question.key, e.target.value)}
        required={question.required}
        aria-describedby={
          emailHint && emailHint.kind !== "ok"
            ? `${id}-hint`
            : ageHint
              ? `${id}-age`
              : undefined
        }
      />
      {ageHint ? (
        <p id={`${id}-age`} className="mt-1 text-sm text-slate-600">
          {ageHint}
        </p>
      ) : null}
      {emailHint && emailHint.kind === "suggest" ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-amber-800">
          Did you mean{" "}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => onChange(question.key, emailHint.suggestion)}
          >
            {emailHint.suggestion}
          </button>
          ? You can keep what you typed.
        </p>
      ) : null}
      {emailHint && emailHint.kind === "invalid" ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-amber-800">
          {emailHint.reason}
        </p>
      ) : null}
    </div>
  );
}

export function InterestFormRenderer({ published }: InterestFormRendererProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<InterestFormValues>(() => defaultValues(published));

  /*
   * "Submit Inquiry", not "Submit Application".
   *
   * Jimmy, 14 September, after walking the live form as a parent:
   * "this is an interest inquiry. not application."
   *
   * The distinction is the family's, not ours. This form starts a conversation;
   * the application is the wizard behind the portal, after they have an account
   * and a campus. Calling this an application tells a parent they have applied
   * when they have not, and the email they get back is a thank-you for an
   * inquiry — so the two would have contradicted each other.
   *
   * The label appears TWICE in this file: here for the busy/feedback state, and
   * on the button itself below. Both must say the same thing. They are the kind
   * of pair that drifts, and a button that changes its wording halfway through
   * submitting reads as a bug to the person it happens to.
   */
  const action = useActionFeedback({
    verb: "submit",
    labels: { idle: "Submit Inquiry", loading: "Submitting…", success: "✓ Submitted" },
    successToast: "✓ Submitted",
    errorToast: "Unable to submit.",
    progressLabel: "Submitting inquiry…",
    onError: (err) => setError(err.message),
  });

  function setField(key: string, next: unknown) {
    setValues((prev) => {
      const merged = { ...prev, [key]: next };
      return key === "school_id"
        ? pruneAnswersForHiddenSections(published.definition, merged)
        : merged;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("form_version_id", published.formVersionId);
    formData.set("source", "express_interest");

    void action.run(async () => {
      const result = await submitInterestFormAction(formData);
      if ("error" in result && result.error) throw new Error(result.error);
      router.push(`/apply/thank-you?lead=${"leadId" in result ? result.leadId : ""}`);
      return result;
    });
  }

  const sections = [...published.definition.sections].sort((a, b) => a.order - b.order);

  return (
    <form onSubmit={handleSubmit} className={`${portalSectionClass} space-y-8`}>
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <input type="hidden" name="form_version_id" value={published.formVersionId} />

      {sections.map((section) => {
        if (!isSectionVisible(section, values)) return null;
        const questions = section.questionKeys
          .map((key) => published.definition.questions.find((q) => q.key === key))
          .filter((q): q is InterestQuestionDefinition => Boolean(q))
          .filter((q) => isQuestionVisible(q, values, true));

        if (!questions.length) return null;

        return (
          <section key={section.key} className="space-y-4">
            {/**
              * A section with neither title nor description renders no heading
              * at all. Until v18 the <h2> was unconditional, so an empty title
              * left a blank heading holding vertical space — which is what a
              * section used purely to group questions needs to avoid. The GA
              * campus block is split into three for that reason: one of them
              * carries the GA GOAL heading, the other two carry nothing.
              */}
            {section.title || section.description ? (
              <div>
                {section.title ? (
                  <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                ) : null}
                {section.description ? (
                  <p className="text-sm text-slate-500">{section.description}</p>
                ) : null}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {questions.map((question) => (
                <QuestionField
                  key={question.key}
                  question={question}
                  value={values[question.key]}
                  onChange={setField}
                  schools={published.schools}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Large, centred, and in the network's blue.
          Not full width: ActionChip wraps every button in an inline-flex,
          items-start container, so w-full on the button resolves against a
          shrink-to-fit parent and does nothing. Not utility classes for the
          colour either - ActionChip joins its class strings without conflict
          resolution, so `bg-academy` against the variant's own background is
          settled by whichever rule the stylesheet emits last. That is how this
          page shipped with white text on a white button. `.btn-academy` is a
          real rule declared after the Tailwind import, which wins by order. */}
      <div className="flex justify-center pt-2">
        <ActionButton
          type="submit"
          size="lg"
          variant="primary"
          status={action.status}
          verb="submit"
          labels={{ idle: "Submit Inquiry", loading: "Submitting…", success: "✓ Submitted" }}
          errorMessage={action.errorMessage}
          className="btn-academy rounded-xl px-12 py-4 text-lg font-semibold"
        />
      </div>
    </form>
  );
}

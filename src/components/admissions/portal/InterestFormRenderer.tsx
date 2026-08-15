"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  listInterestProgramsAction,
  submitInterestFormAction,
} from "@/lib/admissions/interest-form/actions";
import {
  isQuestionVisible,
  isSectionVisible,
  resolveStaticOptions,
} from "@/lib/admissions/interest-form/definition";
import type {
  InterestFormValues,
  InterestProgramOption,
  InterestQuestionDefinition,
  PublishedInterestForm,
} from "@/lib/admissions/interest-form/types";
import { FundingSourceCheckboxes } from "@/components/ui/FundingSourceCheckboxes";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
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

function QuestionField({
  question,
  value,
  onChange,
  schools,
  programs,
  programsLoading,
}: {
  question: InterestQuestionDefinition;
  value: unknown;
  onChange: (key: string, next: unknown) => void;
  schools: readonly { id: string; name: string }[];
  programs: readonly InterestProgramOption[];
  programsLoading: boolean;
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
          disabled={programsLoading}
        >
          <option value="">Select program</option>
          {programs.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
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
          : question.type === "number"
            ? "number"
            : "text";

  return (
    <div>
      {label}
      <input
        id={id}
        name={id}
        type={inputType}
        className={portalInputClass}
        placeholder={question.placeholder}
        value={typeof value === "string" || typeof value === "number" ? value : ""}
        onChange={(e) => onChange(question.key, e.target.value)}
        required={question.required}
      />
    </div>
  );
}

export function InterestFormRenderer({ published }: InterestFormRendererProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<InterestFormValues>(() => defaultValues(published));
  const [programs, setPrograms] = useState<InterestProgramOption[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [, startTransition] = useTransition();

  const action = useActionFeedback({
    verb: "submit",
    labels: { idle: "Submit Inquiry", loading: "Submitting…", success: "✓ Submitted" },
    successToast: "✓ Submitted",
    errorToast: "Unable to submit.",
    progressLabel: "Submitting inquiry…",
    onError: (err) => setError(err.message),
  });

  const schoolId = typeof values.school_id === "string" ? values.school_id : "";

  useEffect(() => {
    if (!schoolId) {
      setPrograms([]);
      return;
    }
    let cancelled = false;
    setProgramsLoading(true);
    startTransition(() => {
      void listInterestProgramsAction(schoolId).then((rows) => {
        if (cancelled) return;
        setPrograms(rows);
        setProgramsLoading(false);
        setValues((prev) => {
          const current = typeof prev.program === "string" ? prev.program : "";
          if (current && !rows.some((r) => r.code === current)) {
            return { ...prev, program: "" };
          }
          return prev;
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  function setField(key: string, next: unknown) {
    setValues((prev) => ({ ...prev, [key]: next }));
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
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              {section.description ? (
                <p className="text-sm text-slate-500">{section.description}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {questions.map((question) => (
                <QuestionField
                  key={question.key}
                  question={question}
                  value={values[question.key]}
                  onChange={setField}
                  schools={published.schools}
                  programs={programs}
                  programsLoading={programsLoading}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="flex justify-end">
        <ActionButton
          type="submit"
          status={action.status}
          verb="submit"
          labels={{ idle: "Submit Inquiry", loading: "Submitting…", success: "✓ Submitted" }}
          errorMessage={action.errorMessage}
        />
      </div>
    </form>
  );
}

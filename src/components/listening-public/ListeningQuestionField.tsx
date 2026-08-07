"use client";

import type { ListeningRespondentQuestion } from "@/lib/platform/listening";

export function ListeningQuestionField({
  question,
  value,
  onChange,
  error,
}: {
  readonly question: ListeningRespondentQuestion;
  readonly value: unknown;
  readonly onChange: (value: unknown) => void;
  readonly error?: string | null;
}) {
  const fieldId = `q-${question.id}`;
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;

  return (
    <fieldset
      className="space-y-3"
      data-testid="listening-question-field"
      data-question-type={question.questionType}
      aria-describedby={[question.helpText ? helpId : null, error ? errorId : null]
        .filter(Boolean)
        .join(" ") || undefined}
    >
      <legend className="text-base font-medium text-[var(--lp-text)]">
        <span className="mr-2 text-[var(--lp-muted)]">{question.number}.</span>
        {question.prompt}
        {question.required ? (
          <span className="ml-1 text-[var(--lp-danger)]" aria-hidden="true">
            *
          </span>
        ) : null}
        {question.required ? (
          <span className="sr-only"> (required)</span>
        ) : null}
      </legend>

      {question.helpText ? (
        <p id={helpId} className="text-sm text-[var(--lp-muted)]">
          {question.helpText}
        </p>
      ) : null}

      {question.questionType === "short_text" ? (
        <input
          id={fieldId}
          name={fieldId}
          type="text"
          value={value == null ? "" : String(value)}
          placeholder={question.placeholder || undefined}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-required={question.required || undefined}
          className="w-full rounded-md border border-[var(--lp-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--lp-text)] outline-none focus:border-[var(--lp-accent)]"
        />
      ) : null}

      {question.questionType === "long_text" ? (
        <textarea
          id={fieldId}
          name={fieldId}
          rows={4}
          value={value == null ? "" : String(value)}
          placeholder={question.placeholder || undefined}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-required={question.required || undefined}
          className="w-full rounded-md border border-[var(--lp-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--lp-text)] outline-none focus:border-[var(--lp-accent)]"
        />
      ) : null}

      {question.questionType === "numeric" ? (
        <input
          id={fieldId}
          name={fieldId}
          type="number"
          value={value == null || value === "" ? "" : String(value)}
          min={question.min ?? undefined}
          max={question.max ?? undefined}
          step={question.step ?? undefined}
          placeholder={question.placeholder || undefined}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          aria-invalid={error ? true : undefined}
          aria-required={question.required || undefined}
          className="w-full max-w-[12rem] rounded-md border border-[var(--lp-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--lp-text)] outline-none focus:border-[var(--lp-accent)]"
        />
      ) : null}

      {(question.questionType === "single_choice" ||
        question.questionType === "likert") && (
        <div className="space-y-2" role="radiogroup" aria-labelledby={fieldId}>
          {question.questionType === "likert" &&
          (question.likertLowLabel || question.likertHighLabel) ? (
            <div className="flex justify-between text-xs text-[var(--lp-muted)]">
              <span>{question.likertLowLabel || ""}</span>
              <span>{question.likertHighLabel || ""}</span>
            </div>
          ) : null}
          {question.options.map((opt) => {
            const optId = `${fieldId}-${opt.optionKey}`;
            return (
              <label
                key={opt.id}
                htmlFor={optId}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--lp-border)] px-3 py-2.5 text-sm has-[:focus-visible]:border-[var(--lp-accent)]"
              >
                <input
                  id={optId}
                  type="radio"
                  name={fieldId}
                  value={opt.optionKey}
                  checked={String(value ?? "") === opt.optionKey}
                  onChange={() => onChange(opt.optionKey)}
                  aria-required={question.required || undefined}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.questionType === "multi_choice" ? (
        <div className="space-y-2" role="group" aria-labelledby={fieldId}>
          {question.options.map((opt) => {
            const optId = `${fieldId}-${opt.optionKey}`;
            const selected = Array.isArray(value)
              ? value.includes(opt.optionKey)
              : false;
            return (
              <label
                key={opt.id}
                htmlFor={optId}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--lp-border)] px-3 py-2.5 text-sm has-[:focus-visible]:border-[var(--lp-accent)]"
              >
                <input
                  id={optId}
                  type="checkbox"
                  name={fieldId}
                  value={opt.optionKey}
                  checked={selected}
                  onChange={() => {
                    const current = Array.isArray(value)
                      ? value.map(String)
                      : [];
                    if (selected) {
                      onChange(current.filter((k) => k !== opt.optionKey));
                    } else {
                      onChange([...current, opt.optionKey]);
                    }
                  }}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <p id={errorId} className="text-sm text-[var(--lp-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

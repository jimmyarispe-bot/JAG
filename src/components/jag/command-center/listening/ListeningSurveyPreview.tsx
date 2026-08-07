"use client";

import {
  buildSurveyPreviewModel,
  type ListeningAuthoringQuestion,
  type ListeningSection,
} from "@/lib/platform/listening";

/**
 * Read-only respondent-shaped preview. No token. No submit.
 */
export function ListeningSurveyPreview({
  title,
  introduction,
  sections,
  questions,
}: {
  readonly title: string;
  readonly introduction?: string;
  readonly sections: readonly ListeningSection[];
  readonly questions: readonly ListeningAuthoringQuestion[];
}) {
  const model = buildSurveyPreviewModel({
    title,
    introduction,
    sections,
    questions,
  });

  return (
    <div
      className="mx-auto max-w-2xl space-y-8"
      data-testid="listening-survey-preview"
    >
      <header className="space-y-2 border-b border-[var(--jag-border)] pb-6">
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--jag-muted)]">
          Preview · read only
        </p>
        <h1 className="text-2xl font-medium text-[var(--jag-text)]">
          {model.title}
        </h1>
        {model.introduction ? (
          <p className="text-sm leading-relaxed text-[var(--jag-muted)]">
            {model.introduction}
          </p>
        ) : null}
        <p className="text-xs text-[var(--jag-muted-2)]">
          {model.questionCount} questions · about {model.estimatedMinutes} min
        </p>
      </header>

      {model.blocks.map((block, bi) => (
        <section key={block.section?.id ?? `ungrouped-${bi}`} className="space-y-5">
          {block.section ? (
            <div>
              <h2 className="text-lg font-medium text-[var(--jag-text)]">
                {block.section.title}
              </h2>
              {block.section.description ? (
                <p className="mt-1 text-sm text-[var(--jag-muted)]">
                  {block.section.description}
                </p>
              ) : null}
            </div>
          ) : null}

          {block.questions.map((q) => (
            <fieldset
              key={q.id}
              disabled
              className="space-y-2 opacity-95"
              aria-disabled="true"
            >
              <legend className="text-sm font-medium text-[var(--jag-text)]">
                <span className="mr-2 text-[var(--jag-muted)]">{q.number}.</span>
                {q.prompt}
                {q.required ? (
                  <span className="ml-1 text-red-400" aria-label="required">
                    *
                  </span>
                ) : null}
              </legend>
              {q.helpText ? (
                <p className="text-xs text-[var(--jag-muted)]">{q.helpText}</p>
              ) : null}

              {q.questionType === "short_text" ||
              q.questionType === "long_text" ? (
                q.questionType === "long_text" ? (
                  <textarea
                    rows={3}
                    disabled
                    placeholder={q.config.placeholder || ""}
                    defaultValue={
                      q.config.defaultValue != null
                        ? String(q.config.defaultValue)
                        : ""
                    }
                    className="w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2 text-sm"
                  />
                ) : (
                  <input
                    disabled
                    placeholder={q.config.placeholder || ""}
                    defaultValue={
                      q.config.defaultValue != null
                        ? String(q.config.defaultValue)
                        : ""
                    }
                    className="w-full rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2 text-sm"
                  />
                )
              ) : null}

              {q.questionType === "numeric" ? (
                <input
                  type="number"
                  disabled
                  min={q.config.min ?? undefined}
                  max={q.config.max ?? undefined}
                  step={q.config.step ?? undefined}
                  placeholder={q.config.placeholder || ""}
                  className="w-40 rounded-md border border-[var(--jag-border)] bg-transparent px-3 py-2 text-sm"
                />
              ) : null}

              {(q.questionType === "single_choice" ||
                q.questionType === "likert") && (
                <div className="space-y-2">
                  {q.questionType === "likert" &&
                  (q.config.likertLowLabel || q.config.likertHighLabel) ? (
                    <div className="flex justify-between text-xs text-[var(--jag-muted)]">
                      <span>{q.config.likertLowLabel || ""}</span>
                      <span>{q.config.likertHighLabel || ""}</span>
                    </div>
                  ) : null}
                  {q.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 text-sm text-[var(--jag-muted)]"
                    >
                      <input type="radio" disabled name={q.id} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              {q.questionType === "multi_choice" ? (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 text-sm text-[var(--jag-muted)]"
                    >
                      <input type="checkbox" disabled />
                      {opt.label}
                    </label>
                  ))}
                </div>
              ) : null}
            </fieldset>
          ))}
        </section>
      ))}

      {model.questionCount === 0 ? (
        <p className="text-sm text-[var(--jag-muted)]">
          No questions to preview yet.
        </p>
      ) : (
        <button
          type="button"
          disabled
          className="rounded-md bg-[var(--jag-accent)] px-4 py-2 text-sm text-white opacity-50"
        >
          Submit (preview only)
        </button>
      )}
    </div>
  );
}

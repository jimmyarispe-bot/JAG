"use client";

import { useMemo, useState } from "react";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import {
  discardFormDraftAction,
  publishFormDraftAction,
  saveFormDraftTextAction,
} from "@/lib/admissions/interest-form/form-builder-actions";
import type { TextEdits } from "@/lib/admissions/interest-form/text-edits";
import type { InterestFormDefinition } from "@/lib/admissions/interest-form/types";

/**
 * Changing what the form SAYS.
 *
 * ONLY WORDS ARE EDITABLE HERE, and the screen shows why rather than hiding
 * it: a question's key and type sit beside its label, greyed, because those
 * are what every answer already recorded hangs off. Ship three adds
 * structure; conflating the two would let a wording fix quietly detach a
 * year of submissions from the questions they answered.
 *
 * NOTHING HERE IS LIVE. Every edit goes into the working draft. The form
 * families are filling in right now keeps serving the published version until
 * somebody presses Publish, which is a separate button with its own sentence.
 */
export function FormWordingEditor({
  formId,
  draftVersionNumber,
  definition,
  campusNames,
}: {
  formId: string;
  draftVersionNumber: number;
  definition: InterestFormDefinition;
  campusNames: Record<string, string>;
}) {
  const [formTitle, setFormTitle] = useState(definition.title);
  const [sections, setSections] = useState<Record<string, { title: string; description: string }>>(
    () =>
      Object.fromEntries(
        definition.sections.map((s) => [s.key, { title: s.title, description: s.description ?? "" }])
      )
  );
  const [questions, setQuestions] = useState<
    Record<
      string,
      {
        label: string;
        helpText: string;
        placeholder: string;
        required: boolean;
        optionLabels: Record<string, string>;
      }
    >
  >(() =>
    Object.fromEntries(
      definition.questions.map((q) => [
        q.key,
        {
          label: q.label,
          helpText: q.helpText ?? "",
          placeholder: q.placeholder ?? "",
          required: q.required,
          optionLabels: Object.fromEntries((q.options ?? []).map((o) => [o.value, o.label])),
        },
      ])
    )
  );

  const questionByKey = useMemo(
    () => new Map(definition.questions.map((q) => [q.key, q])),
    [definition.questions]
  );

  const edits: TextEdits = { formTitle, sections, questions };

  const saveLabels = { idle: "Save wording", loading: "Saving…", success: "✓ Saved to draft" };
  const save = useActionFeedback({
    verb: "custom",
    labels: saveLabels,
    successToast: "Saved to the draft. Families still see the live version.",
    errorToast: "Nothing was saved.",
    progressLabel: "Saving…",
  });

  const publishLabels = { idle: "Publish", loading: "Publishing…", success: "✓ Live" };
  const publish = useActionFeedback({
    verb: "custom",
    labels: publishLabels,
    successToast: "Published. Families see the new wording now.",
    errorToast: "Nothing was published.",
    progressLabel: "Publishing…",
  });

  const discardLabels = { idle: "Discard draft", loading: "Discarding…", success: "✓ Discarded" };
  const discard = useActionFeedback({
    verb: "custom",
    labels: discardLabels,
    successToast: "Draft discarded. The live form is unchanged.",
    errorToast: "The draft was not discarded.",
    progressLabel: "Discarding…",
  });

  const field =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <div className="text-sm text-amber-900">
          <p className="font-semibold">You are editing draft v{draftVersionNumber}.</p>
          <p>
            Nothing here reaches a family until you publish. Keys, types and campus rules are
            fixed in this view — only the words change.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            status={save.status}
            variant="primary"
            size="sm"
            errorMessage={save.errorMessage}
            labels={saveLabels}
            onClick={() =>
              void save.run(async () => {
                const result = await saveFormDraftTextAction(formId, edits);
                if (result && "error" in result) throw new Error(result.error);
                return { success: true };
              })
            }
          />
          <ActionButton
            status={publish.status}
            variant="secondary"
            size="sm"
            errorMessage={publish.errorMessage}
            labels={publishLabels}
            onClick={() =>
              void publish.run(async () => {
                /* Save first, then publish. Pressing Publish with unsaved
                   edits on screen and publishing the last saved draft would
                   put out wording the person is not looking at. */
                const saved = await saveFormDraftTextAction(formId, edits);
                if (saved && "error" in saved) throw new Error(saved.error);
                const result = await publishFormDraftAction(formId);
                if (result && "error" in result) throw new Error(result.error);
                return { success: true };
              })
            }
          />
          <ActionButton
            status={discard.status}
            variant="ghost"
            size="sm"
            errorMessage={discard.errorMessage}
            labels={discardLabels}
            onClick={() =>
              void discard.run(async () => {
                const result = await discardFormDraftAction(formId);
                if (result && "error" in result) throw new Error(result.error);
                return { success: true };
              })
            }
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <label className="block text-sm">
          <span className="font-medium text-slate-900">Form title</span>
          <input
            className={`mt-1 ${field}`}
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />
        </label>
      </div>

      {[...definition.sections]
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <section
            key={section.key}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <header className="space-y-2 border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Section
                </span>
                <span className="font-mono text-xs text-slate-400">{section.key}</span>
              </div>
              <input
                className={field}
                value={sections[section.key]?.title ?? ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    [section.key]: { ...prev[section.key], title: e.target.value },
                  }))
                }
                aria-label={`Title of section ${section.key}`}
              />
              <textarea
                className={field}
                rows={2}
                placeholder="Description (optional — clear it to remove)"
                value={sections[section.key]?.description ?? ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    [section.key]: { ...prev[section.key], description: e.target.value },
                  }))
                }
                aria-label={`Description of section ${section.key}`}
              />
            </header>

            <div className="divide-y divide-slate-100">
              {section.questionKeys.map((key) => {
                const q = questionByKey.get(key);
                if (!q) {
                  return (
                    <p key={key} className="px-5 py-3 text-sm text-amber-800">
                      This section lists <span className="font-mono">{key}</span>, and the form has
                      no such question.
                    </p>
                  );
                }
                const state = questions[key];
                return (
                  <div key={key} className="space-y-2 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono">{q.key}</span>
                      <span>·</span>
                      <span>{q.type}</span>
                      <span>·</span>
                      {/* The only structural control on this screen. It reads
                          as a question about families rather than as a schema
                          setting, because that is the decision being made. */}
                      <label className="flex items-center gap-1 text-slate-600">
                        <input
                          type="checkbox"
                          checked={state?.required ?? false}
                          onChange={(e) =>
                            setQuestions((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], required: e.target.checked },
                            }))
                          }
                          aria-label={`Families must answer ${key}`}
                        />
                        families must answer
                      </label>
                      {q.optionSource ? (
                        <>
                          <span>·</span>
                          <span>choices from {q.optionSource}</span>
                        </>
                      ) : null}
                    </div>

                    <input
                      className={field}
                      value={state?.label ?? ""}
                      onChange={(e) =>
                        setQuestions((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], label: e.target.value },
                        }))
                      }
                      aria-label={`Label of question ${key}`}
                    />

                    <input
                      className={`${field} text-slate-600`}
                      placeholder="Help text (optional — clear it to remove)"
                      value={state?.helpText ?? ""}
                      onChange={(e) =>
                        setQuestions((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], helpText: e.target.value },
                        }))
                      }
                      aria-label={`Help text for question ${key}`}
                    />

                    {q.options && q.options.length > 0 ? (
                      <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">
                          Choices — the wording changes, the stored answer does not.
                        </p>
                        {q.options.map((option) => (
                          <div key={option.value} className="flex items-center gap-2">
                            <span className="w-40 shrink-0 font-mono text-xs text-slate-400">
                              {option.value}
                            </span>
                            <input
                              className={`${field} bg-white`}
                              value={state?.optionLabels?.[option.value] ?? ""}
                              onChange={(e) =>
                                setQuestions((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key],
                                    optionLabels: {
                                      ...prev[key].optionLabels,
                                      [option.value]: e.target.value,
                                    },
                                  },
                                }))
                              }
                              aria-label={`Label for the ${option.value} choice of ${key}`}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

      {/* Campus rules are shown, never edited here - they are structure, and
          ship four is where they change. Printing them keeps the person from
          editing a section's words without knowing who reads them. */}
      <p className="px-1 text-xs text-slate-500">
        Campus visibility, question order, question types and answer values are not editable on
        this screen — only the words and whether an answer is required.{" "}
        {Object.keys(campusNames).length} campuses are known to this form.
      </p>
    </div>
  );
}

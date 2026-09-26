/**
 * Changing the WORDS of a form, and nothing else.
 *
 * SHIP TWO OF FOUR. Ship one made the live form readable; this makes its
 * wording editable without a migration. Almost every change asked of this
 * form in September was a sentence: a label that confused a parent, help text
 * that needed a caveat, a section title that said the wrong thing.
 *
 * THE GUARD IS THE POINT, AND IT IS WHY THIS FILE IS PURE.
 *
 * A question's `key` is what a submission stores its answer under, and an
 * option's `value` is what that answer IS. Change either and every answer
 * already recorded against it becomes uninterpretable - not wrong in a way
 * anybody would see, but silently detached from the question it answered.
 * 22 versions of this form exist precisely so old submissions stay readable;
 * an editor that could rename a key would defeat the whole arrangement.
 *
 * So: labels, titles, descriptions, help text, placeholders and option LABELS
 * may change. Keys, values, types, order, required-ness, visibility rules and
 * the set of questions may not. applyTextEdits enforces that by construction -
 * it copies the original and overwrites only the text fields - and
 * onlyTextChanged proves it afterwards, so the rule is checked rather than
 * trusted, before anything is written.
 *
 * WHY OPTION LABELS COUNT AS WORDS. "Black or African American" is a label
 * over a stable value. Reading the label as structure would mean a typo in a
 * race option needed a migration, which is the thing this ship exists to end.
 */

import type {
  InterestFormDefinition,
  InterestQuestionDefinition,
  InterestSectionDefinition,
} from "@/lib/admissions/interest-form/types";

/** Every piece of text a person may change, addressed by where it lives. */
export type TextEdits = {
  /** The form's own title. */
  readonly formTitle?: string;
  /** section key -> { title, description } */
  readonly sections?: Readonly<
    Record<string, { title?: string; description?: string }>
  >;
  /** question key -> { label, helpText, placeholder, options: value -> label } */
  readonly questions?: Readonly<
    Record<
      string,
      {
        label?: string;
        helpText?: string;
        placeholder?: string;
        optionLabels?: Readonly<Record<string, string>>;
      }
    >
  >;
};

/**
 * Trim, and treat a field that was cleared as cleared rather than as absent.
 *
 * An empty help text means "remove the help text", which is a real thing to
 * want. An undefined one means "not edited". Collapsing the two would make it
 * impossible to delete a sentence through this screen.
 */
function textOrUndefined(next: string | undefined): string | undefined {
  if (next === undefined) return undefined;
  return next.trim();
}

/** A label may never be emptied - a question with no label cannot be asked. */
function requiredText(next: string | undefined, current: string): string {
  const trimmed = textOrUndefined(next);
  if (trimmed === undefined || trimmed === "") return current;
  return trimmed;
}

export function applyTextEdits(
  definition: InterestFormDefinition,
  edits: TextEdits
): InterestFormDefinition {
  const sectionEdits = edits.sections ?? {};
  const questionEdits = edits.questions ?? {};

  const sections: InterestSectionDefinition[] = definition.sections.map((section) => {
    const edit = sectionEdits[section.key];
    if (!edit) return section;
    const description = textOrUndefined(edit.description);
    return {
      ...section,
      title: requiredText(edit.title, section.title),
      /* An emptied description is removed rather than stored as "". */
      ...(description === undefined
        ? {}
        : description === ""
          ? { description: undefined }
          : { description }),
    };
  });

  const questions: InterestQuestionDefinition[] = definition.questions.map((question) => {
    const edit = questionEdits[question.key];
    if (!edit) return question;

    const helpText = textOrUndefined(edit.helpText);
    const placeholder = textOrUndefined(edit.placeholder);

    const options =
      question.options && edit.optionLabels
        ? question.options.map((option) => {
            const nextLabel = textOrUndefined(edit.optionLabels?.[option.value]);
            /* The VALUE is never touched. Only the label a person reads. */
            return nextLabel === undefined || nextLabel === ""
              ? option
              : { value: option.value, label: nextLabel };
          })
        : question.options;

    return {
      ...question,
      label: requiredText(edit.label, question.label),
      ...(helpText === undefined
        ? {}
        : helpText === ""
          ? { helpText: undefined }
          : { helpText }),
      ...(placeholder === undefined
        ? {}
        : placeholder === ""
          ? { placeholder: undefined }
          : { placeholder }),
      ...(options ? { options } : {}),
    };
  });

  return { ...definition, title: requiredText(edits.formTitle, definition.title), sections, questions };
}

/**
 * Did anything but words change?
 *
 * Returns the list of structural differences, empty when the change is purely
 * textual. The save path refuses on a non-empty list rather than writing - a
 * second pair of eyes on applyTextEdits, and the thing that would catch a
 * future edit to this file that quietly widened what it touches.
 */
export function onlyTextChanged(
  before: InterestFormDefinition,
  after: InterestFormDefinition
): string[] {
  const problems: string[] = [];

  if (before.schemaVersion !== after.schemaVersion) {
    problems.push("the schema version changed");
  }

  const beforeSectionKeys = before.sections.map((s) => s.key).join("|");
  const afterSectionKeys = after.sections.map((s) => s.key).join("|");
  if (beforeSectionKeys !== afterSectionKeys) {
    problems.push("the sections, or their order, changed");
  }

  const beforeQuestionKeys = before.questions.map((q) => q.key).join("|");
  const afterQuestionKeys = after.questions.map((q) => q.key).join("|");
  if (beforeQuestionKeys !== afterQuestionKeys) {
    problems.push("the questions, or their order, changed");
  }

  for (const section of before.sections) {
    const next = after.sections.find((s) => s.key === section.key);
    if (!next) continue;
    if (section.order !== next.order) problems.push(`section ${section.key} moved`);
    if (section.questionKeys.join("|") !== next.questionKeys.join("|")) {
      problems.push(`section ${section.key} holds different questions`);
    }
    if (JSON.stringify(section.visibleWhen ?? null) !== JSON.stringify(next.visibleWhen ?? null)) {
      problems.push(`section ${section.key} is shown under different conditions`);
    }
  }

  for (const question of before.questions) {
    const next = after.questions.find((q) => q.key === question.key);
    if (!next) continue;
    if (question.type !== next.type) problems.push(`${question.key} changed type`);
    if (question.required !== next.required) {
      problems.push(`${question.key} changed whether it is required`);
    }
    if (question.order !== next.order) problems.push(`${question.key} moved`);
    if ((question.optionSource ?? null) !== (next.optionSource ?? null)) {
      problems.push(`${question.key} takes its choices from somewhere else`);
    }
    if ((question.systemBinding ?? null) !== (next.systemBinding ?? null)) {
      problems.push(`${question.key} binds to a different field`);
    }
    if (JSON.stringify(question.visibleWhen ?? null) !== JSON.stringify(next.visibleWhen ?? null)) {
      problems.push(`${question.key} is shown under different conditions`);
    }
    if (JSON.stringify(question.defaultValue ?? null) !== JSON.stringify(next.defaultValue ?? null)) {
      problems.push(`${question.key} has a different default answer`);
    }

    const beforeValues = (question.options ?? []).map((o) => o.value).join("|");
    const afterValues = (next.options ?? []).map((o) => o.value).join("|");
    if (beforeValues !== afterValues) {
      /* The one that matters most: an answer already recorded is its VALUE. */
      problems.push(`${question.key} has different answer values, not just different wording`);
    }
  }

  return problems;
}

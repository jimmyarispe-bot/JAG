/**
 * The five questions the high school asks the student.
 *
 * These are the "Student Section" that used to sit in the middle of the inquiry
 * form, where the parent was filling it in. Same words — they were written for
 * the student and they still read that way.
 *
 * The keys match the question keys in interest form version 13, which is
 * archived rather than deleted, so an answer given here lines up with the one
 * place these questions previously lived.
 *
 * Pure data. No imports, so the page, the email and the staff view can all read
 * the same list without dragging server code across a client boundary.
 */

export type StudentQuestion = {
  readonly key: StudentQuestionKey;
  readonly label: string;
};

export const STUDENT_QUESTION_KEYS = [
  "hs_student_why_join",
  "hs_student_biggest_challenge",
  "hs_student_principal_change",
  "hs_student_greatness",
  "hs_student_treated_better",
] as const;

export type StudentQuestionKey = (typeof STUDENT_QUESTION_KEYS)[number];

/**
 * THE SCHOOL THIS EMAIL IS FROM, AND WHY IT IS A CONSTANT.
 *
 * Jimmy, 7 October 2026: "HS".
 *
 * These questions name The Academy HS in their own words - "join The Academy
 * HS family", "successful at The Academy HS" - and the send is gated on
 * hs_student_email, a field only the high school's section asks. So the email
 * is always from the high school.
 *
 * It did not always SAY so. The subject and header were built from the campus
 * the family ticked on the inquiry form, so on 29 September two families read
 * "The Academy GA: five questions for you" and then "why you believe you would
 * be successful at The Academy HS" four lines later.
 *
 * Making it a constant here, next to the questions that name it, is what stops
 * that coming back: there is no longer a campus to pass in and get wrong.
 */
export const STUDENT_QUESTIONNAIRE_SCHOOL_NAME = "The Academy HS";

export const STUDENT_QUESTIONNAIRE_INTRO =
  "Answer these on your own. We are not critiquing spelling or grammar. " +
  "These questions are so we can learn what is in your head and heart, and why " +
  "you believe you would be successful at The Academy HS.";

export const STUDENT_QUESTIONS: readonly StudentQuestion[] = [
  { key: "hs_student_why_join", label: "Why do you want to join The Academy HS family?" },
  {
    key: "hs_student_biggest_challenge",
    label: "What is your biggest challenge in your current school?",
  },
  {
    key: "hs_student_principal_change",
    label: "If you were the principal, what would you change about your current school?",
  },
  { key: "hs_student_greatness", label: "What do you believe is your GREATNESS?" },
  {
    key: "hs_student_treated_better",
    label: "Provide a specific example of when you could have treated someone better than you did.",
  },
];

export function isStudentQuestionKey(key: string): key is StudentQuestionKey {
  return (STUDENT_QUESTION_KEYS as readonly string[]).includes(key);
}

export function studentQuestionLabel(key: string): string {
  return STUDENT_QUESTIONS.find((q) => q.key === key)?.label ?? key;
}

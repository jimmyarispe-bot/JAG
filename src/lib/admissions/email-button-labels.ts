/**
 * The words on the staff email buttons that send a family something.
 *
 * One copy, read by the post-call page (POST_CALL_ACTIONS) and by the stage
 * dropdowns on the board and the case page. Jimmy, 23 October 2026: "use the
 * same titles/language that we use on the email button stages that initiate
 * sending the parent something for the admissions pipeline board drop down."
 *
 * Client-safe: no server imports. The dropdowns are "use client".
 */
export const EMAIL_BUTTON_LABELS = {
  tourRequest: "Send the tour request",
  application: "Send the application",
  shadowDayInvite: "Send the shadow day invite",
  accept: "Accept - send email",
  deny: "Deny - send email",
} as const;

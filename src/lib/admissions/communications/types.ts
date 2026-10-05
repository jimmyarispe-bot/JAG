export const COMMUNICATION_CHANNELS = [
  "email",
  "sms",
  "portal_notification",
  "internal_note",
  /**
   * Email addressed to the school's admissions contact rather than the family.
   *
   * A channel of its own because the delivery path sends every `email` to the
   * guardian — a staff template on that channel would be cheerfully mailed to
   * the parent. `internal_note` was not an option either: it records a message
   * and never sends one.
   */
  "staff_email",
] as const;

export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const COMMUNICATION_TRIGGER_EVENTS = [
  "inquiry_submitted",
  "tour_scheduled",
  "tour_reminder_24h",
  "tour_reminder_2h",
  "application_started",
  "application_incomplete_3d",
  "application_incomplete_7d",
  "application_incomplete_14d",
  "missing_documents",
  "state_funding_verification_needed",
  "funding_verification_approved",
  "funding_verification_rejected",
  "financial_aid_documents_requested",
  "application_submitted",
  "interview_scheduled",
  "interview_reminder_24h",
  "interview_reminder_2h",
  "additional_info_requested",
  // Decision gates (247). A gate asks a school leader a question; these are the
  // branches it can send.
  "decision_gate_opened",
  "application_invited",
  "application_not_invited",
  "shadow_days_invited",
  "shadow_days_not_invited",
  /*
   * The shadow day is BOOKED - a different message from the invitation to book
   * one, and from an interview.
   *
   * Added 24 September 2026 because there was no such event and booking a
   * shadow day therefore sent the family the INTERVIEW letter. Amy D'Amico was
   * told her son Maddox had an interview today at 1:00 PM and to prepare
   * report cards and IEP summaries. He had a shadow day booked. Heather
   * Badger-Brown, who had scheduled neither, wrote: "The Jag is setting up
   * interviews. We haven't interviewed prospective families."
   */
  "shadow_day_scheduled",
  "staff_shadow_day_scheduled",
  "student_accepted",
  "student_waitlisted",
  "student_declined",
  "enrollment_completed",
  "staff_new_inquiry",
  "staff_application_started",
  "staff_documents_uploaded",
  "staff_funding_verified",
  "staff_financial_aid_submitted",
  "staff_interview_scheduled",
  "staff_application_submitted",
  "staff_application_accepted",
  "staff_portal_message",
  /*
   * The interest-meeting chase, 3 October 2026.
   *
   * There was no "the family never booked" event at all. The four parent
   * reminders that exist cover applications, shadow days and enrollment, and
   * all four are switched off, so today a family who is sent a booking link
   * and never uses it is never heard from again by anybody.
   *
   * Decided by the 11pm calendar scan, which reads the campus calendars
   * before it writes anything - so these can only ever reach a family who
   * genuinely has not booked.
   *
   * The escalation is staff_* and sits on channel staff_email. That is not a
   * detail: staff_parent_unresponsive was written on channel 'email', which
   * sends to the guardian, and it carries the family's own name and telephone
   * number and the line "Someone should call them". It has never gone out
   * only because it is switched off at all four campuses.
   */
  "parent_interest_meeting_not_booked_1",
  "parent_interest_meeting_not_booked_2",
  "staff_interest_meeting_no_response",
  /**
   * The family's first letter, sent by a school leader rather than by the
   * form. inquiry_thank_you_email and its no-link twin moved onto this event
   * in migration 489; nothing fires them automatically any more.
   */
  "interest_meeting_link_sent",
  /** 24 and 48 hours, to the campus, while the link has not gone out. */
  "staff_interest_link_not_sent",
  /** 72 hours. To Jimmy and Danni, not to the campus that is sitting on it. */
  "staff_interest_link_escalation",
  /**
   * The four parent-reminder waits, one event each.
   *
   * All sixteen campus rows shared `additional_info_requested` - the same
   * event as additional_info_email - so anything firing that event through
   * the engine picked a campus row first, and there are four per school.
   * "We need additional information for your child" could have sent
   * "Booking {{student_first_name}}'s shadow days". Migration 494 separates
   * them; these are the names it uses.
   *
   * The nightly job never had the bug: it looks templates up by key, not by
   * event. The collision only ever bit the engine's trigger path.
   */
  "parent_reminder_application_not_started",
  "parent_reminder_application_not_submitted",
  "parent_reminder_shadow_days_not_scheduled",
  "parent_reminder_enrollment_not_completed",
  /**
   * "RECORD your notes for ..." - to the school leader at every campus, at
   * the appointment time. Carries the notes box and whichever decision
   * belongs to that campus: the tour at GA and FL, the shadow day at Virtual
   * and HS, plus "not the right school" and "not yet" everywhere.
   *
   * THE KEY STILL SAYS "inquiry call" because it was coined on 4 October for
   * a GA and FL letter ten minutes after that call. Renaming it would touch
   * six files to change nothing a human reads; the LABEL below, which is what
   * shows in the template admin, says what it actually is.
   */
  "staff_inquiry_call_held",
  /**
   * The tour request to the family. Fired by a school leader pressing a
   * button on /post-call/<token>, never by a clock - a student does not move
   * from one stage to the next without the school leader moving him or her.
   */
  "tour_invitation_sent",
  /**
   * The five-day "no application, time to telephone" letter.
   *
   * IT WAS SEEDED ON SOMEBODY ELSE'S EVENT. Migration 484 gave
   * staff_application_call_parent trigger_event 'staff_portal_message',
   * which belongs to a different letter entirely. Nothing has gone wrong
   * yet for one reason only: the letter is switched off, and
   * getTemplatesForTrigger filters on is_active.
   *
   * Switch it on as it stands and firing staff_portal_message delivers both
   * - "a new message in your portal" and "time to call this family, here is
   * their telephone number" - because that function de-duplicates by
   * template KEY and two keys means two survivors. Exactly the collision
   * migration 494 cleared out of sixteen rows.
   *
   * Named after its template, the convention 494 established, so the two
   * cannot drift apart again. The nightly job is unaffected either way: it
   * looks this letter up by key, not by event.
   */
  "staff_application_call_parent",
  /**
   * The escalation behind the shadow-day and enrollment reminders: three
   * reminders, no response, somebody should telephone.
   *
   * SEEDED ON SOMEBODY ELSE'S EVENT, same as the five-day letter was.
   * Migration 294 gave it trigger_event 'staff_portal_message'. Harmless
   * while it is switched off - getTemplatesForTrigger filters on is_active -
   * and the moment it is on, firing staff_portal_message delivers both that
   * letter and this one, because that function de-duplicates by template KEY.
   *
   * This is the third row found carrying a borrowed event, after the sixteen
   * migration 494 cleared and the one 503 moved. Named after its template,
   * the convention 494 set.
   *
   * THE NIGHTLY JOB IS UNAFFECTED: parent-reminders.ts looks it up by key.
   */
  "staff_parent_unresponsive",
] as const;

export type CommunicationTriggerEvent = (typeof COMMUNICATION_TRIGGER_EVENTS)[number];

export const MERGE_FIELDS = [
  "student_name",
  "parent_name",
  "parent_email",
  "parent_phone",
  /**
   * First names, plus guardian_* aliases for the parent_* fields.
   *
   * Added 7 Sept. Migration 294 seeded four live parent-reminder templates
   * written against these names BEFORE they existed. `renderTemplate` leaves an
   * unknown token in place as literal text, so three families were two days
   * from receiving "Hi {{guardian_first_name}},". The templates were disabled;
   * these are the fields they were always meant to use.
   *
   * Separate from parent_name because a greeting wants a first name — "Hi
   * Sarah," not "Hi Sarah Whitfield,".
   */
  "guardian_first_name",
  "student_first_name",
  "guardian_name",
  "guardian_email",
  "guardian_phone",
  /**
   * The parent's phone number, normalised for a `tel:` link.
   *
   * `parent_phone` is what the family typed — "(407) 555-0123" — and that is
   * what a reader should see. A `tel:` href wants the same number without the
   * decoration, because a mail client that cannot parse it silently renders
   * dead text, and a member of staff on a phone then retypes it by hand.
   *
   * Use it only inside the href: <a href="tel:{{parent_phone_dial}}">{{parent_phone}}</a>
   */
  "parent_phone_dial",
  "school_name",
  "program_name",
  "campus_name",
  "campus_address",
  "parking_info",
  "funding_program",
  "funding_source",
  "portal_link",
  "application_link",
  "upload_link",
  /**
   * Where a family finishes enrolling. Today that is the same apply portal as
   * application_link — the enrollment packet lives there — but it is named
   * separately because "finish your application" and "finish your enrollment"
   * are different moments, and if they ever get different destinations the
   * templates should not have to change.
   */
  "enrollment_link",
  /** The school's own Google appointment-schedule URL. */
  "scheduling_link",
  /** Shadow-days booking link. Separate calendar from tours -- see migration 247. */
  "shadow_days_link",
  /**
   * The campus tour calendar, from schools.tour_booking_url. Registered here
   * as well as in the merge map because this list is what migration 296's
   * audit compares live template bodies against, and a token in a body with
   * no entry here is the 294 failure: literal braces mailed to a parent.
   *
   * EMPTY AT HS AND VIRTUAL, on purpose. A letter carrying this token must
   * not be rendered for a campus with no tour calendar - requireTourLink in
   * tour.ts is the guard, and it refuses rather than mailing
   * "You can book here: " with nothing after it.
   */
  "tour_link",
  /**
   * The school leader's own words about what this child's day will look like,
   * written when gate 2 is answered yes. Registered HERE as well as in the
   * merge map, because this list is what migration 296's audit compares live
   * template bodies against — a token in a body with no entry here is precisely
   * the 294 failure, and it mails a parent literal braces.
   */
  "shadow_days_note",
  /** Deep link to the pending-decisions page, for the staff gate notification. */
  "decisions_link",
  "admissions_contact_name",
  "admissions_contact_email",
  /** Straight to the lead in the dashboard — for staff mail only. */
  "lead_link",
  /**
   * The five-day application escalation's button page. Registered here as well
   * as in the merge map because this list is what migration 296's audit
   * compares live template bodies against, and a token in a body with no entry
   * here is the 294 failure: it mails literal braces to a human.
   */
  "application_call_link",
  /**
   * The one-click link in the new-inquiry notice. It is the only way the
   * family's first letter goes out: nothing fires on inquiry any more.
   */
  "interest_link_action",
  /**
   * The post-call decision page, /post-call/<token>. Same registration
   * reasoning as application_call_link above.
   */
  "post_call_link",
  /**
   * What the family ticked on the interest form, comma separated. Registered
   * here as well as in the merge map because this list is what migration
   * 296's audit compares live template bodies against - a token in a body
   * with no entry here mails literal braces to a human.
   */
  "inquiry_programs",
  /**
   * The child's full name - first and last, never the preferred name alone.
   *
   * SEPARATE FROM student_name, which returns the preferred name when there
   * is one. That is right in a letter to a family, who call the child what
   * they call the child, and wrong on a staff letter a school leader is
   * scanning for a record: "Birdie" does not find Beatrice Okonkwo.
   */
  "student_full_name",
  /** The grade the child is applying for, as a label. */
  "student_grade",
  /** Whole years, from date_of_birth. "not given" when there is none. */
  "student_age",
  /**
   * The Google Meet link for THIS appointment, read off the calendar event.
   *
   * Empty at GA and FL, where the inquiry call is a telephone call and
   * Google creates no conference. The letter carrying it says "Call them or
   * go to the google meets link", which covers both.
   */
  "meeting_link",
  "tour_datetime",
  "interview_datetime",
  /**
   * Just the clock - "3:15 PM" - for a letter that has already said which day.
   *
   * The reminder the evening before reads "our meeting to discuss Callum
   * tomorrow at {{interview_time}}". Putting the full date after the word
   * "tomorrow" would be redundant and slightly absurd.
   */
  "interview_time",
  "missing_items",
  "missing_documents",
  "uploaded_documents",
  "award_amount",
  "award_id",
  "state_student_id",
  "rejection_reason",
  "next_steps",
  "requested_items",
  "deadline",
  "decision_timeframe",
  "tuition_info",
  "orientation_info",
  "technology_info",
  "waitlist_timeline",
  "student_schedule",
  "teacher_assignment",
  "first_day_info",
  "handbook_link",
  /*
     Either silent, or a whole sentence naming what the family attached.
     
     MERGE_FIELDS is the closed list of tokens a template may use, and adding a
     value to the renderer without adding its name here is a type error - which
     is exactly what caught this on 17 September, after the template had already
     been updated in production to reference a token the deployed code did not
     know. renderTemplate leaves an unresolved token in place as literal text,
     so every new staff notice would have read "{{attachment_note}}".
     
     The gate did its job. The ordering did not: a template change and the token
     it depends on have to ship together, code first.
  */
  "attachment_note",
  /*
     THE CHASE, 3 October 2026. Four of these exist for one letter only -
     staff_interest_meeting_no_response - and they are what make it worth
     reading: a school leader about to telephone a family wants to know what
     has already been tried, what the family said in the first place, and
     where to record what came of the call.

     Registered HERE as well as in the merge map on purpose. This list is the
     closed set a template may use, and adding a value to the renderer without
     adding its name here is a type error - which is exactly the gate that
     caught attachment_note on 17 September, after a template had already been
     updated in production to use a token the deployed code did not know.
     renderTemplate leaves an unresolved token in place as literal text, so the
     failure mode is a school leader reading "{{call_link}}".

     Migration 479 seeds all three chase templates INACTIVE and must be run
     AFTER this ships. Same ordering rule, same reason: code first.
  */
  "invite_sent_at",
  "reminder_1_sent_at",
  "reminder_2_sent_at",
  /** What the family wrote about their child when they inquired. */
  "inquiry_notes",
  /** Opens /call/<token> - record how the phone call went. */
  "call_link",
] as const;

export type MergeField = (typeof MERGE_FIELDS)[number];

export const TRIGGER_EVENT_LABELS: Record<CommunicationTriggerEvent, string> = {
  inquiry_submitted: "Inquiry Submitted",
  decision_gate_opened: "Decision Waiting (staff)",
  application_invited: "Invited to Apply",
  application_not_invited: "Inquiry Closed With Thanks",
  shadow_days_invited: "Invited to Shadow Days",
  shadow_days_not_invited: "Application Declined",
  shadow_day_scheduled: "Shadow Day Booked",
  staff_shadow_day_scheduled: "Staff: Shadow Day Booked",
  tour_scheduled: "Tour Scheduled",
  tour_reminder_24h: "Tour Reminder (24h)",
  tour_reminder_2h: "Tour Reminder (2h)",
  application_started: "Application Started",
  application_incomplete_3d: "Application Incomplete (3 days)",
  application_incomplete_7d: "Application Incomplete (7 days)",
  application_incomplete_14d: "Application Incomplete (14 days)",
  missing_documents: "Missing Documents",
  state_funding_verification_needed: "State Funding Verification Needed",
  funding_verification_approved: "Funding Verification Approved",
  funding_verification_rejected: "Funding Verification Rejected",
  financial_aid_documents_requested: "Financial Aid Documents Requested",
  application_submitted: "Application Submitted",
  interview_scheduled: "Interest Meeting Scheduled",
  interview_reminder_24h: "Interest Meeting Reminder (24h)",
  interview_reminder_2h: "Interest Meeting Reminder (2h)",
  additional_info_requested: "Additional Information Requested",
  student_accepted: "Student Accepted",
  student_waitlisted: "Student Waitlisted",
  student_declined: "Student Declined",
  enrollment_completed: "Enrollment Completed",
  staff_new_inquiry: "Staff: New Inquiry",
  staff_application_started: "Staff: Application Started",
  staff_documents_uploaded: "Staff: Documents Uploaded",
  staff_funding_verified: "Staff: Funding Verified",
  staff_financial_aid_submitted: "Staff: Financial Aid Submitted",
  staff_interview_scheduled: "Staff: Interest Meeting Scheduled",
  staff_application_submitted: "Staff: Application Submitted",
  staff_application_accepted: "Staff: Application Accepted",
  staff_portal_message: "Staff: Portal Message",
  parent_interest_meeting_not_booked_1: "Interest Meeting Not Booked (1st follow-up)",
  parent_interest_meeting_not_booked_2: "Interest Meeting Not Booked (2nd follow-up)",
  staff_interest_meeting_no_response: "Staff: Three Attempts, No Booking",
  interest_meeting_link_sent: "Interest Meeting Link Sent",
  staff_interest_link_not_sent: "Staff: Interest Link Not Sent Yet",
  staff_interest_link_escalation: "Staff: Three Days, Nobody Contacted Them",
  parent_reminder_application_not_started: "Reminder: Application Not Started",
  parent_reminder_application_not_submitted: "Reminder: Application Not Submitted",
  parent_reminder_shadow_days_not_scheduled: "Reminder: Shadow Days Not Scheduled",
  parent_reminder_enrollment_not_completed: "Reminder: Enrollment Not Completed",
  staff_inquiry_call_held: "Staff: RECORD Your Notes (at the meeting time)",
  tour_invitation_sent: "Tour Invitation Sent",
  staff_application_call_parent: "Staff: Five Days, No Application — Call Them",
  staff_parent_unresponsive: "Staff: Three Reminders, No Response — Call Them",
};

export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  email: "Email",
  sms: "SMS",
  portal_notification: "Portal Notification",
  internal_note: "Internal Note",
  staff_email: "Email to school leader",
};

export const DECISION_TO_TRIGGER: Record<string, CommunicationTriggerEvent> = {
  accept: "student_accepted",
  waitlist: "student_waitlisted",
  deny: "student_declined",
  request_info: "additional_info_requested",
};

export interface CommunicationTemplate {
  id: string;
  school_id: string | null;
  template_key: string;
  name: string;
  channel: CommunicationChannel;
  trigger_event: CommunicationTriggerEvent;
  subject: string;
  body: string;
  delay_hours: number;
  is_active: boolean;
  category?: string;
  version_number?: number;
  description?: string | null;
}

export interface CommunicationRecord {
  id: string;
  lead_id: string;
  application_id: string | null;
  communication_type: string;
  subject: string;
  body: string;
  sent_to: string;
  sent_by: string | null;
  sent_at: string;
  template_id: string | null;
  template_key: string | null;
  trigger_event: string | null;
  delivery_status: string;
  open_status: string;
  opened_at: string | null;
  is_staff_notification: boolean;
  users?: { full_name: string | null } | null;
}

export interface QueuedCommunication {
  id: string;
  lead_id: string;
  application_id: string | null;
  template_key: string;
  trigger_event: string;
  channel: string;
  scheduled_for: string;
  status: string;
  custom_subject: string | null;
  custom_body: string | null;
}

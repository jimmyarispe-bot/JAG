-- 328_staff_contact_details_2026_09_11.sql
--
-- A phone number and a personal email for staff.
--
-- WHERE THINGS STAND, so the gap is stated rather than assumed:
--
--   users       id, email, first/last/full/display name, title. Nothing else.
--   employees   employment facts only — school, department, hire date,
--               supervisor. No contact columns at all.
--   guardians   email, phone. PARENTS ALREADY HAVE BOTH.
--   families    billing_email, billing_phone.
--   students    no contact columns.
--
-- So "everyone needs a phone number" is, in practice, a staff gap. Parents have
-- one; whether it is filled in is a separate question the coverage query at the
-- foot of this file answers.
--
-- WHY ON `users` AND NOT `employees`. A mobile number and a personal email are
-- facts about a person, not about their employment. They should survive a change
-- of role, a change of campus, and the closing of an employment record. There is
-- no `people` table in this schema — `users` is the nearest thing to a person —
-- so they go there.
--
-- WHY `personal_email` IS SEPARATE FROM `email`. `users.email` is the sign-in
-- address and, for staff, an @theacademyway.org address the organisation
-- controls. It is the right address for work and the wrong one for the week
-- after somebody leaves, for a password reset when the mail account itself is
-- the problem, or for reaching a person whose work mailbox was closed on their
-- last day. Overloading one column to mean both is how a school loses contact
-- with a former employee it still owes a W-2.
--
-- RELATIONSHIP TO `school_admissions_contacts.phone` (migration 327). That
-- column is a ROLE line — the number a campus publishes for admissions, which
-- may be a desk, a shared mobile, or nobody's personal number. Where that row
-- carries a `user_id`, this column is the person and that one is the override.
-- Two columns, two meanings, and the resolver should prefer the row's own phone
-- when set and fall back to the user's.
--
-- NOT NORMALISED, DELIBERATELY. Numbers are stored as entered. Normalising to
-- E.164 belongs next to the code that dials or texts them, where a failure is
-- visible, not in a migration that would silently mangle an extension or an
-- international number typed by a human being.
--
-- Safe to re-run. Adds nothing required, changes no behaviour.

alter table public.users
  add column if not exists phone text,
  add column if not exists personal_email text;

comment on column public.users.phone is
  'Mobile number for this person. Used for SMS notification once a provider is configured — the Twilio adapter is currently a stub that reports success and sends nothing. Stored as entered; normalise at the point of sending.';

comment on column public.users.personal_email is
  'A personal address that is not the sign-in address. For reaching someone when the work mailbox is the problem, or after they leave. Never used for authentication.';

-- ---------------------------------------------------------------------------
-- Coverage, staff and parents, so the next step starts from a number
-- ---------------------------------------------------------------------------
-- with_phone on the guardians row is the one to look at. Every parent
-- notification that is ever going to be a text depends on it, and the column
-- has existed all along.

select 'staff (users)' as who,
       count(*)                                   as total,
       count(phone)                               as with_phone,
       count(personal_email)                      as with_personal_email
from public.users
union all
select 'parents (guardians)',
       count(*),
       count(nullif(trim(phone), '')),
       count(nullif(trim(email), ''))
from public.guardians
union all
select 'families (billing)',
       count(*),
       count(nullif(trim(billing_phone), '')),
       count(nullif(trim(billing_email), ''))
from public.families;

-- ===========================================================================
-- A WEEK IS REVIEWED BEFORE IT IS PAID  -  409  -  2026-09-22
--
-- Jimmy, 22 September. Two things.
--
-- 1. A TEACHER GETS A LAST WORD BEFORE SHE SUBMITS.
--    "Is there anything cooky Jimmy needs to know about that happened this
--    week?" - a free text box on the week, optional, saved with the
--    submission. Optional deliberately: a required box teaches people to type
--    "n/a" and stops being read.
--
-- 2. DANNI REVIEWS EVERY WEEK BEFORE IT REACHES THE MONEY.
--    Approve, or Not approved with a comment. Either way the week still
--    reaches Jimmy - "the time sheet is still sent to me with comments even
--    when not approved". Not approved is an ANNOTATION, not a blockage. A
--    review step that can trap a teacher's pay is a review step that will, on
--    a Friday night when nobody is reading.
--
-- WHY DANNI AND NOT HEATHER. Heather is a SCHOOL_LEADER, and migration 357
-- stripped that role of every money permission on 14 September because the
-- rule is that only Danni and Jimmy see anything to do with money. Approving a
-- timesheet means seeing amounts. Rather than carve an exception into a rule
-- that exists for a reason, review belongs to Danni, who is EXECUTIVE_DIRECTOR
-- and already sees money legitimately. Jimmy, 22 September: "alright let's
-- just make it danni."
--
-- So this migration grants NOTHING NEW to anybody. The gate is
-- has_permission('finance.view') or FOUNDER - the same gate migration 376 put
-- on class_pay_rates.
--
-- A COMMENT IS REQUIRED TO DECLINE, AND ONLY TO DECLINE. Same reasoning as
-- teacher_week_amendments.explanation in migration 392: the entire value of a
-- refusal is the reason attached to it. Twenty characters is not a hurdle, it
-- is the difference between "wrong" and something a teacher can act on.
--
-- 'not_approved' RATHER THAN 'declined'. teacher_week_amendments uses
-- 'declined' for the same idea, and consistency would argue for it here. The
-- button says "Not approved", and somebody reading this table at midnight
-- should see the same words the person pressing the button saw. Noted so the
-- difference is deliberate rather than an oversight.
--
-- THE WEEK STAYS FROZEN THROUGHOUT. Submitting freezes gross_cents; reviewing
-- does not reopen it. A review records a judgement about a figure, it does not
-- change the figure.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. The teacher's last word.
-- ---------------------------------------------------------------------------

alter table public.teacher_week_submissions
  add column if not exists teacher_note text;

comment on column public.teacher_week_submissions.teacher_note is
  'The teacher''s answer to "Is there anything cooky Jimmy needs to know about '
  'that happened this week?" Optional - a required box teaches people to type '
  '"n/a".';

-- ---------------------------------------------------------------------------
-- 2. The review.
-- ---------------------------------------------------------------------------

alter table public.teacher_week_submissions
  add column if not exists reviewed_by_user_id uuid
    references public.users(id) on delete set null;

alter table public.teacher_week_submissions
  add column if not exists reviewed_at timestamptz;

alter table public.teacher_week_submissions
  add column if not exists review_note text;

alter table public.teacher_week_submissions
  drop constraint if exists teacher_week_submissions_status_check;

alter table public.teacher_week_submissions
  add constraint teacher_week_submissions_status_check
  check (status in ('open', 'submitted', 'approved', 'not_approved'));

-- A refusal carries its reason, or it is not recorded.
alter table public.teacher_week_submissions
  drop constraint if exists teacher_week_submissions_decline_needs_reason;

alter table public.teacher_week_submissions
  add constraint teacher_week_submissions_decline_needs_reason
  check (
    status <> 'not_approved'
    or (review_note is not null and length(btrim(review_note)) >= 20)
  );

comment on column public.teacher_week_submissions.review_note is
  'Why a week was not approved. Required for not_approved, at least 20 '
  'characters - the entire value of a refusal is the reason attached to it. '
  'Optional on an approval.';

-- ---------------------------------------------------------------------------
-- 3. Who may review. Nothing new is granted.
-- ---------------------------------------------------------------------------

drop policy if exists teacher_week_submissions_review on public.teacher_week_submissions;

create policy teacher_week_submissions_review
on public.teacher_week_submissions
for update
to authenticated
using (
  status in ('submitted', 'approved', 'not_approved')
  and (has_permission('finance.view') or has_role('FOUNDER'))
)
with check (
  status in ('submitted', 'approved', 'not_approved')
  and (has_permission('finance.view') or has_role('FOUNDER'))
);

comment on policy teacher_week_submissions_review on public.teacher_week_submissions is
  'Danni reviews a submitted week. Same gate migration 376 put on '
  'class_pay_rates - finance.view or FOUNDER - so this grants nobody anything '
  'they did not already have. A SCHOOL_LEADER still cannot see the amounts, '
  'which is why review is Danni''s and not Heather''s.';

commit;

-- ===========================================================================
-- VERIFY.
-- ===========================================================================

-- 1. The four new columns. EXPECT FOUR ROWS.
select
  '1. columns'                                    as check,
  column_name                                     as detail,
  data_type                                       as extra
from information_schema.columns
where table_schema = 'public'
  and table_name = 'teacher_week_submissions'
  and column_name in ('teacher_note', 'reviewed_by_user_id', 'reviewed_at', 'review_note')

union all

-- 2. The status vocabulary now allows all four states.
select
  '2. status check',
  conname,
  pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.teacher_week_submissions'::regclass
  and conname in (
    'teacher_week_submissions_status_check',
    'teacher_week_submissions_decline_needs_reason'
  )

union all

-- 3. The review policy exists alongside the ones already there.
select
  '3. policies',
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'teacher_week_submissions'

union all

-- 4. Weeks waiting. Expect whatever has been submitted so far - the test
--    teacher's $125 week was torn down, so this is very likely zero.
select
  '4. weeks by status',
  coalesce(status, '(null)'),
  count(*)::text
from public.teacher_week_submissions
group by status

order by 1, 2;

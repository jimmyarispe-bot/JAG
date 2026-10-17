-- ============================================================================
-- 564  WHILE YOU WERE OUT
--      16 October 2026
-- ============================================================================
--
-- The letter a school leader gets on the first working day she is back,
-- naming every family the platform wrote to in her place.
--
-- ── JIMMY'S WORDS, AND ONE EDIT HE MADE ────────────────────────────────────
--
-- The body below is his, approved verbatim. The draft carried a subject of
-- "While you were out - {{out_of_office_count}} families were sent the
-- scheduling link" and he cut it to four words:
--
--   "only while you were out in subject"
--
-- So the subject is "While you were out" and nothing else, and
-- {{out_of_office_count}} is not a merge field anywhere.
--
-- ── SEEDED ACTIVE, WHICH IS NOT THE USUAL ──────────────────────────────────
--
-- staff_inquiry_call_held and others are seeded switched off because Jimmy
-- reads the exact words a human will see before they ship. He has read these.
-- Turning it on later would be a second step for a letter already approved.
--
-- ── THE WORDS LIVE HERE, NOT IN THE CODE ───────────────────────────────────
--
-- out-of-office.ts reads this row and substitutes three fields. It does NOT
-- carry the sentences, so Jimmy can change a word with an update statement
-- rather than a deploy - the same arrangement as every other letter.
--
-- THE THREE FIELDS ARE SUBSTITUTED BY THAT MODULE, NOT BY THE ENGINE, and
-- the reason is worth writing down. This letter is about an ABSENCE, not
-- about a child. admissions_communication_queue.lead_id is NOT NULL, so
-- putting it through the normal path means anchoring a letter that names
-- five families onto one child's record - and anyone reading that child's
-- communications would then see four other families' names and telephone
-- numbers. That is not a tidiness problem, it is a disclosure. So it is sent
-- straight through the email provider, divert.ts honoured, and recorded in
-- the table below rather than against a lead.
--
-- ============================================================================

begin;

-- ── THE DEDUPE: ONE SUMMARY PER ABSENCE ────────────────────────────────────

create table if not exists public.admissions_out_of_office_summaries (
  id uuid primary key default gen_random_uuid(),
  calendar_id text not null,
  absence_started_on text not null,
  absence_ended_on text not null,
  families_named integer not null,
  sent_to text not null,
  sent_at timestamptz not null default now(),
  constraint admissions_ooo_one_summary_per_absence
    unique (calendar_id, absence_started_on)
);

comment on table public.admissions_out_of_office_summaries is
  'One row per "While you were out" letter. The unique constraint is what stops a second letter if the scan runs twice on the night an absence ends.';

alter table public.admissions_out_of_office_summaries enable row level security;

-- ── THE LETTER ─────────────────────────────────────────────────────────────

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body,
   delay_hours, is_active, category, description)
select
  null,
  'staff_out_of_office_summary',
  'While you were out',
  'staff_email',
  'staff_out_of_office_summary',
  'While you were out',
  '<p>You were marked out of office {{out_of_office_dates}}.</p>' ||
  '<p>These families inquired while you were out. Each one was sent the link to schedule the interest meeting/conversation, so no family sat waiting for you to come back.</p>' ||
  '<p>{{out_of_office_families}}</p>' ||
  '<p><strong>Nothing else was done.</strong> No stage was skipped. No decision was made. No other family was written to.</p>' ||
  '<p><a href="{{pipeline_link}}">Open your pipeline</a></p>',
  0,
  true,
  'admissions',
  'Sent to a school leader on the first working day after an out-of-office absence, naming every family the platform sent the interest meeting link to in her place. Words approved by Jimmy, 16 October 2026.'
where not exists (
  select 1 from public.admissions_communication_templates
  where template_key = 'staff_out_of_office_summary' and school_id is null
);

-- ── THE GUARD ──────────────────────────────────────────────────────────────

do $$
declare
  n_tpl integer;
  tpl_subject text;
begin
  select count(*), max(subject) into n_tpl, tpl_subject
  from public.admissions_communication_templates
  where template_key = 'staff_out_of_office_summary';

  if n_tpl <> 1 then
    raise exception 'Refusing: expected exactly 1 staff_out_of_office_summary row, found %.', n_tpl;
  end if;

  -- Four words. Not five, and no count.
  if tpl_subject <> 'While you were out' then
    raise exception 'Refusing: the subject reads "%", not "While you were out".', tpl_subject;
  end if;

  if not exists (
    select 1 from public.admissions_communication_templates
    where template_key = 'staff_out_of_office_summary'
      and is_active
      and body like '%{{out_of_office_dates}}%'
      and body like '%{{out_of_office_families}}%'
      and body like '%{{pipeline_link}}%'
      and body like '%interest meeting/conversation%'
      and body like '%No stage was skipped.%'
  ) then
    raise exception 'Refusing: the letter is not active, or does not carry all three fields and his words.';
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

select template_key, subject, is_active, channel, trigger_event, body
from public.admissions_communication_templates
where template_key = 'staff_out_of_office_summary';

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.admissions_out_of_office_summaries'::regclass
order by conname;

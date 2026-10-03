-- 479_the_interest_meeting_chase_2026_10_03.sql
--
-- Step 2 of admissions: making sure a family who was sent a booking link
-- actually books, and telling a school leader to pick up the phone when three
-- letters have not worked.
--
-- RUN THIS *AFTER* THE CODE HAS DEPLOYED, NOT BEFORE.
--
--   The three letters below use merge tokens - {{invite_sent_at}},
--   {{reminder_1_sent_at}}, {{reminder_2_sent_at}}, {{inquiry_notes}},
--   {{call_link}} - and renderTemplate leaves a token the deployed code does
--   not know in place AS LITERAL TEXT. That is not a hypothetical: migration
--   294 seeded four parent reminders written against merge fields that did
--   not exist yet, and three families were two days from being emailed
--   "Hi {{guardian_first_name}},". The templates had to be switched off.
--
--   Everything below is seeded INACTIVE, so even run in the wrong order it
--   cannot mail anybody. But the order is still the order.
--
-- AND THEY STAY INACTIVE UNTIL JIMMY SAYS OTHERWISE. His standing rule:
-- anything a human reads, he sees the exact words before it ships. The scan
-- runs every night regardless - it finds bookings, records them, and sends the
-- two letters that already exist and are already approved. It writes no chase
-- letters at all while these three are switched off, and says so in its
-- report rather than failing quietly.
--
-- THE CLOCK, Jimmy 3 October 2026, with the one amendment he approved the
-- same day:
--
--   day 0        the inquiry arrives; the booking link goes out
--   day 2, 11pm  no appointment -> 1st follow-up, read at 8am
--   day 3, 11pm  still none      -> 2nd follow-up, read at 8am
--   day 4, 11pm  still none      -> the school leader, 7:00am the next day
--
-- Safe to re-run. Every statement is idempotent.

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. One row per night, so a night cannot be scanned twice
-- ─────────────────────────────────────────────────────────────────────────────
--
-- The Eastern calendar date is the primary key, and that IS the lock: the job
-- claims the night before it calls Google, and a second cron, a Vercel retry
-- or somebody pressing the button again finds it taken and stops. Without it,
-- two runs an hour apart would each see the same families still unbooked and
-- queue the same reminder twice.
--
-- The report is kept because nobody watches an 11pm cron in a browser.
-- platform_job_runs was created for that reason and sat empty for months,
-- which is precisely how "the nightly job never fired" went undiagnosed.

create table if not exists public.interest_meeting_scan_runs (
  eastern_date  date         primary key,
  started_at    timestamptz  not null default now(),
  finished_at   timestamptz,
  report        jsonb
);

comment on table public.interest_meeting_scan_runs is
  'One row per night of the interest-meeting scan. The date is the lock: the '
  'job claims the night before reading Google, so a retry or a second cron '
  'cannot send a family the same reminder twice.';

alter table public.interest_meeting_scan_runs enable row level security;

drop policy if exists interest_meeting_scan_runs_read on public.interest_meeting_scan_runs;
create policy interest_meeting_scan_runs_read
  on public.interest_meeting_scan_runs
  for select
  to authenticated
  using (
    coalesce(has_role('FOUNDER'), false)
    or coalesce(has_role('EXECUTIVE_DIRECTOR'), false)
    or coalesce(has_role('SCHOOL_LEADER'), false)
  );

-- No insert or update policy, deliberately. The only writer is the nightly job,
-- which runs under the service role because a cron carries no cookies and
-- therefore has no user. See process-queues.ts for what happens when that is
-- forgotten: every select returns zero rows and the route reports success.

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. What came of the phone call
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Jimmy, 2 October: "a link for the school leader to confirm that this step
-- was completed and a place to add notes on the outcome of the call."
--
-- OUTCOME IS REQUIRED, NOTES ARE NOT. A leader standing in a corridor after a
-- two-minute call will answer one question. She will not write a paragraph,
-- and a form that insists on one gets a full stop typed into it.

create table if not exists public.lead_call_outcomes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.admissions_leads(id) on delete cascade,
  called_at   timestamptz not null default now(),
  outcome     text not null
                check (outcome in (
                  'spoke_will_book',
                  'spoke_not_proceeding',
                  'left_message',
                  'no_answer'
                )),
  notes       text,
  recorded_by uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

comment on table public.lead_call_outcomes is
  'A school leader telephoned a family who would not book an interest meeting. '
  'Append-only in practice: a second call is a second row, so the history of '
  'who tried what survives.';

create index if not exists idx_lead_call_outcomes_lead
  on public.lead_call_outcomes(lead_id, called_at desc);

alter table public.lead_call_outcomes enable row level security;

drop policy if exists lead_call_outcomes_read on public.lead_call_outcomes;
create policy lead_call_outcomes_read
  on public.lead_call_outcomes
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.admissions_leads l
       where l.id = lead_call_outcomes.lead_id
         and public.can_access_school(l.school_id)
    )
  );

drop policy if exists lead_call_outcomes_write on public.lead_call_outcomes;
create policy lead_call_outcomes_write
  on public.lead_call_outcomes
  for insert
  to authenticated
  with check (
    exists (
      select 1
        from public.admissions_leads l
       where l.id = lead_call_outcomes.lead_id
         and public.can_access_school(l.school_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. The link in the escalation email
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Same shape as application_access_token (migration 412): 64 lowercase hex on
-- the lead, minted when the escalation is queued, read by exactly one route
-- and never accepted from anywhere else. Nothing in the codebase takes a lead
-- id from a browser and this does not change that.

alter table public.admissions_leads
  add column if not exists interest_call_token text;

create unique index if not exists idx_admissions_leads_interest_call_token
  on public.admissions_leads(interest_call_token)
  where interest_call_token is not null;

comment on column public.admissions_leads.interest_call_token is
  'Opens /call/<token> for the school leader to record the outcome of the '
  'phone call. Minted when the escalation is queued. No account needed, the '
  'same mechanism as the application link and the fee page.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3b. What the queue remembers about why it was queued
-- ─────────────────────────────────────────────────────────────────────────────
--
-- triggerCommunications has always accepted mergeOverrides. The QUEUE silently
-- dropped them: a delayed letter was rendered purely from the lead as it
-- stands whenever it finally goes out.
--
-- Fine for a reminder that needs a family's name. Useless for the escalation,
-- which has to tell a school leader the three dates on which this family was
-- emailed - facts the 11pm scan has in its hand and which nothing can
-- reconstruct by seven the next morning.
--
-- Null on every row that exists today, and null spreads as nothing, so no
-- queued letter changes behaviour.

alter table public.admissions_communication_queue
  add column if not exists merge_overrides jsonb;

comment on column public.admissions_communication_queue.merge_overrides is
  'Merge-context values captured when the letter was queued, applied over the '
  'freshly loaded context at send time. For facts that are true at queueing '
  'and unrecoverable later.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. A staff letter that was addressed to the parent
-- ─────────────────────────────────────────────────────────────────────────────
--
-- staff_parent_unresponsive sits on channel 'email'. Every 'email' goes to the
-- guardian. So this letter - which carries the FAMILY'S OWN name and phone
-- number and the line "Someone should call them, or mark the lead as not
-- proceeding" - would have been sent to the family it is about.
--
-- It is switched off at all four campuses, which is the only reason it never
-- happened. Moving it to staff_email makes it safe to switch on, which is a
-- separate decision and not taken here.

update public.admissions_communication_templates
   set channel = 'staff_email'
 where template_key = 'staff_parent_unresponsive'
   and channel = 'email';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. The three letters
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Network-wide (school_id null). A campus may override any of them later; the
-- engine prefers a row with a school_id over the shared one.
--
-- delay_hours is 0 on all three. The 11pm scan computes the exact send time
-- itself - 8am Eastern for a family, 7am for a school leader - and writes it
-- into admissions_communication_queue directly, because the shared
-- business-hours adjuster decides "nine o'clock" in UTC, which is five in the
-- morning in Florida. That fault is reported separately and is not patched
-- from here.

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body,
   delay_hours, is_active, description)
values
  (
    null,
    'parent_reminder_interest_meeting_not_booked_1',
    'Interest meeting not booked - 1st follow-up',
    'email',
    'parent_interest_meeting_not_booked_1',
    'Finding a time to talk about {{student_first_name}}',
    'Dear {{guardian_first_name}},

We have not managed to find a time yet to talk about {{student_first_name}}, and I did not want that to be because the link got lost in a busy inbox.

You can pick any time that suits you here:

{{scheduling_link}}

It is a short conversation — we want to hear what you are looking for for {{student_first_name}}, and answer whatever you want to ask us.

If none of those times work, simply reply to this email and we will find something that does.

Warm regards,
{{admissions_contact_name}}
{{school_name}}',
    0,
    false,
    'Sent the morning after the day-2 checkpoint, if no appointment has appeared on the campus calendar. Seeded inactive pending Jimmy''s approval of the wording.'
  ),
  (
    null,
    'parent_reminder_interest_meeting_not_booked_2',
    'Interest meeting not booked - 2nd follow-up',
    'email',
    'parent_interest_meeting_not_booked_2',
    'Still hoping to meet about {{student_first_name}}',
    'Dear {{guardian_first_name}},

I am following up once more about finding a time to talk about {{student_first_name}}.

{{scheduling_link}}

If the timing is wrong, or something has changed, that is completely fine — just reply and tell me, and I will stop emailing. And if you would rather talk than book online, reply with a number and a time and I will call you.

Warm regards,
{{admissions_contact_name}}
{{school_name}}',
    0,
    false,
    'The last automatic email to this family. Says so plainly rather than leaving them wondering. Seeded inactive.'
  ),
  (
    null,
    'staff_interest_meeting_no_response',
    'Three attempts, no booking - call the family',
    'staff_email',
    'staff_interest_meeting_no_response',
    'Three attempts, no booking — time to call {{student_first_name}}''s family',
    '{{student_name}} — {{school_name}}

This family has been sent the booking link three times and has not booked.

1st — {{invite_sent_at}}
2nd — {{reminder_1_sent_at}}
3rd — {{reminder_2_sent_at}}

{{guardian_name}}
{{parent_phone}}
{{guardian_email}}

What the family told us when they inquired:
"{{inquiry_notes}}"

No further emails will go to this family automatically. The next thing that happens to {{student_first_name}} is a phone call from you.

Record what came of the call here:
{{call_link}}

Three emails is where we stop. A fourth is not persistence, it is noise — and a family who has gone quiet after three is usually telling you something a phone call will find out in ninety seconds.',
    0,
    false,
    'Goes to the campus notification addresses at 7am Eastern, eight hours after the day-4 checkpoint. Channel staff_email, NOT email - see what that mistake did to staff_parent_unresponsive. Seeded inactive.'
  )
on conflict (school_id, template_key) do nothing;

commit;

notify pgrst, 'reload schema';

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT five rows.
--
--   Three chase templates, every one of them SWITCHED OFF. If any reads
--   "LIVE", stop - a family can be emailed words nobody has approved.
--
--   staff_parent_unresponsive on channel staff_email. If it still says
--   'email', the update above matched nothing and that letter is still
--   addressed to the family it is about.
--
--   One row confirming both new tables exist.

select 'template'                                   as what,
       t.template_key                               as name,
       t.channel,
       case when t.is_active then '*** LIVE ***' else 'switched off' end as state
  from public.admissions_communication_templates t
 where t.template_key in (
         'parent_reminder_interest_meeting_not_booked_1',
         'parent_reminder_interest_meeting_not_booked_2',
         'staff_interest_meeting_no_response',
         'staff_parent_unresponsive'
       )

union all

select 'tables',
       string_agg(c.relname, ', ' order by c.relname),
       '',
       case when count(*) = 2 then 'both created' else '*** MISSING ***' end
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname in ('interest_meeting_scan_runs', 'lead_call_outcomes')

 order by what, name;

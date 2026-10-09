-- 500_the_chase_reaches_virtual_and_hs_2026_10_05.sql
--
-- Two things, 5 October:
--
--   1. The whole chase goes live at The Academy Virtual and The Academy HS,
--      closing the last gap in step 2.
--   2. GA and FL's 2d stops saying "click this link to schedule -" and says
--      what the family is scheduling.
--
-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  ONE SENTENCE IN HERE IS MINE AND HAS NOT BEEN APPROVED. Read it before  ║
-- ║  you run this file. It is in the Virtual and HS copy of 2c, marked       ║
-- ║  CLAUDE'S SENTENCE below:                                                ║
-- ║                                                                          ║
-- ║      We will meet on Google Meet at the day/time you requested. The      ║
-- ║      link will be in your calendar invitation.                           ║
-- ║                                                                          ║
-- ║  It stands in for GA and FL's "I will call you at the number you         ║
-- ║  provided in your inquiry form and at the day/time you requested."       ║
-- ║  Every other word in all four letters is yours. Say the word and I will  ║
-- ║  change it before this runs.                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ── WHY VIRTUAL AND HS NEED THEIR OWN COPIES AT ALL ─────────────────────────
--
-- Two sentences, one in each letter, name how the meeting happens:
--
--   2c  GA/FL   I will call you at the number you provided in your inquiry
--               form and at the day/time you requested.
--       V/HS    CLAUDE'S SENTENCE, above.
--
--   2d  GA/FL   ...please click the following link to schedule a phone
--               conversation with me.
--       V/HS    ...please click the following link to schedule a virtual
--               Google Meet meeting with me.
--
-- Everything else in both letters is identical across all four campuses, and
-- 2e is identical everywhere.
--
-- "GOOGLE MEET", NOT "GOOGLE MEETS", for the reason written into 498: the
-- product has no S. Jimmy wrote "google meets" both times; this is the same
-- correction he let stand on the first letter.
--
-- ── ALL THREE, OR NONE, AT EACH CAMPUS ──────────────────────────────────────
--
-- Same rule migration 499 followed. 2e tells a school leader the family was
-- emailed three times and lists the dates; switch it on where 2c and 2d are
-- off and it says that having sent nothing. Switch 2c on alone and a family
-- is reminded once and then forgotten with nobody told.
--
-- So this writes six rows at Virtual and HS - three letters, two campuses -
-- and they go on together or the migration fails.
--
-- ── WHAT THIS DOES NOT TOUCH ────────────────────────────────────────────────
--
-- The four network rows stay switched off and keep my original draft wording.
-- Nothing reads them: all four campuses now override all three letters. They
-- are what a fifth campus would inherit.
--
-- Safe to re-run: upserts on (school_id, template_key), and the GA/FL edit is
-- guarded on the exact sentence it replaces.

begin;

-- ── 1. Virtual and HS get the whole chase ────────────────────────────────────

do $$
declare
  sch record;
  tpl record;
  seeded integer := 0;
begin
  for sch in
    select id, name from public.schools
     where name in ('The Academy Virtual', 'The Academy HS')
  loop
    for tpl in
      select template_key, trigger_event, subject, channel, body
        from public.admissions_communication_templates
       where school_id is null
         and template_key in (
               'parent_reminder_interest_meeting_not_booked_1',
               'parent_reminder_interest_meeting_not_booked_2',
               'staff_interest_meeting_no_response'
             )
    loop
      insert into public.admissions_communication_templates
        (school_id, template_key, name, channel, trigger_event, subject, body,
         delay_hours, is_active, category)
      values
        (sch.id,
         tpl.template_key,
         tpl.template_key || ' (' || sch.name || ')',
         tpl.channel,
         tpl.trigger_event,
         tpl.subject,
         case tpl.template_key

           when 'parent_reminder_interest_meeting_not_booked_1' then
$c$Dear {{guardian_first_name}},

Unfortunately we have not managed to find a time to talk about {{student_first_name}}. You can pick any time that fits your schedule by clicking on the following link -

{{scheduling_link}}

During our conversation, I would like to learn about the needs of {{student_first_name}}. Also during this time, I will provide you with a description of our school environment and share with you the type of learners who are successful and thrive in our type of school.

We will meet on Google Meet at the day/time you requested. The link will be in your calendar invitation.

Thank you and I look forward to our discussion.

Warm regards,
{{admissions_contact_name}}
{{school_name}}$c$

           when 'parent_reminder_interest_meeting_not_booked_2' then
$d$Dear {{guardian_first_name}},

I am following up once more about finding a time to talk about {{student_first_name}}.

If the time is wrong or something has changed on your end, I completely understand. If you could just reply to this email to let me know and I will stop bothering you. If you would like to move forward with our conversation, please click the following link to schedule a virtual Google Meet meeting with me.

{{scheduling_link}}

Warm regards,
{{admissions_contact_name}}
{{school_name}}$d$

           /* 2e is unchanged. Copied from the network row, not retyped. */
           else tpl.body
         end,
         0, true, 'inquiry')
      on conflict (school_id, template_key) do update set
        name          = excluded.name,
        channel       = excluded.channel,
        trigger_event = excluded.trigger_event,
        subject       = excluded.subject,
        body          = excluded.body,
        delay_hours   = excluded.delay_hours,
        is_active     = true,
        category      = excluded.category,
        updated_at    = now();

      seeded := seeded + 1;
    end loop;
  end loop;

  if seeded <> 6 then
    raise exception
      'Expected 6 rows (3 letters x 2 campuses), wrote % - a network row is missing.',
      seeded;
  end if;
end $$;

-- ── 2. GA and FL's 2d says what is being scheduled ───────────────────────────
--
-- "a phone conversation" is lifted from migration 493, Jimmy's own wording in
-- the letter that first promises it. Guarded on the exact old sentence, so if
-- 499 has not run - or this has already been applied - it matches nothing and
-- says so rather than overwriting an edit.

do $$
declare
  touched integer;
begin
  update public.admissions_communication_templates t
     set body = replace(
                  t.body,
                  'please click this link to schedule -',
                  'please click the following link to schedule a phone conversation with me.'
                ),
         updated_at = now()
    from public.schools sc
   where sc.id = t.school_id
     and t.template_key = 'parent_reminder_interest_meeting_not_booked_2'
     and sc.name in ('The Academy GA', 'The Academy FL')
     and t.body like '%please click this link to schedule -%';

  get diagnostics touched = row_count;

  if touched = 0 then
    raise notice 'GA/FL 2d unchanged - either 499 has not run, or this edit is already in.';
  elsif touched <> 2 then
    raise exception 'Expected 2 GA/FL rows, changed % - check the verify below.', touched;
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT fifteen rows and three counts.
--
--   four campuses x three letters = 12 rows, every one ON
--   three network rows, every one off
--
--   COUNT live, all four campuses : 12
--   COUNT campuses with a part chase: 0  <- the one that matters. A campus
--        with one or two letters live can remind a family and forget them,
--        or tell a school leader about three attempts that never happened.
--   COUNT 2d still vague          : 0
--
-- The `says` column reads the body, so a row that claims to be revised and is
-- not will show it.

select 'letter'                                                as what,
       coalesce(sc.name, 'every campus')                       as applies_to,
       replace(t.template_key, 'parent_reminder_interest_meeting_', '2x_') as detail,
       case when t.is_active then 'ON' else 'off' end          as state,
       case
         when t.body like '%I will call you at the number%'          then '2c — phone'
         when t.body like '%We will meet on Google Meet%'            then '2c — Google Meet'
         when t.body like '%schedule a phone conversation with me.%' then '2d — phone'
         when t.body like '%virtual Google Meet meeting with me.%'   then '2d — Google Meet'
         when t.body like '%please click this link to schedule -%'   then '*** 2d — STILL VAGUE ***'
         when t.body like '%sent the booking link three times%'      then '2e — unchanged'
         else 'a network draft'
       end                                                     as says

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key in (
         'parent_reminder_interest_meeting_not_booked_1',
         'parent_reminder_interest_meeting_not_booked_2',
         'staff_interest_meeting_no_response'
       )

union all

select 'COUNT live, all four campuses', '', count(*)::text,
       case when count(*) = 12 then 'the whole chase, everywhere'
            else '*** NOT EVERY CAMPUS HAS ALL THREE ***' end, ''
  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where t.is_active
   and t.template_key in (
         'parent_reminder_interest_meeting_not_booked_1',
         'parent_reminder_interest_meeting_not_booked_2',
         'staff_interest_meeting_no_response'
       )

union all

select 'COUNT campuses with a part chase', '', count(*)::text,
       case when count(*) = 0 then 'nobody is reminded once and forgotten'
            else '*** A CAMPUS HAS SOME LETTERS ON AND NOT OTHERS ***' end, ''
  from (
    select t.school_id
      from public.admissions_communication_templates t
     where t.school_id is not null
       and t.is_active
       and t.template_key in (
             'parent_reminder_interest_meeting_not_booked_1',
             'parent_reminder_interest_meeting_not_booked_2',
             'staff_interest_meeting_no_response'
           )
     group by t.school_id
    having count(*) <> 3
  ) partial

union all

select 'COUNT 2d still vague', '', count(*)::text,
       case when count(*) = 0 then 'every 2d names what is being scheduled'
            else '*** A 2d STILL ENDS ON A DASH ***' end, ''
  from public.admissions_communication_templates t
 where t.school_id is not null
   and t.template_key = 'parent_reminder_interest_meeting_not_booked_2'
   and t.body like '%please click this link to schedule -%'

 order by what, applies_to, detail;

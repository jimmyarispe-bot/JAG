-- 505_one_shadow_day_at_virtual_and_hs_2026_10_05.sql
--
-- Step 5a becomes two letters. Migration 504, run an hour ago, was right for
-- GA and FL and wrong for the other two.
--
-- Jimmy, 5 October: "yes this is ready but only for ga n fl. virtual n hs
-- only have 1 shadow day and it comes before the application."
--
-- ── WHAT 504 DID, AND WHY IT NEEDED THIS ────────────────────────────────────
--
-- shadow_days_invite_email was ONE NETWORK ROW serving all four campuses.
-- 504 deleted the sentence that told them apart - "Virtual students are
-- required to attend 1 Shadow Day and In-Person/Campus students are required
-- to attend 2 Shadow Days" - and fixed the number at two.
--
-- So since that migration, a Virtual or HS family would be invited to TWO
-- shadow days when they attend one.
--
-- NOBODY HAS RECEIVED IT. EMAIL_DIVERT_TO is set in Vercel, so every copy
-- went to the divert inbox. The window was about an hour and it was closed
-- before a letter could reach a family, which is the whole argument for
-- leaving that variable in place until a chain has been walked end to end.
--
-- ── THE SECOND FAULT, WHICH IS OLDER THAN 504 ───────────────────────────────
--
-- The letter opens:
--
--     Thank you for completing {{student_first_name}}'s application.
--
-- At Virtual and HS THERE IS NO APPLICATION YET. The fork decided on
-- 3 October runs the shadow day FIRST at those two campuses and the
-- application after it:
--
--     GA · FL      application  ->  shadow days  ->  accept or deny
--     Virtual · HS shadow day   ->  application  ->  accept or deny
--
-- So that opening has been thanking Virtual and HS families for something
-- they had not done since the letter was written in migration 247. 504 did
-- not cause it and did not fix it; this does.
--
-- THE REPLACEMENT OPENING IS LIFTED FROM JIMMY'S OWN 4a LETTER - "Thank you
-- for the time you spent with me earlier so that I could learn about
-- {{student_first_name}}" - because at Virtual and HS the thing that just
-- happened is the virtual meeting, and he has already written the sentence
-- for exactly that moment. It is his wording, moved, not new wording.
--
-- ── THE TWO LETTERS ─────────────────────────────────────────────────────────
--
--   GA, FL        2 Shadow Days. "the days", "your days", "the shadow days".
--                 Opening unchanged: they HAVE completed an application.
--   Virtual, HS   1 Shadow Day. "the day", "your day", "the shadow day".
--                 Opening replaced, for the reason above.
--
-- THE NETWORK ROW IS LEFT ALONE and keeps 504's wording. All four campuses
-- override it after this, so nothing reads it; it is what a fifth campus
-- would inherit, and two days is the better default for a campus with a
-- building.
--
-- Safe to re-run: upserts on (school_id, template_key).

begin;

do $$
declare
  sch record;
  v_trigger text;
  v_subject text;
  v_channel text;
  seeded integer := 0;
begin
  select trigger_event, subject, channel
    into v_trigger, v_subject, v_channel
    from public.admissions_communication_templates
   where template_key = 'shadow_days_invite_email'
     and school_id is null;

  if v_trigger is null then
    raise exception 'No network shadow_days_invite_email row - migration 247 has not run.';
  end if;

  for sch in
    select id, name from public.schools
     where name in ('The Academy GA', 'The Academy FL',
                    'The Academy Virtual', 'The Academy HS')
  loop
    insert into public.admissions_communication_templates
      (school_id, template_key, name, channel, trigger_event, subject, body,
       delay_hours, is_active, category)
    values
      (sch.id,
       'shadow_days_invite_email',
       'Shadow Days Invitation (' || sch.name || ')',
       v_channel,
       v_trigger,
       v_subject,
       case when sch.name in ('The Academy GA', 'The Academy FL') then

$two$Dear {{guardian_first_name}},

Thank you for completing {{student_first_name}}'s application. We would like to invite {{student_first_name}} to spend 2 Shadow Days with us. During this time, {{student_first_name}} will interact with the other students, attend the same classes they do, and we trust will enjoy the days with us.

You can choose your days here: {{shadow_days_link}}

In your confirmation calendar notice, there will be specific information included that you will need to make the shadow days at our school as enjoyable and successful for {{student_first_name}} as possible.

If none of the times work, reply to this email and we will find something that does.

Warm regards,
{{admissions_contact_name}}
{{school_name}} Admissions$two$

       else

$one$Dear {{guardian_first_name}},

Thank you for the time you spent with me earlier so that I could learn about {{student_first_name}}. We would like to invite {{student_first_name}} to spend 1 Shadow Day with us. During this time, {{student_first_name}} will interact with the other students, attend the same classes they do, and we trust will enjoy the day with us.

You can choose your day here: {{shadow_days_link}}

In your confirmation calendar notice, there will be specific information included that you will need to make the shadow day at our school as enjoyable and successful for {{student_first_name}} as possible.

If none of the times work, reply to this email and we will find something that does.

Warm regards,
{{admissions_contact_name}}
{{school_name}} Admissions$one$

       end,
       0, true, 'admissions')
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

  if seeded <> 4 then
    raise exception 'Expected 4 campuses, wrote % - check the school names.', seeded;
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT five rows and two counts.
--
--   The Academy FL        2 days   application first    ON
--   The Academy GA        2 days   application first    ON
--   The Academy HS        1 day    meeting first        ON
--   The Academy Virtual   1 day    meeting first        ON
--   every campus          2 days   application first    (the unread network row)
--
--   COUNT told two days when they attend one : 0  <- the one that matters
--   COUNT thanked for an application they have not made : 0
--
-- Both counts must read 0. Either reading anything else means a Virtual or
-- HS family is about to be invited to the wrong thing, or thanked for
-- something they have not done.

select coalesce(sc.name, 'every campus')                       as campus,

       case when t.body like '%spend 1 Shadow Day with us%' then '1 day'
            when t.body like '%spend 2 Shadow Days with us%' then '2 days'
            else '*** other ***' end                           as how_many,

       case when t.body like '%Thank you for completing%' then 'application first'
            when t.body like '%Thank you for the time you spent%' then 'meeting first'
            else '*** other ***' end                           as opening,

       case when t.is_active then 'ON' else 'off' end          as state,

       case when t.body like '%day(s)%' then '*** STILL SAYS day(s) ***'
            else 'clean' end                                   as parenthetical

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'shadow_days_invite_email'

union all

select 'COUNT told two days when they attend one',
       count(*)::text, '',
       case when count(*) = 0 then 'correct'
            else '*** VIRTUAL OR HS IS BEING INVITED TO TWO DAYS ***' end, ''
  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where t.template_key = 'shadow_days_invite_email'
   and sc.name in ('The Academy Virtual', 'The Academy HS')
   and t.body like '%spend 2 Shadow Days%'

union all

select 'COUNT thanked for an application they have not made',
       count(*)::text, '',
       case when count(*) = 0 then 'correct'
            else '*** THE OPENING IS WRONG AT A SHADOW-DAY-FIRST CAMPUS ***' end, ''
  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where t.template_key = 'shadow_days_invite_email'
   and sc.name in ('The Academy Virtual', 'The Academy HS')
   and t.body like '%Thank you for completing%'

 order by campus;

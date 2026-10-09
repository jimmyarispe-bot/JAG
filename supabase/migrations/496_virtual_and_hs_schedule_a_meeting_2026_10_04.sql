-- 496_virtual_and_hs_schedule_a_meeting_2026_10_04.sql
--
-- A campus override of inquiry_thank_you_email for The Academy Virtual and
-- The Academy HS. Jimmy approved the wording on 4 October: "this is good for
-- virtual and use same for hs but w hs refernces".
--
-- THE HS REFERENCES ARE AUTOMATIC. The body names the school through
-- {{school_name}} and nowhere else, so the same text renders "The Academy
-- Virtual" at one campus and "The Academy HS" at the other. There is no
-- second version to keep in step - which is the point of the token.
--
-- WHERE EACH CAMPUS NOW STANDS ON THIS LETTER:
--
--   GA and FL    migration 493 - a PHONE conversation, and "I will give you
--                a call at the number you provided in the inquiry form"
--   Virtual, HS  this one - a VIRTUAL meeting, with the video link in the
--                calendar invitation
--   the network row is left untouched, as the fallback for a campus that has
--   no override of its own. Nobody reads it today.
--
-- ORDER DOES NOT MATTER. These are explicit per-campus rows, so this can run
-- before or after 493 and neither disturbs the other.
--
-- THE TRIGGER EVENT IS COPIED FROM THE NETWORK ROW rather than written in.
-- Migration 489 moved this letter from 'inquiry_submitted' to
-- 'interest_meeting_link_sent' - the family's first letter is now sent by a
-- school leader pressing a button, not by the form - and copying the value
-- means this works whichever of the two has run.
--
-- Safe to re-run: the insert upserts on (school_id, template_key).

begin;

do $$
declare
  sch record;
  v_trigger text;
  v_subject text;
  seeded integer := 0;
begin
  select trigger_event, subject
    into v_trigger, v_subject
    from public.admissions_communication_templates
   where template_key = 'inquiry_thank_you_email'
     and school_id is null;

  if v_trigger is null then
    raise exception 'No network inquiry_thank_you_email row found - nothing to override.';
  end if;

  for sch in
    select id, name from public.schools
     where name in ('The Academy Virtual', 'The Academy HS')
  loop
    insert into public.admissions_communication_templates
      (school_id, template_key, name, channel, trigger_event, subject, body,
       delay_hours, is_active, category)
    values
      (sch.id,
       'inquiry_thank_you_email',
       'Inquiry Thank You - virtual meeting (' || sch.name || ')',
       'email',
       v_trigger,
       v_subject,
       $letter$Dear {{guardian_first_name}},

Thank you for your interest in {{school_name}}. We received your inquiry for {{student_name}}.

The next step is to schedule a virtual meeting with me so you can share your child's needs with me and the type of school environment you want for {{student_first_name}}. Please click the following link to schedule our meeting. The video link will be in your calendar invitation.

{{scheduling_link}}

Warm regards,
{{admissions_contact_name}}
{{school_name}}$letter$,
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

  if seeded <> 2 then
    raise exception 'Expected 2 campuses, wrote % - check the school names.', seeded;
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT six rows and a count.
--
--   The Academy FL        phone call        (493 — if it reads 'the old
--   The Academy GA        phone call         wording', 493 has not run yet)
--   The Academy HS        virtual meeting
--   The Academy Virtual   virtual meeting
--   every campus          the old wording   — the unused fallback
--   every campus          inquiry_thank_you_email_no_link, unchanged
--
--   COUNT trigger events in use: 1. Anything else and a campus would get two
--   letters or none, because the engine picks templates by event first and
--   de-duplicates by key second.

select 'letter'                                               as what,
       coalesce(sc.name, 'every campus')                      as applies_to,
       t.template_key                                         as detail,
       case when t.is_active then 'ON' else 'off' end         as state,
       case
         when t.body like '%virtual meeting%'    then 'virtual meeting'
         when t.body like '%phone conversation%' then 'phone call'
         when t.body like '%We will use this time together%' then 'the old wording'
         else 'other'
       end                                                    as wording,
       t.trigger_event

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key in ('inquiry_thank_you_email', 'inquiry_thank_you_email_no_link')

union all

select 'COUNT trigger events in use',
       '',
       count(distinct t.trigger_event)::text,
       case when count(distinct t.trigger_event) = 1
            then 'one event — every override replaces the network row cleanly'
            else '*** TWO EVENTS — A CAMPUS WOULD GET BOTH OR NEITHER ***' end,
       '', ''
  from public.admissions_communication_templates t
 where t.template_key = 'inquiry_thank_you_email'

 order by what, applies_to, detail;

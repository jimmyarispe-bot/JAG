-- 482_dear_maria_not_dear_maria_tondreau_2026_10_04.sql
--
-- Every letter a FAMILY receives now greets them by first name.
--
-- {{parent_name}} renders the guardian's FULL name, so nineteen letters have
-- been opening "Dear Maria Tondreau," - including inquiry_thank_you_email,
-- which is the first thing The Academy ever says to a family and goes out
-- within seconds of them inquiring.
--
-- It has a second failure that matters more. When a guardian's name is
-- missing from the record, {{parent_name}} falls back to the literal word
-- "Family" - so an incomplete record produces "Dear Family,", which reads
-- exactly like a mail merge that came up empty. {{guardian_first_name}} falls
-- back to "there", which is plainer and does not announce itself.
--
-- Exactly one letter already did this correctly: student_accepted_email. It
-- was fixed in September and nothing else was.
--
-- STAFF LETTERS ARE NOT TOUCHED, and the where clause is what guarantees it.
-- A school leader reading a notice about a family wants the full name: there
-- are two Fionas and two Israels on the roll, and that ambiguity is precisely
-- what a surname is for. Only channels a family reads - email and sms - are
-- in scope.
--
-- A CAMPUS OVERRIDE IS INCLUDED IF ONE EXISTS. An override is a letter a
-- family reads too, and leaving it on the old token would mean one campus
-- quietly kept saying "Dear Maria Tondreau,". The verify names every row it
-- changed, so an override shows itself.
--
-- NOTHING ELSE ABOUT ANY LETTER CHANGES. One token, substituted in place.
-- The subjects still carry {{student_name}} - the child's full name - and
-- that is deliberately left alone: "Callum Tondreau has been accepted to The
-- Academy Virtual" is a sentence a parent may well print and keep. The
-- greeting line is where a full name grates, and the greeting line is all
-- this touches.
--
-- Safe to re-run: the guard means a second run matches nothing.

begin;

update public.admissions_communication_templates
   set subject = replace(subject, '{{parent_name}}', '{{guardian_first_name}}'),
       body    = replace(body,    '{{parent_name}}', '{{guardian_first_name}}'),
       updated_at = now()
 where channel in ('email', 'sms')
   and (subject like '%{{parent_name}}%' or body like '%{{parent_name}}%');

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT a row per family letter, every greeting reading
-- "Dear {{guardian_first_name}}," - and a final COUNT row reading 0.
--
-- The count row is there on purpose. A verify that proves success by
-- returning no rows cannot tell "it worked" from "the query was wrong", and
-- this platform has been bitten by that difference more than once.
--
-- If the count is above zero, something in a family letter still carries the
-- old token - most likely because its channel is spelled something other than
-- email or sms.

select 'letter'                                                      as what,
       coalesce(sc.name, 'every campus')                             as applies_to,
       t.template_key,
       split_part(t.body, E'\n', 1)                                  as greeting_line,
       case when t.is_active then 'ON' else 'off' end                as state

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.channel in ('email', 'sms')
   and t.body like '%{{guardian_first_name}}%'

union all

select 'COUNT still saying {{parent_name}}',
       '',
       count(*)::text,
       case when count(*) = 0
            then 'none left — every family letter greets by first name'
            else '*** SOME FAMILY LETTERS STILL USE THE FULL NAME ***' end,
       ''
  from public.admissions_communication_templates t
 where t.channel in ('email', 'sms')
   and (t.subject like '%{{parent_name}}%' or t.body like '%{{parent_name}}%')

 order by what, applies_to, template_key;

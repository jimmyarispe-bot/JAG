-- 487_program_not_programme_2026_10_04.sql
--
-- One word, in one letter.
--
-- The staff notice a school leader gets the moment a family inquires carries,
-- verbatim:
--
--     <p>Programme: {{program_name}}</p>
--
-- Jimmy's standing rule, 30 September: "also remember american english.
-- enrollment, program - 2 examples of what i've noticed to this point."
--
-- "Programme" is British. It is the same rule behind enrollment over
-- enrolment, and it is written in a letter that goes to Heather, Nina and
-- Danni every single time somebody inquires.
--
-- THIS IS THE ONLY PLACE IT SURVIVES. Every template body in the platform
-- was read on 4 October and inquiry_staff_alert is the one row that still
-- spells it that way. The guard below is a plain replace, so if another
-- campus holds an overriding copy of this letter it is corrected too, and the
-- verify names every row it touched.
--
-- NOT FIXED HERE, because it is not a spelling problem: the em dash after the
-- colon. program_name renders through programLabel(), which returns "—" for a
-- null, so "Programme: —" means the lead has no program on it at all. That is
-- what what_arthurs_inquiry_carried.sql is for.
--
-- Safe to re-run: a second run matches nothing.

begin;

update public.admissions_communication_templates
   set body = replace(body, 'Programme:', 'Program:'),
       subject = replace(subject, 'Programme', 'Program'),
       updated_at = now()
 where (body like '%Programme%' or subject like '%Programme%');

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT two rows.
--
--   One for inquiry_staff_alert, showing the corrected line.
--
--   One COUNT row reading 0. If it reads anything else, a template still
--   spells it the British way - most likely a campus override, and the first
--   row will name it.

select 'letter'                                            as what,
       coalesce(sc.name, 'every campus')                   as applies_to,
       t.template_key                                      as detail,
       case when t.body like '%Programme%' or t.subject like '%Programme%'
            then '*** STILL BRITISH ***' else 'Program' end as state,
       case when t.body like '%Program: %'
            then substring(t.body from '<p>Program:[^<]*</p>')
            else '' end                                    as extra

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'inquiry_staff_alert'

union all

select 'COUNT still saying Programme',
       '',
       count(*)::text,
       case when count(*) = 0
            then 'none left — American English throughout'
            else '*** A TEMPLATE STILL SPELLS IT PROGRAMME ***' end,
       ''
  from public.admissions_communication_templates t
 where t.body like '%Programme%' or t.subject like '%Programme%'

 order by what, applies_to, detail;

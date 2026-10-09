-- 488_the_staff_notice_reads_what_the_family_ticked_2026_10_04.sql
--
-- RUN THIS *AFTER* THE CODE HAS DEPLOYED. It puts {{inquiry_programs}} into a
-- live letter, and that merge field does not exist until this ship lands.
-- renderTemplate leaves an unknown token in place as literal text, so in the
-- wrong order Heather reads the characters {{inquiry_programs}}.
--
-- WHAT THIS FIXES. The staff notice sent the moment a family inquires has
-- carried, verbatim:
--
--     <p>Programme: {{program_name}}</p>
--
-- and it has rendered, on every inquiry the public form has ever produced:
--
--     Programme: —
--
-- THE EM DASH IS NOT FORMATTING. program_name renders
-- programLabel(lead.program), whose first line is `if (!value) return "—";`,
-- and admissions_leads.program is null on every public inquiry - set so
-- deliberately by submit.ts, on the line that does it:
--
--     // Multi-select is archived on interest answers; do not collapse onto lead.program.
--     p_program: null,
--
-- IT IS RIGHT TO. There are two program vocabularies in this platform and
-- they do not meet. admissions_leads.program has a CHECK constraint on the
-- canonical codes - academy_fl_campus, academy_fl_virtual, academy_ga_campus,
-- academy_ga_hybrid, academy_hs, academy_virtual. The interest form offers a
-- parent "In-Person", "Only Virtual" and "Hybrid (in-person + virtual)", and
-- since 28 September lets them tick more than one. "Only Virtual" would fail
-- the constraint, and two ticks have nowhere to go in a single column.
--
-- So the letter was asking the wrong place. The family's answer is in
-- admissions_interest_answers under question_key 'program', and that is where
-- {{inquiry_programs}} now reads it - newest submission, in the words the
-- parent actually saw, comma separated when they ticked more than one.
--
-- Proved against a live submission: Adam Cross's inquiry for Arthur, 4
-- October 08:57, carried ["Only Virtual"] while the lead carried null.
--
-- MEASURED: 33 of the 334 leads created in the last sixty days have a null
-- program. Those are the ones that came through this form.
--
-- THE SPELLING IS HANDLED HERE TOO, so this is safe to run whether or not 487
-- has been. Both the British and the American spelling of that line are
-- matched, and both become the same thing.
--
-- Safe to re-run: a second run matches nothing.

begin;

update public.admissions_communication_templates
   set body = replace(
                replace(body,
                        '<p>Programme: {{program_name}}</p>',
                        '<p>Program: {{inquiry_programs}}</p>'),
                '<p>Program: {{program_name}}</p>',
                '<p>Program: {{inquiry_programs}}</p>'),
       updated_at = now()
 where template_key = 'inquiry_staff_alert'
   and (body like '%<p>Programme: {{program_name}}</p>%'
     or body like '%<p>Program: {{program_name}}</p>%');

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT two rows.
--
--   inquiry_staff_alert, showing the corrected line, reading
--   'reads the family answer' and 'Program'.
--
--   A COUNT row reading 0 - no template anywhere still points this line at
--   {{program_name}}. If it is above zero, a campus holds its own copy of
--   this letter and the first row will name it.
--
-- {{program_name}} ITSELF IS LEFT REGISTERED AND WORKING. It is correct
-- wherever a real canonical code exists on a lead - a student created by
-- staff rather than through the public form. Nothing else in the platform
-- uses it today, but removing a merge field is a different decision from
-- fixing a letter.

select 'letter'                                              as what,
       coalesce(sc.name, 'every campus')                     as applies_to,
       t.template_key                                        as detail,
       case when t.body like '%{{inquiry_programs}}%'
            then 'reads the family answer'
            else '*** STILL READS THE LEAD ***' end          as state,
       coalesce(substring(t.body from '<p>Program[^<]*</p>'),
                '*** THE PROGRAM LINE IS GONE ***')          as extra

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'inquiry_staff_alert'

union all

select 'COUNT still pointing at {{program_name}}',
       '',
       count(*)::text,
       case when count(*) = 0
            then 'none — every program line reads the inquiry'
            else '*** A TEMPLATE STILL READS THE LEAD ***' end,
       ''
  from public.admissions_communication_templates t
 where t.body like '%Program: {{program_name}}%'
    or t.body like '%Programme: {{program_name}}%'

 order by what, applies_to, detail;

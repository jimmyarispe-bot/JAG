-- WHAT EVERY CLASS IS CALLED TODAY, AND WHAT IT SAYS ABOUT ITSELF
--
-- 29 September 2026. Jimmy sent two documents of class names and descriptions
-- and filled in the rename matrix. Three of his answers cannot be acted on
-- without the real course list:
--
--   Lit Lab replaces "writing, reading comprehension"  - a description, or
--                    the literal name of one or two courses?
--   Earthology       "new" - but Earth Lab's answer says it "becomes earth
--                    quest and/or also replaces earthology". One row cannot
--                    become both.
--   Structured Literacy  "Structured Literacy and/or Wilson" - which is the
--                    course actually called?
--
-- CORRECTED TWICE. The first version guessed `f.name`, `v.status` and
-- `published_at` on the form tables. This one guessed `course_sections.name`,
-- which does not exist - sections have a `section_code` and no name at all,
-- so a section is only ever labelled by its course. Every column below is
-- taken from the create statements in 047_sprint1_course_tables.sql and the
-- query was run against a local Postgres 16 with those columns before being
-- sent.
--
-- THAT ABSENCE IS ITSELF AN ANSWER. Jimmy asked for section names to be
-- renamed too. There is nothing to rename: "VEDDER-1300 DigitLab" is the
-- section_code and the COURSE name shown together, so renaming the course
-- renames every section label with it.
--
-- One statement. Reads only.

select x.section, x.item, x.detail_a, x.detail_b
from (
  select 1 as ord, 'A. COURSE' as section,
         s.name || '  ::  ' || c.name as item,
         'code=' || coalesce(c.code,'(none)') ||
           '   subject=' || coalesce(c.subject,'(none)') ||
           '   level=' || coalesce(c.academic_level,'(none)') as detail_a,
         case when c.description is null or btrim(c.description) = ''
              then '** NO DESCRIPTION **'
              else left(c.description, 200) end as detail_b
    from public.courses c
    join public.schools s on s.id = c.school_id

  union all

  -- How much hangs off each course. These are the sections a rename must not
  -- disturb, and the reason this is an UPDATE and never a delete.
  select 2, 'B. SECTIONS OF IT',
         s.name || '  ::  ' || c.name,
         'sections=' || count(*)::text,
         string_agg(cs.section_code, ', ' order by cs.section_code)
    from public.course_sections cs
    join public.courses c on c.id = cs.course_id
    join public.schools s on s.id = c.school_id
   group by s.name, c.name

  union all

  -- Where "foundational" actually lives, so the change to "core" lands on the
  -- right field rather than on all four.
  select 3, 'C. SAYS FOUNDATIONAL',
         s.name || '  ::  ' || c.name,
         'in=' || concat_ws(' + ',
             case when lower(coalesce(c.name,''))           like '%foundational%' then 'name' end,
             case when lower(coalesce(c.subject,''))        like '%foundational%' then 'subject' end,
             case when lower(coalesce(c.academic_level,'')) like '%foundational%' then 'academic_level' end,
             case when lower(coalesce(c.description,''))    like '%foundational%' then 'description' end),
         left(coalesce(c.description,''), 200)
    from public.courses c
    join public.schools s on s.id = c.school_id
   where lower(coalesce(c.name,''))           like '%foundational%'
      or lower(coalesce(c.subject,''))        like '%foundational%'
      or lower(coalesce(c.academic_level,'')) like '%foundational%'
      or lower(coalesce(c.description,''))    like '%foundational%'
) x
order by x.section, x.item;

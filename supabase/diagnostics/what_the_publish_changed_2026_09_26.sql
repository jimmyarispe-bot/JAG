-- What actually changed between the last two versions of the interest form.
--
-- Jimmy changed one label - "Date of Birth" to "Birthdate" - and the help text
-- under that question stopped rendering on /apply. He did not touch it. So
-- either the editor sent something it should not have, or the renderer stopped
-- showing something that is still there. This says which, per question, rather
-- than reasoning about the code.
--
-- ONE statement. Read only. Nothing here changes anything.
--
-- HOW TO READ IT
--   'label'       : the question's label before -> after
--   'help'        : its help text before -> after. "(none)" on the right where
--                   there used to be text is a help text that was LOST.
--   'placeholder' : same, and the one I most expect to be wrong - the editor
--                   has no placeholder box, so it may have been sending an
--                   empty one for every question and clearing them all.
--
-- Rows appear only where something differs. No rows means the two versions say
-- the same thing and the fault is in the renderer instead.

with versions as (
  select v.version_number, v.definition, v.lifecycle
    from public.admissions_interest_form_versions v
    join public.admissions_interest_forms f on f.id = v.form_id
   where v.version_number in (
           select max(version_number) from public.admissions_interest_form_versions
         )
      or v.version_number in (
           select max(version_number) - 1 from public.admissions_interest_form_versions
         )
),
newest as (
  select version_number, definition from versions
   where version_number = (select max(version_number) from versions)
),
previous as (
  select version_number, definition from versions
   where version_number = (select min(version_number) from versions)
),
new_q as (
  select q->>'key' as key,
         q->>'label' as label,
         q->>'helpText' as help,
         q->>'placeholder' as placeholder
    from newest, jsonb_array_elements(definition->'questions') q
),
old_q as (
  select q->>'key' as key,
         q->>'label' as label,
         q->>'helpText' as help,
         q->>'placeholder' as placeholder
    from previous, jsonb_array_elements(definition->'questions') q
)
select 'label'::text as field,
       o.key,
       coalesce(o.label, '(none)') as before,
       coalesce(n.label, '(none)') as after
  from old_q o join new_q n on n.key = o.key
 where coalesce(o.label, '') is distinct from coalesce(n.label, '')

union all

select 'help', o.key, coalesce(o.help, '(none)'), coalesce(n.help, '(none)')
  from old_q o join new_q n on n.key = o.key
 where coalesce(o.help, '') is distinct from coalesce(n.help, '')

union all

select 'placeholder', o.key, coalesce(o.placeholder, '(none)'), coalesce(n.placeholder, '(none)')
  from old_q o join new_q n on n.key = o.key
 where coalesce(o.placeholder, '') is distinct from coalesce(n.placeholder, '')

order by 1, 2;

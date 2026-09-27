-- 440_one_scholarship_question_not_two_2026_09_27.sql
--
-- Version 29. The generic "do you have a scholarship" question retires, so an
-- out-of-state family is asked about their scholarship once.
--
-- WHY THIS IS A SEPARATE FILE. Migration 439 only added. This one takes
-- something live away, and Jimmy's standing rule is that nothing already in
-- use gets replaced without his word. Run 439 on its own and the form is
-- correct but repetitive. Run this one too and it is correct and short.
--
-- WHAT IT REMOVES, and from whom. The HS and Virtual sections each carry a
-- question asking whether the family has "a scholarship from our state,
-- district or other governmental source", each with an award-letter upload
-- hanging off it. Migration 436 already hid all four from Georgia and Florida
-- residents, because those families answer their own state's real questions.
-- Since 439 every other resident has real questions too - which program, how
-- much, the award number, the letter, and the documents that program's state
-- expects a school to hold. The generic pair now asks a worse version of a
-- question the family has already answered, into a different field, so the
-- same fact would be recorded twice and could disagree with itself.
--
-- HOW IT REMOVES THEM. The four questions are taken out of their sections'
-- `questionKeys` and left in the definition as orphans. Nothing renders them
-- and nothing validates them, but they are still there to read, the form
-- builder at /dashboard/admin/forms lists them under orphan questions, and
-- putting one back is a one-line change rather than a rewrite. Deleting them
-- outright would also be safe for recorded answers - a submission keeps its
-- own keys - but it would throw away the wording, and the wording is the part
-- that took a year to get right.
--
-- The uploads are found by the fact that their rules READ the two select
-- questions, never by a key typed from memory. A key typed from memory is how
-- a rule silently matches nothing and the change looks applied when it is not.
--
-- Safe to re-run: it exits without writing if the keys are already orphaned.

do $$
declare
  v_form_id      uuid;
  v_org_id       uuid;
  v_published_id uuid;
  v_def          jsonb;
  v_retire       text[];
  v_sections     jsonb;
  v_next_number  int;
  v_hash         text;
  v_new_id       uuid;
begin
  select id, organization_id, published_version_id
    into v_form_id, v_org_id, v_published_id
    from public.admissions_interest_forms;

  select definition into v_def
    from public.admissions_interest_form_versions
   where id = v_published_id;

  if not exists (
    select 1 from jsonb_array_elements(v_def->'questions') q
     where q->>'key' = 'state_funding_using'
  ) then
    raise exception 'The out-of-state section is not live. Run 439 first, or an out-of-state family is asked nothing at all.';
  end if;

  select array_agg(q->>'key')
    into v_retire
    from jsonb_array_elements(v_def->'questions') q
   where q->>'key' in ('hs_has_scholarship', 'virtual_has_scholarship')
      or (q->'visibleWhen')::text like '%hs_has_scholarship%'
      or (q->'visibleWhen')::text like '%virtual_has_scholarship%';

  if v_retire is null or array_length(v_retire, 1) = 0 then
    raise notice 'Nothing matched. Already retired, or the keys changed.';
    return;
  end if;

  raise notice 'Retiring % questions: %', array_length(v_retire, 1), v_retire;

  if not exists (
    select 1 from jsonb_array_elements(v_def->'sections') s,
                  jsonb_array_elements_text(s->'questionKeys') k
     where k = any(v_retire)
  ) then
    raise notice 'Already orphaned. Nothing changed.';
    return;
  end if;

  select jsonb_agg(
           jsonb_set(s, '{questionKeys}', coalesce((
             select jsonb_agg(k order by k_ord)
               from jsonb_array_elements_text(s->'questionKeys')
                    with ordinality as kt(k, k_ord)
              where not (k = any(v_retire))
           ), '[]'::jsonb))
           order by ord)
    into v_sections
    from jsonb_array_elements(v_def->'sections') with ordinality as t(s, ord);

  v_def := jsonb_set(v_def, '{sections}', v_sections);

  v_hash := encode(sha256(convert_to(v_def::text, 'UTF8')), 'hex');

  select coalesce(max(version_number), 0) + 1 into v_next_number
    from public.admissions_interest_form_versions where form_id = v_form_id;

  update public.admissions_interest_form_versions
     set lifecycle = 'archived' where id = v_published_id;

  insert into public.admissions_interest_form_versions (
    form_id, organization_id, version_number, lifecycle,
    schema_version, definition, content_hash, published_at
  )
  values (
    v_form_id, v_org_id, v_next_number, 'published',
    coalesce(v_def->>'schemaVersion', 'interest_form.v1'), v_def, v_hash, now()
  )
  returning id into v_new_id;

  update public.admissions_interest_forms
     set published_version_id = v_new_id, draft_version_id = null, updated_at = now()
   where id = v_form_id;

  raise notice 'Published v%.', v_next_number;
end $$;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- 'orphaned now'  : four rows - the two selects and their two uploads. Each is
--                   still in the definition and in no section.
-- 'still in a section' : MUST BE EMPTY.
-- 'asked once'    : the questions an out-of-state family now answers about
--                   state money. If `hs_has_scholarship` or
--                   `virtual_has_scholarship` appears here, this did not work.

with live as (
  select v.definition
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
),
retired as (
  select q->>'key' as key, left(q->>'label', 60) as label
    from live, jsonb_array_elements(definition->'questions') q
   where q->>'key' in ('hs_has_scholarship', 'virtual_has_scholarship')
      or (q->'visibleWhen')::text like '%hs_has_scholarship%'
      or (q->'visibleWhen')::text like '%virtual_has_scholarship%'
)
select 'orphaned now'::text as finding, r.key as detail, r.label as detail_2
  from retired r
union all
select 'still in a section', r.key, s->>'key'
  from live, retired r, jsonb_array_elements(definition->'sections') s
 where (s->'questionKeys') ? r.key
union all
select 'asked once', q->>'key', left(q->>'label', 60)
  from live, jsonb_array_elements(definition->'questions') q
 where q->>'key' like 'state_funding%'
order by 1, 2;

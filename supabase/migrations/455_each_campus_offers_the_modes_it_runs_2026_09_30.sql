-- 455_each_campus_offers_the_modes_it_runs_2026_09_30.sql
--
-- Jimmy, 29 September 2026, walking the live inquiry campus by campus:
--   "the academy fl n the academy ga - delete hybrid option"
--   "the academy hs - delete in person"
--   "the academy virtual - only virtual should be the only option. delete the
--    other 2"
--
-- WHAT CHANGES, and what does not. Migration 454 made Program(s) of Interest
-- ONE question asked identically at every campus, because Jimmy's rule was
-- "these are the only fields that should ever show... for all schools at all
-- times". That rule is about FIELDS. The choices inside a field are a
-- different thing, and they are not the same at a campus with a building and
-- a campus without one.
--
-- So the question stays single and shared. Its OPTIONS gain rules:
--
--   In-Person                   FL, GA
--   Only Virtual                every campus
--   Hybrid (in-person+virtual)  HS
--
--   FL       In-Person, Only Virtual
--   GA       In-Person, Only Virtual
--   HS       Only Virtual, Hybrid (in-person + virtual)
--   Virtual  Only Virtual
--
-- OPTION-LEVEL visibleWhen, not three questions again. It was added on
-- 27 September for exactly this shape - a Georgia resident at Virtual may use
-- their GA Special Needs scholarship but cannot apply for GA GOAL - and
-- program_selector began honouring it in commit 27a5dff3 on the 29th, in the
-- renderer and in the submit validator both. So from this version a posted
-- form naming Hybrid against Florida is REFUSED, not merely hidden.
--
-- IN-PERSON IS LISTED, NOT INFERRED. `any` of FL or GA, rather than "not HS
-- and not Virtual". A fifth campus added next year then offers In-Person only
-- when somebody says so, instead of inheriting it from a rule written before
-- that campus existed.
--
-- VIRTUAL IS LEFT WITH ONE CHOICE and the question is required, so a family
-- there ticks a single box. Jimmy asked for that knowing it: the answer is
-- still recorded, and the form no longer offers a virtual school in person.
--
-- ANSWERS ALREADY GIVEN ARE NOT REWRITTEN. A lead who said Hybrid at Georgia
-- said Hybrid at Georgia. Step 3 counts them so the number is known now
-- rather than discovered by someone reading a report in March.
--
-- Safe to re-run. If the live definition already says all of this, nothing is
-- published and it says so.

begin;

do $$
declare
  v_form_id      uuid;
  v_org_id       uuid;
  v_published_id uuid;
  v_def          jsonb;
  v_before       text;
  v_after        text;
  v_hash         text;
  v_next_number  integer;
  v_id_fl        text;
  v_id_ga        text;
  v_id_hs        text;
  v_stranded     integer;
  v_options      jsonb;
begin

  select f.id, f.organization_id, f.published_version_id, v.definition
    into v_form_id, v_org_id, v_published_id, v_def
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
   limit 1;

  if v_form_id is null or v_def is null then
    raise exception 'No published interest form found. Fix that before this.';
  end if;

  -- ---------------------------------------------------------------------
  -- 1. The campuses, by name within this organization - the same lookup
  --    migration 341 used. REFUSED rather than defaulted: a rule pointing
  --    at a campus we could not find would hide an option from everyone
  --    and look like a deliberate choice.
  -- ---------------------------------------------------------------------
  select s.id::text into v_id_fl from public.schools s
   where s.organization_id = v_org_id and s.name = 'The Academy FL' limit 1;
  select s.id::text into v_id_ga from public.schools s
   where s.organization_id = v_org_id and s.name = 'The Academy GA' limit 1;
  select s.id::text into v_id_hs from public.schools s
   where s.organization_id = v_org_id and s.name = 'The Academy HS' limit 1;

  if v_id_fl is null or v_id_ga is null or v_id_hs is null then
    raise exception
      'Could not find one of the campuses by name (FL=%, GA=%, HS=%). '
      'Nothing published.', v_id_fl, v_id_ga, v_id_hs;
  end if;

  v_before := v_def::text;

  -- ---------------------------------------------------------------------
  -- 2. The three options, each with the campuses that offer it.
  -- ---------------------------------------------------------------------
  v_options := jsonb_build_array(
    jsonb_build_object(
      'value', 'In-Person',
      'label', 'In-Person',
      'visibleWhen', jsonb_build_object('any', jsonb_build_array(
        jsonb_build_object('path','school_id','op','eq','value', v_id_fl),
        jsonb_build_object('path','school_id','op','eq','value', v_id_ga)
      ))
    ),
    jsonb_build_object(
      'value', 'Only Virtual',
      'label', 'Only Virtual'
    ),
    jsonb_build_object(
      'value', 'Hybrid (in-person + virtual)',
      'label', 'Hybrid (in-person + virtual)',
      'visibleWhen', jsonb_build_object('all', jsonb_build_array(
        jsonb_build_object('path','school_id','op','eq','value', v_id_hs)
      ))
    )
  );

  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case when q ->> 'key' = 'program'
                         then jsonb_set(q, '{options}', v_options)
                         else q end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  -- ---------------------------------------------------------------------
  -- 3. Who already answered something their campus will no longer offer.
  --    Counted, never rewritten.
  -- ---------------------------------------------------------------------
  select count(*) into v_stranded
    from public.admissions_leads l
    join public.schools s on s.id = l.school_id
   where s.organization_id = v_org_id
     and (
       (s.name in ('The Academy FL','The Academy GA')
         and l.program ilike '%Hybrid%')
       or (s.name = 'The Academy HS' and l.program ilike '%In-Person%')
       or (s.name = 'The Academy Virtual'
         and (l.program ilike '%In-Person%' or l.program ilike '%Hybrid%'))
     );

  if v_stranded > 0 then
    raise notice
      '455: % existing lead(s) answered a mode their campus will no longer '
      'offer. Their answers are unchanged - this is a count, not a cleanup.',
      v_stranded;
  end if;

  v_after := v_def::text;

  if v_after = v_before then
    raise notice '455: the live form already says all of this. No version published.';
    return;
  end if;

  -- ---------------------------------------------------------------------
  -- 4. Publish.
  -- ---------------------------------------------------------------------
  v_hash := encode(sha256(convert_to(v_after, 'UTF8')), 'hex');

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
    coalesce(v_def ->> 'schemaVersion', 'interest_form.v1'), v_def, v_hash, now()
  )
  returning id into v_published_id;

  update public.admissions_interest_forms
     set published_version_id = v_published_id, draft_version_id = null, updated_at = now()
   where id = v_form_id;

  raise notice
    '455: published v% - FL/GA lose Hybrid, HS loses In-Person, Virtual keeps '
    'only Only Virtual.', v_next_number;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect three rows. In-Person carries two campus ids, Hybrid one, and
-- Only Virtual carries no rule at all - which is what makes it the one every
-- campus offers.

select o ->> 'value'                                  as option_value,
       coalesce(o -> 'visibleWhen', 'null'::jsonb)    as rule
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'questions') q
  cross join lateral jsonb_array_elements(q -> 'options') o
 where q ->> 'key' = 'program'
 order by 1;

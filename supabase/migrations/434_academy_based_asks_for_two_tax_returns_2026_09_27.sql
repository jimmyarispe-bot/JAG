-- Academy-Based applicants provide two years of federal tax returns.
--
-- Jimmy, 27 September 2026: "if parent chooses Academy Based Scholarship, the
-- parents are required to provide last 2 years of federally filed tax
-- returns", two separate uploads, and NOT alongside the essay - the essay goes
-- back to being a GA GOAL question only.
--
-- READ THIS BEFORE RUNNING. Two things change for real families:
--
--   1. Academy-Based gains two required uploads. Today it asks for nothing at
--      all: the income and eligibility documents are gated on GA GOAL, so an
--      Academy-Based family currently submits with no financial evidence.
--
--   2. The three-part essay stops appearing for Academy-Based. Its rule is
--      today {any: [ga_goal, academy_based]} and becomes {all: [ga_goal]}.
--      If that is not what was meant, do not run this - the essay is the only
--      thing Academy-Based families are asked today, and removing it leaves
--      them with the two uploads and nothing else.
--
-- TWO UPLOADS, NOT ONE, on purpose. One box marked "tax returns" gets one file
-- and a family who believes they are finished, and then somebody has to chase
-- the second year. Two boxes cannot be half-answered.
--
-- WHERE THEY GO. The migration finds the essay by its rule rather than by a
-- key typed in here, then puts the new questions in whatever section holds it
-- - beside the question they replace, in the GA block every Georgia family
-- sees, each carrying its own Academy-Based condition. Nothing is positioned
-- by a number that could drift.
--
-- No existing key changes, so every answer already recorded still means what
-- it meant. The previous version is archived, not deleted.
--
-- Safe to re-run: it exits without writing if the questions already exist.

do $$
declare
  v_form_id        uuid;
  v_org_id         uuid;
  v_published_id   uuid;
  v_def            jsonb;
  v_essay_key      text;
  v_section_key    text;
  v_n              int;
  v_max_order      int;
  v_questions      jsonb;
  v_sections       jsonb;
  v_new_questions  jsonb;
  v_next_number    int;
  v_hash           text;
  v_new_id         uuid;
begin
  select count(*) into v_n from public.admissions_interest_forms;
  if v_n <> 1 then
    raise exception 'Expected exactly one interest form, found %.', v_n;
  end if;

  select id, organization_id, published_version_id
    into v_form_id, v_org_id, v_published_id
    from public.admissions_interest_forms;

  if v_published_id is null then
    raise exception 'That form has no published version to build on.';
  end if;

  select definition into v_def
    from public.admissions_interest_form_versions
   where id = v_published_id;

  -- Already done?
  if exists (
    select 1 from jsonb_array_elements(v_def->'questions') q
     where q->>'key' = 'academy_based_tax_return_recent'
  ) then
    raise notice 'Already present. Nothing changed.';
    return;
  end if;

  -- THE ESSAY, FOUND BY WHAT IT DOES rather than by a key typed here.
  select count(*) into v_n
    from jsonb_array_elements(v_def->'questions') q
   where (q->'visibleWhen')::text ilike '%academy_based%';

  if v_n <> 1 then
    raise exception
      'Expected exactly one question conditioned on academy_based, found %. Look at the live form before changing it.', v_n;
  end if;

  select q->>'key' into v_essay_key
    from jsonb_array_elements(v_def->'questions') q
   where (q->'visibleWhen')::text ilike '%academy_based%';

  select s->>'key' into v_section_key
    from jsonb_array_elements(v_def->'sections') s
   where s->'questionKeys' ? v_essay_key;

  if v_section_key is null then
    raise exception 'The essay (%) belongs to no section, so there is nowhere to put the uploads.', v_essay_key;
  end if;

  select max((q->>'order')::int) into v_max_order
    from jsonb_array_elements(v_def->'questions') q;

  v_new_questions := jsonb_build_array(
    jsonb_build_object(
      'key',      'academy_based_tax_return_recent',
      'type',     'file',
      'label',    'Upload your federal tax return — most recent year',
      'required', true,
      'order',    v_max_order + 1,
      'helpText', 'The Academy-Based Scholarship is awarded on need, so we ask for the last two years of federally filed returns.',
      'visibleWhen', jsonb_build_object(
        'all', jsonb_build_array(
          jsonb_build_object('op', 'contains', 'path', 'ga_scholarships', 'value', 'academy_based')
        )
      )
    ),
    jsonb_build_object(
      'key',      'academy_based_tax_return_prior',
      'type',     'file',
      'label',    'Upload your federal tax return — the year before',
      'required', true,
      'order',    v_max_order + 2,
      'visibleWhen', jsonb_build_object(
        'all', jsonb_build_array(
          jsonb_build_object('op', 'contains', 'path', 'ga_scholarships', 'value', 'academy_based')
        )
      )
    )
  );

  -- Questions: the essay narrows to GA GOAL, order preserved, then the two new ones.
  select jsonb_agg(
           case
             when q->>'key' = v_essay_key then
               jsonb_set(q, '{visibleWhen}', jsonb_build_object(
                 'all', jsonb_build_array(
                   jsonb_build_object('op', 'contains', 'path', 'ga_scholarships', 'value', 'ga_goal')
                 )
               ))
             else q
           end
           order by ord
         )
    into v_questions
    from jsonb_array_elements(v_def->'questions') with ordinality as t(q, ord);

  -- Sections: the two keys join the section the essay already sits in.
  select jsonb_agg(
           case
             when s->>'key' = v_section_key then
               jsonb_set(s, '{questionKeys}',
                 (s->'questionKeys') || jsonb_build_array(
                   'academy_based_tax_return_recent',
                   'academy_based_tax_return_prior'
                 ))
             else s
           end
           order by ord
         )
    into v_sections
    from jsonb_array_elements(v_def->'sections') with ordinality as t(s, ord);

  v_def := jsonb_set(v_def, '{questions}', v_questions || v_new_questions);
  v_def := jsonb_set(v_def, '{sections}', v_sections);

  v_hash := encode(sha256(convert_to(v_def::text, 'UTF8')), 'hex');

  select coalesce(max(version_number), 0) + 1 into v_next_number
    from public.admissions_interest_form_versions
   where form_id = v_form_id;

  /* The swap, in this one transaction - archive first, because the unique
     index permits exactly one published version per form. Same reasoning as
     migration 432; a gap here is a public form with no version at all. */
  update public.admissions_interest_form_versions
     set lifecycle = 'archived'
   where id = v_published_id;

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
     set published_version_id = v_new_id,
         draft_version_id     = null,
         updated_at           = now()
   where id = v_form_id;

  raise notice 'Published v%. Essay narrowed to GA GOAL; two Academy-Based uploads added.', v_next_number;
end $$;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect three rows:
--   the essay, its rule now naming ga_goal and NOT academy_based
--   the two uploads, type file, required true, rule naming academy_based
--
-- If the essay row still mentions academy_based, the update did not take and
-- the two scholarships are both being asked the same things again.

select q->>'label' as question,
       q->>'type' as type,
       (q->>'required')::boolean as required,
       (q->'visibleWhen')::text as shown_when
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id,
       jsonb_array_elements(v.definition->'questions') q
 where (q->'visibleWhen')::text ilike '%academy_based%'
    or q->>'key' in ('academy_based_tax_return_recent', 'academy_based_tax_return_prior')
    or (q->>'type' = 'rich_text' and (q->'visibleWhen')::text ilike '%ga_goal%')
 order by (q->>'order')::int;

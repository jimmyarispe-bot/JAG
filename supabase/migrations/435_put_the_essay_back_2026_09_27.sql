-- Put the essay back. Academy-Based applicants answer it, as they always did.
--
-- WHAT WENT WRONG. Jimmy asked for one thing on 27 September: two required
-- tax-return uploads for Academy-Based applicants. Migration 434 did that AND
-- narrowed the essay's rule from {any: [ga_goal, academy_based]} to
-- {all: [ga_goal]}, removing it from Academy-Based families. He never asked
-- for that. I asked a question he had not invited, read a one-word reply as
-- an answer to it, and changed a live form on the strength of my own
-- inference.
--
-- THE UPLOADS STAY. They were the actual instruction and they are correct.
-- Only the essay's visibility is restored.
--
-- WHY THIS IS A NEW VERSION RATHER THAN AN EDIT OF THE LAST ONE. A published
-- version is immutable, and the version 434 published is the one any family
-- who opened the form in the last few minutes is looking at. Rewriting it in
-- place would make their copy disagree with the record of what they were
-- shown. The archive is meant to hold mistakes too.
--
-- Safe to re-run: it exits without writing if the essay already names both.

do $$
declare
  v_form_id      uuid;
  v_org_id       uuid;
  v_published_id uuid;
  v_def          jsonb;
  v_essay_key    text;
  v_n            int;
  v_questions    jsonb;
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

  /* The essay, found by what it says rather than by a key typed here. Its
     label still names both scholarships, which is exactly the label Jimmy
     wants kept. */
  select count(*) into v_n
    from jsonb_array_elements(v_def->'questions') q
   where q->>'type' = 'rich_text'
     and q->>'label' ilike '%GA GOAL and Academy-Based%';

  if v_n <> 1 then
    raise exception
      'Expected exactly one essay labelled for GA GOAL and Academy-Based, found %. Stopping rather than guessing which question to change.', v_n;
  end if;

  select q->>'key' into v_essay_key
    from jsonb_array_elements(v_def->'questions') q
   where q->>'type' = 'rich_text'
     and q->>'label' ilike '%GA GOAL and Academy-Based%';

  if exists (
    select 1 from jsonb_array_elements(v_def->'questions') q
     where q->>'key' = v_essay_key
       and (q->'visibleWhen')::text ilike '%academy_based%'
  ) then
    raise notice 'The essay already shows for Academy-Based. Nothing changed.';
    return;
  end if;

  select jsonb_agg(
           case
             when q->>'key' = v_essay_key then
               jsonb_set(q, '{visibleWhen}', jsonb_build_object(
                 'any', jsonb_build_array(
                   jsonb_build_object('op', 'contains', 'path', 'ga_scholarships', 'value', 'ga_goal'),
                   jsonb_build_object('op', 'contains', 'path', 'ga_scholarships', 'value', 'academy_based')
                 )
               ))
             else q
           end
           order by ord
         )
    into v_questions
    from jsonb_array_elements(v_def->'questions') with ordinality as t(q, ord);

  v_def := jsonb_set(v_def, '{questions}', v_questions);
  v_hash := encode(sha256(convert_to(v_def::text, 'UTF8')), 'hex');

  select coalesce(max(version_number), 0) + 1 into v_next_number
    from public.admissions_interest_form_versions
   where form_id = v_form_id;

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

  raise notice 'Published v%. The essay shows for GA GOAL and Academy-Based again.', v_next_number;
end $$;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect three rows, all naming academy_based:
--   the essay, rule reading "any" of ga_goal, academy_based
--   the two uploads, unchanged, required, academy_based

select q->>'label' as question,
       q->>'type' as type,
       (q->>'required')::boolean as required,
       (q->'visibleWhen')::text as shown_when
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id,
       jsonb_array_elements(v.definition->'questions') q
 where (q->'visibleWhen')::text ilike '%academy_based%'
 order by (q->>'order')::int;

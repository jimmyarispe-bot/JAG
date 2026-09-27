-- Residency, not campus, decides which state's questions a family answers.
--
-- Jimmy, 27 September 2026:
--
--   "while they may be choosing virtual or hs, we still need them to submit
--    all of the requested information and documents that the in-person
--    families are asked for"
--   "they have to be residents of those states. not just live there"
--   "if they are ga and attending virtual or hs, then they cannot apply for
--    the GA Goal or School-Based scholarships. those options should not be
--    available to them. They can use their ga special needs scholarships."
--
-- FIVE CHANGES, and every one of them is visible to a family:
--
--   1. A new required question: in which state is the student a legal
--      resident. Worded as legal residence, because "where do you live" is a
--      different question and the states care about the first one.
--
--   2. Every Georgia and Florida section now shows when the family chose that
--      campus OR is resident in that state. The rewrite is surgical - each
--      "school_id is X" condition becomes "school_id is X OR resident of that
--      state" in place, so a section that also required something else (the
--      GA GOAL eligibility block requires the GA GOAL tick) keeps it.
--
--   3. GA GOAL and Academy-Based become choices a family sees only at the
--      Georgia campus. This uses option-level visibility, shipped today: the
--      renderer omits them and the validator refuses them, so a Georgia
--      resident taking Virtual classes is never offered something they cannot
--      have. GA Special Needs is untouched and available to any GA resident.
--
--   4. The generic "I/we have a scholarship from our state" question that HS
--      and Virtual each carry is hidden from GA and FL residents, along with
--      its upload. They answer their own state's real questions instead -
--      Step Up Award ID and letter, or the Georgia scholarships list - and
--      nobody is asked about scholarships twice into two different fields.
--
--   5. The GA GOAL pledge follows the same widening: every Georgia resident
--      signs it, not only families at the Georgia campus. Jimmy's call, and
--      consistent with 352 - it is a fundraising pledge about Georgia tax
--      credits, not a scholarship application.
--
-- WHAT IS NOT CHANGED. Florida's scholarship questions are untouched beyond
-- the widening: Step Up is portable and nothing was said about restricting it.
-- HS and Virtual keep all their own questions for everybody.
--
-- No question key changes and no answer value changes, so every submission
-- already recorded still means exactly what it meant.
--
-- Safe to re-run: it exits without writing if the residency question exists.

do $$
declare
  v_form_id      uuid;
  v_org_id       uuid;
  v_published_id uuid;
  v_def          jsonb;
  v_ga           text;
  v_fl           text;
  v_student_sec  text;
  v_max_order    int;
  v_sections     jsonb;
  v_questions    jsonb;
  v_next_number  int;
  v_hash         text;
  v_new_id       uuid;
  v_n            int;
begin
  select id, organization_id, published_version_id
    into v_form_id, v_org_id, v_published_id
    from public.admissions_interest_forms;

  select definition into v_def
    from public.admissions_interest_form_versions
   where id = v_published_id;

  if exists (
    select 1 from jsonb_array_elements(v_def->'questions') q
     where q->>'key' = 'student_residency_state'
  ) then
    raise notice 'Residency question already present. Nothing changed.';
    return;
  end if;

  select id::text into v_ga from public.schools where lower(trim(name)) = 'the academy ga';
  select id::text into v_fl from public.schools where lower(trim(name)) = 'the academy fl';
  if v_ga is null or v_fl is null then
    raise exception 'Could not resolve both campuses: GA=%, FL=%', v_ga, v_fl;
  end if;

  -- The section that holds the child's own details, found by a key that has
  -- been in this form since version 1 rather than by a title somebody may edit.
  select s->>'key' into v_student_sec
    from jsonb_array_elements(v_def->'sections') s
   where s->'questionKeys' ? 'first_name';

  if v_student_sec is null then
    raise exception 'No section holds first_name; cannot place the residency question.';
  end if;

  select max((q->>'order')::int) into v_max_order
    from jsonb_array_elements(v_def->'questions') q;

  /* Widen one condition group: "school_id is X" becomes "that, OR resident of
     this state". Everything else in the group is left exactly as it is. */
  create or replace function pg_temp.widen(p_rule jsonb, p_school text, p_state text)
  returns jsonb language sql as $fn$
    select case
      when p_rule is null or p_rule->'all' is null then p_rule
      else jsonb_set(p_rule, '{all}', (
        select jsonb_agg(
          case
            when e->>'op' = 'eq' and e->>'path' = 'school_id' and e->>'value' = p_school
            then jsonb_build_object('any', jsonb_build_array(
                   e,
                   jsonb_build_object('op','eq','path','student_residency_state','value',p_state)
                 ))
            else e
          end
          order by ord
        )
        from jsonb_array_elements(p_rule->'all') with ordinality as t(e, ord)
      ))
    end;
  $fn$;

  -- ── sections: GA and FL widen to residency ────────────────────────────────
  select jsonb_agg(
           case
             when (s->'visibleWhen')::text like '%' || v_ga || '%'
               then jsonb_set(s, '{visibleWhen}', pg_temp.widen(s->'visibleWhen', v_ga, 'georgia'))
             when (s->'visibleWhen')::text like '%' || v_fl || '%'
               then jsonb_set(s, '{visibleWhen}', pg_temp.widen(s->'visibleWhen', v_fl, 'florida'))
             else s
           end
           order by ord
         )
    into v_sections
    from jsonb_array_elements(v_def->'sections') with ordinality as t(s, ord);

  -- the residency question joins the student section
  select jsonb_agg(
           case
             when s->>'key' = v_student_sec
               then jsonb_set(s, '{questionKeys}',
                      (s->'questionKeys') || jsonb_build_array('student_residency_state'))
             else s
           end
           order by ord
         )
    into v_sections
    from jsonb_array_elements(v_sections) with ordinality as t(s, ord);

  -- ── questions ─────────────────────────────────────────────────────────────
  select jsonb_agg(
           case
             -- GA GOAL and Academy-Based: a choice only the GA campus is offered
             when q->>'key' = 'ga_scholarships' then
               jsonb_set(q, '{options}', (
                 select jsonb_agg(
                          case
                            when o->>'value' in ('ga_goal', 'academy_based')
                            then o || jsonb_build_object('visibleWhen', jsonb_build_object(
                                   'all', jsonb_build_array(
                                     jsonb_build_object('op','eq','path','school_id','value',v_ga)
                                   )))
                            else o
                          end
                          order by o_ord
                        )
                   from jsonb_array_elements(q->'options') with ordinality as o_t(o, o_ord)
               ))

             -- the generic HS / Virtual scholarship ask, and its upload:
             -- not for a family who answers their own state's questions
             /* The two selects by key, and their uploads by the fact that
                they READ those selects - the upload keys are not typed here,
                because a key typed from memory is how a rule silently matches
                nothing and the change looks applied when it is not. */
             when q->>'key' in ('hs_has_scholarship', 'virtual_has_scholarship')
               or (q->'visibleWhen')::text like '%hs_has_scholarship%'
               or (q->'visibleWhen')::text like '%virtual_has_scholarship%' then
               jsonb_set(q, '{visibleWhen}', jsonb_build_object(
                 'all',
                 coalesce(q->'visibleWhen'->'all', '[]'::jsonb) || jsonb_build_array(
                   jsonb_build_object('op','neq','path','student_residency_state','value','georgia'),
                   jsonb_build_object('op','neq','path','student_residency_state','value','florida')
                 )
               ))

             -- a question gated directly on a campus widens the same way
             when (q->'visibleWhen')::text like '%' || v_ga || '%'
               then jsonb_set(q, '{visibleWhen}', pg_temp.widen(q->'visibleWhen', v_ga, 'georgia'))
             when (q->'visibleWhen')::text like '%' || v_fl || '%'
               then jsonb_set(q, '{visibleWhen}', pg_temp.widen(q->'visibleWhen', v_fl, 'florida'))

             else q
           end
           order by ord
         )
    into v_questions
    from jsonb_array_elements(v_def->'questions') with ordinality as t(q, ord);

  v_questions := v_questions || jsonb_build_array(
    jsonb_build_object(
      'key',      'student_residency_state',
      'type',     'select',
      'label',    'In which state is the student a legal resident?',
      'required', true,
      'order',    v_max_order + 1,
      'helpText', 'Legal residence, not simply where the student is currently living. State scholarships and state reporting both depend on it.',
      'options',  jsonb_build_array(
        jsonb_build_object('value', 'georgia', 'label', 'Georgia'),
        jsonb_build_object('value', 'florida', 'label', 'Florida'),
        jsonb_build_object('value', 'other',   'label', 'Another state')
      )
    )
  );

  v_def := jsonb_set(v_def, '{sections}', v_sections);
  v_def := jsonb_set(v_def, '{questions}', v_questions);

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
-- 'residency question'   : one row. Required, three choices.
-- 'widened to residency' : every GA/FL section and question, each rule now
--                          naming student_residency_state beside the campus.
-- 'GA campus only'       : ga_goal and academy_based, each carrying a rule.
-- 'hidden from GA/FL'    : the four generic HS and Virtual scholarship rows.
--
-- A GA or FL section with NO mention of student_residency_state did not widen
-- - look at it before telling anybody this is live.

with live as (
  select v.definition
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
)
select 'residency question'::text as finding,
       q->>'label' as detail,
       (q->>'required')::text as required,
       jsonb_array_length(q->'options')::text as choices
  from live, jsonb_array_elements(definition->'questions') q
 where q->>'key' = 'student_residency_state'

union all

select 'GA campus only',
       o->>'label',
       'n/a',
       (o->'visibleWhen')::text
  from live, jsonb_array_elements(definition->'questions') q,
       jsonb_array_elements(q->'options') o
 where q->>'key' = 'ga_scholarships'
   and o->>'value' in ('ga_goal', 'academy_based')

union all

select 'hidden from GA/FL',
       left(q->>'label', 60),
       'n/a',
       (q->'visibleWhen')::text
  from live, jsonb_array_elements(definition->'questions') q
 where q->>'key' in ('hs_has_scholarship', 'virtual_has_scholarship')
    or (q->'visibleWhen')::text like '%hs_has_scholarship%'
    or (q->'visibleWhen')::text like '%virtual_has_scholarship%'

union all

select 'widened to residency',
       coalesce(nullif(s->>'title', ''), s->>'key'),
       'n/a',
       (s->'visibleWhen')::text
  from live, jsonb_array_elements(definition->'sections') s
 where (s->'visibleWhen')::text ilike '%student_residency_state%'

order by 1, 2;

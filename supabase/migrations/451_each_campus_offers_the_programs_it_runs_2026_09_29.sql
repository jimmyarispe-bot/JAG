-- 451_each_campus_offers_the_programs_it_runs_2026_09_29.sql
--
-- Jimmy, 28 September 2026: "take out full school and tutoring options in ga
-- and fl forms. this is only for the academy virtual" - and then six of the
-- high school's own. Plus: the student email help text should say the parent
-- is copied, which commit 27a5dff3 made true in code.
--
-- WHAT IS ACTUALLY WRONG, read from the live form rather than assumed. There
-- are THREE program questions, not one, and they are already gated correctly:
--
--   program          shown when school is NEITHER HS NOR Virtual  (so FL, GA)
--                    options: none declared -> falls back to the network five
--   program_hs       shown when school is The Academy HS
--                    options: Only Virtual, Hybrid (in-person + virtual)
--   program_virtual  shown when school is The Academy Virtual
--                    options: Only Virtual
--
-- So Georgia and Florida see Full-School Program and Tutoring for one reason
-- only: `program` declares no options, and an empty list means "the network
-- default". Naming its three is the whole fix for Jimmy's first sentence. The
-- gating needs no change at all - it was right already.
--
-- WHAT EACH CAMPUS OFFERS AFTER THIS
--   FL, GA    In-Person, Only Virtual, Hybrid (in-person + virtual)
--   HS        Full High School Experience, Tutoring - HS Life Lab,
--             Tutoring - HS Earth Quest, Tutoring - HS Real-World Math,
--             Tutoring - HS Entrepreneurship, Structured Literacy
--   Virtual   Full-School Program, Tutoring
--
-- "ONLY VIRTUAL" LEAVES THE VIRTUAL QUESTION, and Jimmy chose that knowing
-- the cost: a lead whose answer is "Only Virtual" at Virtual now names an
-- option the form no longer offers. Nothing is rewritten - what a family
-- answered is what they answered - and step 5 counts them so the number is
-- known rather than discovered later.
--
-- A NEW VERSION, NOT AN EDIT. Submissions carry form_version_id. Mutating the
-- published definition would leave every earlier submission pointing at a
-- form that differs from the one that family actually filled in. Same shape
-- as migration 441: archive the current version, publish the next.
--
-- THE CODE SIDE SHIPPED FIRST (27a5dff3). Until that commit `program_selector`
-- ignored option-level visibility in three places, and the submit validator
-- read the raw option list. It now narrows to what the question declares - so
-- from this migration on, a posted form naming Tutoring against Georgia is
-- refused, not just hidden.
--
-- Safe to re-run. If the live definition already matches, nothing is
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
  v_help_add     text := 'You will be copied into the email we send your student.';
  v_fl_ga        jsonb := '[
      {"value":"In-Person","label":"In-Person"},
      {"value":"Only Virtual","label":"Only Virtual"},
      {"value":"Hybrid (in-person + virtual)","label":"Hybrid (in-person + virtual)"}
    ]'::jsonb;
  v_hs           jsonb := '[
      {"value":"Full High School Experience","label":"Full High School Experience"},
      {"value":"Tutoring - HS Life Lab","label":"Tutoring - HS Life Lab"},
      {"value":"Tutoring - HS Earth Quest","label":"Tutoring - HS Earth Quest"},
      {"value":"Tutoring - HS Real-World Math","label":"Tutoring - HS Real-World Math"},
      {"value":"Tutoring - HS Entrepreneurship","label":"Tutoring - HS Entrepreneurship"},
      {"value":"Structured Literacy","label":"Structured Literacy"}
    ]'::jsonb;
  v_virtual      jsonb := '[
      {"value":"Full-School Program","label":"Full-School Program"},
      {"value":"Tutoring","label":"Tutoring"}
    ]'::jsonb;
begin

  -- ---------------------------------------------------------------------
  -- 1. The live form. The published version is the one the form POINTS at,
  --    not merely one whose lifecycle says published.
  -- ---------------------------------------------------------------------
  select f.id, f.organization_id, f.published_version_id, v.definition
    into v_form_id, v_org_id, v_published_id, v_def
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
   limit 1;

  if v_form_id is null or v_def is null then
    raise exception
      'No published interest form found. The public form is serving nothing, '
      'which is a bigger problem than this migration - fix that first.';
  end if;

  v_before := v_def::text;

  -- ---------------------------------------------------------------------
  -- 2. The three program questions get the list their campus runs.
  --    jsonb_set with the object rebuilt, so a question that has no
  --    `options` key at all (which is `program` today) gains one.
  -- ---------------------------------------------------------------------
  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case q ->> 'key'
                      when 'program'         then jsonb_set(q, '{options}', v_fl_ga)
                      when 'program_hs'      then jsonb_set(q, '{options}', v_hs)
                      when 'program_virtual' then jsonb_set(q, '{options}', v_virtual)
                      else q
                    end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  -- ---------------------------------------------------------------------
  -- 3. The student email help text, appended rather than replaced.
  --    Guarded on the sentence not already being there, so re-running does
  --    not say it twice.
  -- ---------------------------------------------------------------------
  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case
                      when q ->> 'key' = 'hs_student_email'
                       and position(v_help_add in coalesce(q ->> 'helpText','')) = 0
                      then jsonb_set(q, '{helpText}',
                             to_jsonb(trim(both ' ' from coalesce(q ->> 'helpText','')) ||
                                      case when coalesce(q ->> 'helpText','') = '' then '' else ' ' end ||
                                      v_help_add))
                      else q
                    end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  v_after := v_def::text;

  if v_after = v_before then
    raise notice '451: the live form already says all of this. No version published.';
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

  raise notice '451: published v% - FL/GA 3 options, HS 6, Virtual 2, help text appended.',
    v_next_number;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect exactly eleven option rows: program 3, program_hs 6, program_virtual 2.
-- The help text must end with the new sentence, once.

select q ->> 'key' as question_key,
       o ->> 'value' as option_value
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'questions') q
  cross join lateral jsonb_array_elements(coalesce(q -> 'options','[]'::jsonb)) o
 where q ->> 'type' = 'program_selector'
 order by q ->> 'key', o ->> 'value';

select q ->> 'key' as question_key, q ->> 'helpText' as help_text_now
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'questions') q
 where q ->> 'key' = 'hs_student_email';

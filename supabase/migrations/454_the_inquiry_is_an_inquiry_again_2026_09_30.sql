-- 454_the_inquiry_is_an_inquiry_again_2026_09_30.sql
--
-- Jimmy, 29 September 2026, looking at the public form with Georgia selected:
-- "why does it display the scholarship options and the rest of the application
-- itself at this inquiry phase. this should only allow/show/gather the initial
-- inquiry information." Then the rule, flat: "there should not be any
-- scholarship information included anywhere on any school's inquiry form."
-- Then the scope, twice: "these are the only fields that should ever show for
-- the inquiry/interest form for all schools at all times."
--
-- HOW IT GOT LIKE THIS. Nothing broke. On 11-12 September the GA paper
-- application was ported onto the interest form - v12 added the uploads and
-- the second signature, v13 published 11 sections. A note written the day
-- BEFORE said the opposite should happen: "Document uploads... belong in the
-- portal's DocumentCenter - an inquiry should not block on a parent finding a
-- PDF." Recorded, then not followed.
--
-- ONE DEFINITION, TWO DOORS. /apply renders the inquiry phase. The invitation
-- link /apply/start/<token> renders everything. Jimmy, 29 September: "no one
-- ever submits an application without us providing the url. we don't publish
-- this publicly anywhere." Two definitions would drift apart; this cannot.
--
-- NOTHING IS DELETED. All 65 questions stay in the definition, every
-- condition intact, and v31 is archived whole. Every submission already made
-- points at the version that asked it. The only change is WHEN a family is
-- asked.
--
-- THE INQUIRY AFTER THIS - 20 fields, identical at every campus:
--   student          all 10
--   program_school   school_id, program, referral_source
--   child_narrative  student_greatness, student_challenges
--   guardian         all 5
-- Plus ONE deliberate exception, Jimmy 30 September: hs_student_email, which
-- carries the "You will be copied into the email we send your student."
-- sentence he approved on the 29th. HS families see 21 fields. He was shown
-- that it breaks "the same for all schools" and chose it anyway.
--
-- TWO THINGS THAT WOULD HAVE SHIPPED BROKEN WITHOUT STEPS 5 AND 6:
--
--   `program` is gated to hide itself at HS and Virtual, because program_hs
--   and program_virtual covered those campuses. Move those two to the
--   application and an HS or Virtual family is asked NO program question at
--   all. Step 5 removes the gate: In-Person / Only Virtual / Hybrid, every
--   campus, which is what the screenshot shows and what Jimmy approved.
--
--   hs_student_email lives in hs_detail, an application section. Left there
--   it would render an "The Academy HS" heading with one field under it on
--   the inquiry. Jimmy chose (b): move it into Student Information. Its
--   visibleWhen is untouched, so only HS families see it.
--
-- THE TWO SENTENCES. Jimmy: "i have no idea where those came from. I did not
-- provide this language nor did i request it. delete both." Written by Claude
-- in 408 (22 Sept) and 436 (27 Sept). Step 7 removes the sentences and keeps
-- the rest of each help text.
--
-- THE CODE SHIPPED FIRST. Until it did, `phase` was a field nothing read. The
-- renderer and the validator now ask ONE predicate, isQuestionInPhase, so a
-- question hidden on screen is also refused on submit. A definition where
-- NOTHING declares a phase - every version through v31 - is treated as
-- all-inquiry, which is how it behaves today. That is why this migration can
-- run after the deploy without a gap in either direction.
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

  -- The four sections a family sees at the front door.
  v_inquiry_sections text[] := array[
    'student', 'program_school', 'child_narrative', 'guardian'
  ];

  -- Inside those four, the five that belong to the application.
  v_app_questions text[] := array[
    'program_hs', 'program_virtual', 'virtual_program_interest',
    'peer_interaction', 'anything_else'
  ];

  v_ethnicity_old text := 'Florida and Georgia ask us for this, and so do scholarship funders. You may leave it blank.';
  v_ethnicity_new text := 'Florida and Georgia ask us for this. You may leave it blank.';
  v_residency_old text := 'Legal residence, not simply where the student is currently living. State scholarships and state reporting both depend on it.';
  v_residency_new text := 'Legal residence, not simply where the student is currently living.';
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
  -- 2. Every section gets a phase. Named explicitly rather than "the four
  --    I know and everything else defaults": a section absent from the
  --    definition's own record of its phase is a section somebody has to
  --    guess about later.
  -- ---------------------------------------------------------------------
  select jsonb_set(v_def, '{sections}', (
           select jsonb_agg(
                    jsonb_set(s, '{phase}',
                      to_jsonb(case when s ->> 'key' = any(v_inquiry_sections)
                                    then 'inquiry' else 'application' end))
                    order by ord)
             from jsonb_array_elements(v_def -> 'sections') with ordinality as t(s, ord)))
    into v_def;

  -- ---------------------------------------------------------------------
  -- 3. The five questions inside inquiry sections that are not inquiry.
  --    virtual_program_interest is the duplicate: a Virtual family was
  --    asked their programme twice, by two required questions with
  --    different answer lists.
  -- ---------------------------------------------------------------------
  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case when q ->> 'key' = any(v_app_questions)
                         then jsonb_set(q, '{phase}', '"application"'::jsonb)
                         else q end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  -- ---------------------------------------------------------------------
  -- 4. hs_student_email is an inquiry question living in an application
  --    section, so it says so itself.
  -- ---------------------------------------------------------------------
  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case when q ->> 'key' = 'hs_student_email'
                         then jsonb_set(q, '{phase}', '"inquiry"'::jsonb)
                         else q end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  --    ...and moves into Student Information, so the inquiry reads as one
  --    block at every campus instead of growing an "The Academy HS" heading
  --    with a single field under it.
  select jsonb_set(v_def, '{sections}', (
           select jsonb_agg(
                    case
                      when s ->> 'key' = 'student'
                        and not (s -> 'questionKeys' ? 'hs_student_email')
                      then jsonb_set(s, '{questionKeys}',
                             (s -> 'questionKeys') || '["hs_student_email"]'::jsonb)
                      when s ->> 'key' = 'hs_detail'
                      then jsonb_set(s, '{questionKeys}', (
                             select coalesce(jsonb_agg(k order by kord), '[]'::jsonb)
                               from jsonb_array_elements(s -> 'questionKeys')
                                    with ordinality as u(k, kord)
                              where k <> '"hs_student_email"'::jsonb))
                      else s
                    end
                    order by ord)
             from jsonb_array_elements(v_def -> 'sections') with ordinality as t(s, ord)))
    into v_def;

  -- ---------------------------------------------------------------------
  -- 5. `program` is asked at every campus now. Its visibleWhen existed to
  --    step aside for program_hs and program_virtual; both are application
  --    questions from this version, so the gate would leave HS and Virtual
  --    families with no programme question at all.
  -- ---------------------------------------------------------------------
  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case when q ->> 'key' = 'program' then q - 'visibleWhen' else q end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  -- ---------------------------------------------------------------------
  -- 6. The two sentences Jimmy did not write and did not ask for.
  --    replace() rather than a flat overwrite, so a help text somebody has
  --    since edited keeps the edit and loses only the sentence.
  -- ---------------------------------------------------------------------
  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case q ->> 'key'
                      when 'hispanic_or_latino' then
                        jsonb_set(q, '{helpText}', to_jsonb(
                          replace(coalesce(q ->> 'helpText',''), v_ethnicity_old, v_ethnicity_new)))
                      when 'student_residency_state' then
                        jsonb_set(q, '{helpText}', to_jsonb(
                          replace(coalesce(q ->> 'helpText',''), v_residency_old, v_residency_new)))
                      else q
                    end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  v_after := v_def::text;

  if v_after = v_before then
    raise notice '454: the live form already says all of this. No version published.';
    return;
  end if;

  -- ---------------------------------------------------------------------
  -- 7. Publish.
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

  raise notice '454: published v% - the inquiry is 20 fields, 21 at HS.', v_next_number;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect exactly 21 rows: the 20 fields on Jimmy's screenshot plus
-- hs_student_email. If a 22nd appears, something was marked inquiry that he
-- has not seen.

select s.value ->> 'key'                      as section_key,
       q.value ->> 'key'                      as question_key,
       coalesce(q.value ->> 'phase', s.value ->> 'phase') as phase
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'sections') s
  cross join lateral jsonb_array_elements_text(s.value -> 'questionKeys') qk
  cross join lateral (
    select value from jsonb_array_elements(v.definition -> 'questions')
     where value ->> 'key' = qk limit 1
  ) q
 where coalesce(q.value ->> 'phase', s.value ->> 'phase') = 'inquiry'
 order by 1, 2;

-- ===========================================================================
-- INTEREST FORM v22 - ETHNICITY  -  408  -  2026-09-22
--
-- Jimmy, 22 September: add ethnicity to all applications.
--
-- ALL FOUR APPLICATIONS ARE THIS ONE FORM. The Zoho originals - FL, GA, HS,
-- Virtual - are separate documents, but JAG's own form has carried all four
-- since v4 on 11 September, as campus-conditional sections on a shared trunk.
-- These two questions go on the TRUNK, so every campus asks them and there is
-- one answer to report from, not four.
--
-- TWO QUESTIONS, NOT ONE. Florida and Georgia both report on the federal
-- standard, which asks ethnicity and race separately and lets a child be more
-- than one race:
--
--   1. Is the student Hispanic or Latino?   single choice
--   2. Select one or more races.            multiselect
--
-- A single "Ethnicity" dropdown cannot express a child who is both, and cannot
-- be mapped to a state return without going back and asking every family
-- again.
--
-- NEITHER IS REQUIRED. A required demographic question stops a family from
-- submitting over something that is theirs to decline, and produces worse data
-- besides - people pick anything to get past a wall. v5 exists because v4
-- ported Florida's asterisks onto a web form and a private-pay family could
-- not submit at all. Porting the asterisk is not the same as porting the form.
--
-- THE DEFINITION IS READ, NOT RETYPED. v21's migration carries all 1,196 lines
-- of the definition inline. Copying that to change two things invites a
-- silently dropped question, so this reads whatever is published and edits it
-- with jsonb. Whatever v21 says, v22 says too, plus these two.
--
-- A PLAIN-OPTIONS MULTISELECT RENDERS CORRECTLY. Checked, because it did not
-- always: until v3, InterestFormRenderer only drew a checkbox group when
-- optionSource was "funding_sources", and a multiselect defined with plain
-- options fell through to a one-line text box. Line 305 handles it now.
--
-- Safe to re-run: if the questions are already there, nothing happens.
-- ===========================================================================

do $$
declare
  form record;
  current_def jsonb;
  new_def jsonb;
  new_version_id uuid;
  next_number int;
  hash text;
  q_ethnicity jsonb;
  q_race jsonb;
  max_order int;
  sections jsonb;
  updated_sections jsonb := '[]'::jsonb;
  section jsonb;
begin
  q_ethnicity := $q$
  {
    "key": "hispanic_or_latino",
    "type": "select",
    "label": "Is the student Hispanic or Latino?",
    "required": false,
    "helpText": "Florida and Georgia ask us for this, and so do scholarship funders. You may leave it blank.",
    "options": [
      { "value": "yes", "label": "Yes" },
      { "value": "no", "label": "No" },
      { "value": "declined", "label": "Prefer not to answer" }
    ]
  }
  $q$::jsonb;

  q_race := $q$
  {
    "key": "race",
    "type": "multiselect",
    "label": "Select one or more races that apply to the student.",
    "required": false,
    "helpText": "Check all that apply. You may leave this blank.",
    "options": [
      { "value": "american_indian_or_alaska_native", "label": "American Indian or Alaska Native" },
      { "value": "asian", "label": "Asian" },
      { "value": "black_or_african_american", "label": "Black or African American" },
      { "value": "native_hawaiian_or_other_pacific_islander", "label": "Native Hawaiian or Other Pacific Islander" },
      { "value": "white", "label": "White" },
      { "value": "declined", "label": "Prefer not to answer" }
    ]
  }
  $q$::jsonb;

  for form in
    select f.id, f.organization_id, f.published_version_id
    from public.admissions_interest_forms f
    where f.published_version_id is not null
  loop
    select v.definition into current_def
    from public.admissions_interest_form_versions v
    where v.id = form.published_version_id;

    if current_def is null then
      raise notice 'Form % has no published definition - skipped.', form.id;
      continue;
    end if;

    -- Already there? Then there is nothing to publish.
    if exists (
      select 1
      from jsonb_array_elements(current_def -> 'questions') q
      where q ->> 'key' = 'hispanic_or_latino'
    ) then
      raise notice 'Form % already asks ethnicity - nothing changed.', form.id;
      continue;
    end if;

    -- Order goes after everything already on the form.
    select coalesce(max((q ->> 'order')::int), 0) + 1
      into max_order
    from jsonb_array_elements(current_def -> 'questions') q;

    q_ethnicity := q_ethnicity || jsonb_build_object('order', max_order);
    q_race := q_race || jsonb_build_object('order', max_order + 1);

    new_def := jsonb_set(
      current_def,
      '{questions}',
      (current_def -> 'questions') || q_ethnicity || q_race
    );

    -- Onto the student section, which every campus sees.
    sections := new_def -> 'sections';
    updated_sections := '[]'::jsonb;

    for section in select * from jsonb_array_elements(sections)
    loop
      if section ->> 'key' = 'student' then
        section := jsonb_set(
          section,
          '{questionKeys}',
          (section -> 'questionKeys')
            || '"hispanic_or_latino"'::jsonb
            || '"race"'::jsonb
        );
      end if;
      updated_sections := updated_sections || section;
    end loop;

    new_def := jsonb_set(new_def, '{sections}', updated_sections);

    hash := encode(sha256(convert_to(new_def::text, 'UTF8')), 'hex');

    if exists (
      select 1 from public.admissions_interest_form_versions v
      where v.form_id = form.id and v.content_hash = hash and v.lifecycle = 'published'
    ) then
      continue;
    end if;

    update public.admissions_interest_form_versions
    set lifecycle = 'archived'
    where form_id = form.id and lifecycle = 'published';

    select coalesce(max(version_number), 0) + 1 into next_number
    from public.admissions_interest_form_versions where form_id = form.id;

    insert into public.admissions_interest_form_versions (
      form_id, organization_id, version_number, lifecycle,
      schema_version, definition, content_hash, published_at
    )
    values (
      form.id, form.organization_id, next_number, 'published',
      'interest_form.v1', new_def, hash, now()
    )
    returning id into new_version_id;

    update public.admissions_interest_forms
    set published_version_id = new_version_id, updated_at = now()
    where id = form.id;

    raise notice 'Published version % with ethnicity.', next_number;
  end loop;
end $$;

-- ===========================================================================
-- VERIFY. Expect version 22, 55 questions where v21 had 53, and the two new
-- keys listed on the student section. An unresolved campus token means a
-- campus section will never render for anyone, with no error anywhere.
-- ===========================================================================

select
  o.name                                                        as organization,
  v.version_number,
  v.lifecycle,
  jsonb_array_length(v.definition -> 'sections')                as section_count,
  jsonb_array_length(v.definition -> 'questions')               as question_count,
  (
    select count(*)
    from jsonb_array_elements(v.definition -> 'questions') q
    where q ->> 'key' in ('hispanic_or_latino', 'race')
  )                                                             as ethnicity_questions,
  (
    select s -> 'questionKeys'
    from jsonb_array_elements(v.definition -> 'sections') s
    where s ->> 'key' = 'student'
  )                                                             as student_section_keys,
  (length(v.definition::text) - length(replace(v.definition::text, '__SCHOOL_', '')))
    / length('__SCHOOL_')                                       as unresolved_campus_tokens
from public.admissions_interest_forms f
join public.admissions_interest_form_versions v on v.id = f.published_version_id
left join public.org_organizations o on o.id = f.organization_id
order by o.name;

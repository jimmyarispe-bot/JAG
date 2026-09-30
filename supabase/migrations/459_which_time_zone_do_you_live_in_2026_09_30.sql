-- 459_which_time_zone_do_you_live_in_2026_09_30.sql
--
-- Jimmy, 30 September: "need to add 'which timezone do you live in' and give
-- them dropdown options. insert right after/behind which state are you legal
-- resident of".
--
-- WHAT THE PARENT SEES
--   Which time zone do you live in?            (required, dropdown)
--   The Academy runs on Eastern time. This tells us how your child's school
--   day lines up with yours.
--
--   Eastern / Central / Mountain /
--   Mountain - Arizona (no daylight saving) / Pacific / Alaska / Hawaii
--
-- WHAT IS STORED IS NOT WHAT IS SHOWN, and that is the whole point.
--
-- Arizona sits in Mountain time and does NOT observe daylight saving, so its
-- distance from Eastern CHANGES even though Arizona never does:
--
--   March - November   3 hours behind Eastern
--   November - March   2 hours behind Eastern
--
-- Denver is 2 hours behind all year. File an Arizona family under "Mountain"
-- and every class time you show them is an hour wrong for eight months, and
-- nobody finds out because the number looks plausible.
--
-- So the value saved is an IANA time zone identifier - America/Phoenix,
-- America/Denver - not a label and not an offset. Those identifiers already
-- know their own daylight-saving rules, so a conversion is
-- `at time zone 'America/Phoenix'` and is right in March and right in
-- November. When a government changes the rules - Arizona has debated it -
-- the time zone database updates and nothing here needs touching.
--
-- An offset would need every screen that prints a time to know about Arizona
-- separately, and one of them eventually would not.
--
-- WHAT THIS DOES NOT DO. Nothing converts anything yet. Class times are
-- Eastern and every screen still shows Eastern. This records the answer
-- correctly from today so the conversion can be built later without going
-- back to 300 families to ask where they live.
--
-- POSITION. Immediately after student_residency_state in Student
-- Information, which is where Jimmy asked for it. The section is
-- inquiry-phase, so the question is asked at the front door and appears on
-- the application too, prefilled.
--
-- Safe to re-run: it refuses once the question exists.

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
  v_max_order    integer;
  v_question     jsonb;
begin

  select f.id, f.organization_id, f.published_version_id, v.definition
    into v_form_id, v_org_id, v_published_id, v_def
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
   limit 1;

  if v_form_id is null or v_def is null then
    raise exception 'No published interest form found. Nothing changed.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(v_def -> 'questions') q
     where q ->> 'key' = 'student_timezone'
  ) then
    raise notice '459: student_timezone already exists. No version published.';
    return;
  end if;

  -- The anchor must be there, or "right after" means nothing.
  if not exists (
    select 1 from jsonb_array_elements(v_def -> 'sections') s
     where s ->> 'key' = 'student'
       and s -> 'questionKeys' ? 'student_residency_state'
  ) then
    raise exception
      'student_residency_state is not in the `student` section, so there is '
      'no "right after" to insert into. Nothing changed.';
  end if;

  v_before := v_def::text;

  select coalesce(max((q ->> 'order')::int), 0) into v_max_order
    from jsonb_array_elements(v_def -> 'questions') q;

  v_question := jsonb_build_object(
    'key', 'student_timezone',
    'type', 'select',
    'label', 'Which time zone do you live in?',
    'helpText', 'The Academy runs on Eastern time. This tells us how your '
                || 'child''s school day lines up with yours.',
    'required', true,
    'order', v_max_order + 1,
    'options', jsonb_build_array(
      jsonb_build_object('value','America/New_York',    'label','Eastern'),
      jsonb_build_object('value','America/Chicago',     'label','Central'),
      jsonb_build_object('value','America/Denver',      'label','Mountain'),
      jsonb_build_object('value','America/Phoenix',     'label','Mountain - Arizona (no daylight saving)'),
      jsonb_build_object('value','America/Los_Angeles', 'label','Pacific'),
      jsonb_build_object('value','America/Anchorage',   'label','Alaska'),
      jsonb_build_object('value','Pacific/Honolulu',    'label','Hawaii')
    )
  );

  -- 1. The question itself.
  v_def := jsonb_set(v_def, '{questions}', (v_def -> 'questions') || v_question);

  -- 2. Its position: rebuilt so it lands immediately after the residency
  --    question. Doubling the ordinal leaves an odd number free after each
  --    existing key, which is where the new one goes.
  select jsonb_set(v_def, '{sections}', (
           select jsonb_agg(
                    case when s ->> 'key' = 'student'
                         then jsonb_set(s, '{questionKeys}', (
                                select jsonb_agg(k order by pos)
                                  from (
                                    select to_jsonb(t.k) as k, t.ord * 2 as pos
                                      from jsonb_array_elements_text(s -> 'questionKeys')
                                           with ordinality as t(k, ord)
                                    union all
                                    select to_jsonb('student_timezone'::text), t.ord * 2 + 1
                                      from jsonb_array_elements_text(s -> 'questionKeys')
                                           with ordinality as t(k, ord)
                                     where t.k = 'student_residency_state'
                                  ) z))
                         else s end
                    order by sord)
             from jsonb_array_elements(v_def -> 'sections') with ordinality as u(s, sord)))
    into v_def;

  v_after := v_def::text;

  if v_after = v_before then
    raise notice '459: nothing changed. No version published.';
    return;
  end if;

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
    '459: published v% - the time zone question sits after residency state.',
    v_next_number;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- 1. Where it landed. student_timezone must be the row immediately after
--    student_residency_state, and nothing else may have moved.

select qk.ord as position, qk.key as question_key
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'sections') s
  cross join lateral (
    select ordinality as ord, value as key
      from jsonb_array_elements_text(s -> 'questionKeys') with ordinality
  ) qk
 where s ->> 'key' = 'student'
 order by qk.ord;

-- 2. What a parent sees, and what gets stored behind it. Arizona must read
--    America/Phoenix - that is the whole reason this question exists.

select o ->> 'label' as parent_sees, o ->> 'value' as stored_value
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'questions') q
  cross join lateral jsonb_array_elements(q -> 'options') o
 where q ->> 'key' = 'student_timezone';

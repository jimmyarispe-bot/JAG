-- 459_the_world_is_bigger_than_fifty_states_2026_09_30.sql
--
-- REPLACES the earlier 459 (which_time_zone_do_you_live_in). That one was
-- never run. It offered seven American time zones, which Jimmy stopped on
-- the spot: "we have students all over the world. the timezone shouldn't
-- just be america. do we need to adjust the which state are you a resident
-- of too?"
--
-- Yes. `student_residency_state` is REQUIRED and lists only US states, so a
-- family in Madrid or Tokyo cannot submit the inquiry at all - or picks a
-- state that is not true, which is worse, because it is copied onto their
-- lead and can raise state-scholarship questions they have no claim to.
-- Same shape as the student-email bug found an hour earlier: a required
-- field that some families cannot answer.
--
-- WHY RESIDENCY AND NOT CITIZENSHIP. Jimmy first asked for "are you a U.S.
-- citizen?" as the gate. They are not the same question, and the difference
-- costs money:
--
--   a green card holder in Marietta IS a Georgia legal resident and is
--   eligible for GA Special Needs - gate on citizenship and she never sees
--   the state question, and loses the scholarship over her passport
--
--   a US citizen in Madrid has NO state of legal residence - gate on
--   citizenship and he is shown a required dropdown he cannot answer
--
-- Both backwards. Jimmy: "this is fine" to gating on residence instead.
--
-- THREE CHANGES
--
--   1. student_lives_in_us   NEW. "Does the student legally reside in the
--                            United States?" Yes / No. Required. Sits
--                            immediately BEFORE the state question.
--
--   2. student_residency_state  gains visibleWhen: shown only when the
--                            answer above is Yes. Its own options, label
--                            and help text are untouched.
--
--   3. student_timezone      NEW. Required, immediately AFTER the state
--                            question. 41 options covering the Americas,
--                            Europe, Africa, the Middle East, Asia and
--                            Oceania - not four hundred, which is not a
--                            question but a punishment.
--
-- THIS TAKES THE INQUIRY FROM 21 FIELDS TO 23 (24 at The Academy HS).
-- 454's verify says a 22nd inquiry field means something was marked inquiry
-- that Jimmy has not seen. He has seen these two: he asked for the time zone
-- on 30 September - "need to add 'which timezone do you live in' and give
-- them dropdown options. insert right after/behind which state are you legal
-- resident of" - and approved the residence gate in the same conversation.
-- The `student` section is phase `inquiry`, and neither new question declares
-- a phase of its own, so both inherit it and appear at the front door and on
-- the application behind the token.
--
-- A NOTE ON THE LABELS. Every country named in an option really is in that
-- option's zone, checked against the browser's own time zone database rather
-- than from memory - which caught two mistakes in the first draft of this
-- list: Ghana was filed under Nigeria (Ghana is UTC+0, Nigeria UTC+1) and
-- Chile under Argentina (Chile still moves its clocks; Argentina does not).
-- Both now have their own entry.
--
-- Several regions genuinely share a time. Nairobi, Riyadh and Moscow are all
-- UTC+3 all year and no code can tell them apart, so a parent in Addis Ababa
-- may find "Saudi Arabia, Kuwait, Iraq, Qatar" filled in for them. The stored
-- zone keeps their clock exactly right and the dropdown is open in front of
-- them. Detection lands 88% of the world's zones on a correct time; the rest
-- - Pacific islands, Kabul, Kathmandu, Newfoundland - get no default and the
-- parent picks.
--
-- WHAT IS STORED IS AN IANA IDENTIFIER, not a label and not an offset.
-- America/Phoenix already knows Arizona does not observe daylight saving;
-- Europe/London knows about British Summer Time. A conversion is
-- `at time zone 'America/Phoenix'` and is right in March and right in
-- November, and when a government changes the rules the time zone database
-- updates and nothing here is touched. An offset would need every screen
-- that prints a time to know about Arizona separately, and one of them
-- eventually would not.
--
-- THE DEFAULT COMES FROM THE BROWSER. defaultValue is the sentinel
-- "__DETECT_TIMEZONE__", which the renderer resolves with
-- Intl.DateTimeFormat().resolvedOptions().timeZone. If Intl is unavailable,
-- or reports a zone this question does not offer, NO default is set and the
-- parent chooses. A wrong zone pre-filled silently is worse than an empty
-- one. That code shipped with this migration.
--
-- WHAT THIS DOES NOT DO. Nothing converts anything yet. Class times are
-- Eastern and every screen still shows Eastern. This records the answer so
-- the conversion can be built later without going back to 300 families.
--
-- Safe to re-run: it stops once student_timezone exists.

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
  v_us_rule      jsonb;
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
    raise notice '459: already applied. No version published.';
    return;
  end if;

  if not exists (
    select 1 from jsonb_array_elements(v_def -> 'sections') s
     where s ->> 'key' = 'student'
       and s -> 'questionKeys' ? 'student_residency_state'
  ) then
    raise exception
      'student_residency_state is not in the `student` section, so there is '
      'nowhere to put these. Nothing changed.';
  end if;

  v_before := v_def::text;

  select coalesce(max((q ->> 'order')::int), 0) into v_max_order
    from jsonb_array_elements(v_def -> 'questions') q;

  v_us_rule := jsonb_build_object('all', jsonb_build_array(
    jsonb_build_object('path','student_lives_in_us','op','eq','value','Yes')
  ));

  -- ---------------------------------------------------------------------
  -- 1 + 3. The two new questions.
  -- ---------------------------------------------------------------------
  v_def := jsonb_set(v_def, '{questions}', (v_def -> 'questions')
    || jsonb_build_object(
         'key', 'student_lives_in_us',
         'type', 'select',
         'label', 'Does the student legally reside in the United States?',
         'required', true,
         'order', v_max_order + 1,
         'options', jsonb_build_array(
           jsonb_build_object('value','Yes','label','Yes'),
           jsonb_build_object('value','No','label','No')
         ))
    || jsonb_build_object(
         'key', 'student_timezone',
         'type', 'select',
         'label', 'Which time zone do you live in?',
         'helpText', 'The Academy runs on Eastern time. This tells us how '
                     || 'your child''s school day lines up with yours.',
         'required', true,
         'order', v_max_order + 2,
         'defaultValue', '__DETECT_TIMEZONE__',
         'options', jsonb_build_array(
           jsonb_build_object('value','America/New_York',   'label','US - Eastern'),
           jsonb_build_object('value','America/Chicago',    'label','US - Central'),
           jsonb_build_object('value','America/Denver',     'label','US - Mountain'),
           jsonb_build_object('value','America/Phoenix',    'label','US - Arizona (no daylight saving)'),
           jsonb_build_object('value','America/Los_Angeles','label','US - Pacific'),
           jsonb_build_object('value','America/Anchorage',  'label','US - Alaska'),
           jsonb_build_object('value','Pacific/Honolulu',   'label','US - Hawaii'),
           jsonb_build_object('value','America/Puerto_Rico','label','Puerto Rico and the Caribbean'),
           jsonb_build_object('value','America/Halifax',    'label','Canada - Atlantic'),
           jsonb_build_object('value','America/Toronto',    'label','Canada - Eastern'),
           jsonb_build_object('value','America/Vancouver',  'label','Canada - Pacific'),
           jsonb_build_object('value','America/Mexico_City','label','Mexico'),
           jsonb_build_object('value','America/Bogota',     'label','Colombia, Peru, Ecuador'),
           jsonb_build_object('value','America/Santiago',   'label','Chile'),
           jsonb_build_object('value','America/Sao_Paulo',  'label','Brazil'),
           jsonb_build_object('value','America/Argentina/Buenos_Aires','label','Argentina, Uruguay, Paraguay'),
           jsonb_build_object('value','Europe/London',      'label','United Kingdom, Ireland, Portugal'),
           jsonb_build_object('value','Europe/Madrid',      'label','Western Europe (Spain, France, Germany, Italy)'),
           jsonb_build_object('value','Europe/Athens',      'label','Eastern Europe (Greece, Finland, Romania)'),
           jsonb_build_object('value','Africa/Cairo',       'label','Egypt'),
           jsonb_build_object('value','Asia/Riyadh',        'label','Saudi Arabia, Kuwait, Iraq, Qatar'),
           jsonb_build_object('value','Europe/Moscow',      'label','Russia - Moscow'),
           jsonb_build_object('value','Africa/Accra',       'label','West Africa (Ghana, Senegal, Cote d''Ivoire)'),
           jsonb_build_object('value','Africa/Lagos',       'label','West Africa (Nigeria, Cameroon)'),
           jsonb_build_object('value','Africa/Johannesburg','label','Southern Africa'),
           jsonb_build_object('value','Africa/Nairobi',     'label','East Africa (Kenya, Ethiopia)'),
           jsonb_build_object('value','Asia/Jerusalem',     'label','Israel'),
           jsonb_build_object('value','Asia/Tehran',        'label','Iran'),
           jsonb_build_object('value','Asia/Dubai',         'label','Gulf (UAE, Oman)'),
           jsonb_build_object('value','Asia/Karachi',       'label','Pakistan'),
           jsonb_build_object('value','Asia/Kolkata',       'label','India, Sri Lanka'),
           jsonb_build_object('value','Asia/Dhaka',         'label','Bangladesh'),
           jsonb_build_object('value','Asia/Bangkok',       'label','Thailand, Vietnam'),
           jsonb_build_object('value','Asia/Singapore',     'label','Singapore, Malaysia, Philippines'),
           jsonb_build_object('value','Asia/Shanghai',      'label','China, Hong Kong, Taiwan'),
           jsonb_build_object('value','Asia/Tokyo',         'label','Japan, Korea'),
           jsonb_build_object('value','Australia/Perth',    'label','Australia - Perth'),
           jsonb_build_object('value','Australia/Brisbane', 'label','Australia - Brisbane'),
           jsonb_build_object('value','Australia/Adelaide', 'label','Australia - Adelaide'),
           jsonb_build_object('value','Australia/Sydney',   'label','Australia - Sydney, Melbourne'),
           jsonb_build_object('value','Pacific/Auckland',   'label','New Zealand')
         ))
  );

  -- ---------------------------------------------------------------------
  -- 2. The state question becomes conditional. Everything else about it -
  --    its label, its options, its help text - is left exactly as it is.
  -- ---------------------------------------------------------------------
  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case when q ->> 'key' = 'student_residency_state'
                         then jsonb_set(q, '{visibleWhen}', v_us_rule)
                         else q end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  -- ---------------------------------------------------------------------
  -- Position: lives_in_us BEFORE the state question, timezone AFTER it.
  -- Tripling the ordinal leaves a slot free on each side of every key.
  -- ---------------------------------------------------------------------
  select jsonb_set(v_def, '{sections}', (
           select jsonb_agg(
                    case when s ->> 'key' = 'student'
                         then jsonb_set(s, '{questionKeys}', (
                                select jsonb_agg(k order by pos)
                                  from (
                                    select to_jsonb(t.k) as k, t.ord * 3 as pos
                                      from jsonb_array_elements_text(s -> 'questionKeys')
                                           with ordinality as t(k, ord)
                                    union all
                                    select to_jsonb('student_lives_in_us'::text), t.ord * 3 - 1
                                      from jsonb_array_elements_text(s -> 'questionKeys')
                                           with ordinality as t(k, ord)
                                     where t.k = 'student_residency_state'
                                    union all
                                    select to_jsonb('student_timezone'::text), t.ord * 3 + 1
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
    '459: published v% - residence, then state only if the US, then time '
    'zone.', v_next_number;
end $$;

commit;

-- ── VERIFY 1 ─────────────────────────────────────────────────────────────────
-- The running order, and who sees each one. Expect, in this order:
--   ... student_lives_in_us (everyone)
--       student_residency_state (only when lives_in_us = Yes)
--       student_timezone (everyone)
--       hs_student_email (only at The Academy HS)

select qk.ord                                          as position,
       qk.key                                          as question_key,
       case
         when q.value -> 'visibleWhen' is null
           or q.value -> 'visibleWhen' = 'null'::jsonb then 'everyone'
         else 'only when ' || (q.value #>> '{visibleWhen,all,0,path}')
              || ' = ' || (q.value #>> '{visibleWhen,all,0,value}')
       end                                             as shown_to
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'sections') s
  cross join lateral (
    select ordinality as ord, value as key
      from jsonb_array_elements_text(s -> 'questionKeys') with ordinality
  ) qk
  cross join lateral (
    select value from jsonb_array_elements(v.definition -> 'questions')
     where value ->> 'key' = qk.key limit 1
  ) q
 where s ->> 'key' = 'student'
 order by qk.ord;

-- ── VERIFY 2 ─────────────────────────────────────────────────────────────────
-- Every time zone offered, and the identifier stored behind it. 41 rows.
-- US - Arizona must read America/Phoenix.

select row_number() over ()   as n,
       o ->> 'label'          as parent_sees,
       o ->> 'value'          as stored_value
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'questions') q
  cross join lateral jsonb_array_elements(q -> 'options') o
 where q ->> 'key' = 'student_timezone';

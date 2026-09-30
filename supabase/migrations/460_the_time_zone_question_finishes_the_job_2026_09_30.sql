-- 460_the_time_zone_question_finishes_the_job_2026_09_30.sql
--
-- WHY THIS EXISTS AND 459 DID NOT RUN.
--
-- There were two files numbered 459. The first,
-- `459_which_time_zone_do_you_live_in`, added student_timezone with seven
-- American zones. The second, `459_the_world_is_bigger_than_fifty_states`,
-- was written to replace it after Jimmy said "we have students all over the
-- world" - but it opens by checking whether student_timezone already exists
-- and returning if it does. The first file had already been run. So the
-- second found the question there, said "already applied", and published
-- nothing. The guard meant to make it safe to re-run is what made it do
-- nothing at all.
--
-- WHAT IS LIVE RIGHT NOW, AND WHY IT IS WORSE THAN BEFORE
--
--   student_residency_state   required, ungated, fifty US states
--   student_timezone          required, seven US zones, no default
--
-- A family in Madrid or Lagos is now blocked by TWO required questions they
-- cannot answer instead of one. That is on the public inquiry form at every
-- campus today.
--
-- WHAT THIS DOES. The same three things the second 459 meant to do, written
-- to repair whatever it finds rather than to refuse when something is there:
--
--   1. student_lives_in_us   added if absent. "Does the student legally
--                            reside in the United States?" Yes / No,
--                            required, immediately BEFORE the state question.
--
--   2. student_residency_state  gated on that answer being Yes. Its label,
--                            its options and its help text are untouched.
--
--   3. student_timezone      its seven options replaced with 41 covering the
--                            Americas, Europe, Africa, the Middle East, Asia
--                            and Oceania. Repositioned immediately AFTER the
--                            state question. Still required.
--
-- NO defaultValue IS SET HERE, DELIBERATELY. Browser detection needs code
-- that is not deployed yet, and setting the sentinel "__DETECT_TIMEZONE__"
-- before that code is live would write the literal string into the dropdown -
-- and the server refuses a select value that is not one of its options, which
-- would block every inquiry at every campus. 461 sets the default, and 461
-- runs only after the deploy. Until then the dropdown simply opens unanswered
-- and the parent picks, which is how every other select on this form behaves.
--
-- So this file is safe to run NOW, before any deploy, and it is the urgent
-- half: it is what lets a family outside the United States submit at all.
--
-- WHAT IS STORED IS AN IANA IDENTIFIER, not a label and not an offset.
-- America/Phoenix already knows Arizona does not observe daylight saving;
-- Europe/London knows about British Summer Time. A conversion is
-- `at time zone 'America/Phoenix'` and is right in March and right in
-- November, and when a government changes the rules the time zone database
-- updates and nothing here is touched.
--
-- ON THE LABELS. Every country named in an option really is in that option's
-- zone, checked against the time zone database rather than from memory -
-- which caught two mistakes in the first draft: Ghana was filed under Nigeria
-- (Ghana is UTC+0, Nigeria UTC+1) and Chile under Argentina (Chile still
-- moves its clocks; Argentina does not). Both have their own entry now.
--
-- Several regions genuinely share a time - Nairobi, Riyadh and Moscow are all
-- UTC+3 all year - so more than one option can be correct for a family. The
-- stored zone is what matters and every one of them keeps the clock right.
--
-- THIS TAKES THE INQUIRY FROM 22 FIELDS TO 23 (24 at The Academy HS).
-- 454's verify says an unexpected inquiry field means something was marked
-- inquiry that Jimmy has not seen. He has seen both of these: he asked for
-- the time zone question on 30 September and approved gating the state
-- question on residence in the same conversation. The `student` section is
-- phase `inquiry` and neither question declares a phase of its own, so both
-- inherit it.
--
-- Safe to re-run: it compares the definition before and after and publishes
-- nothing when they match.

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
  v_zone_options jsonb;
  v_has_tz       boolean;
begin

  select f.id, f.organization_id, f.published_version_id, v.definition
    into v_form_id, v_org_id, v_published_id, v_def
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
   limit 1;

  if v_form_id is null or v_def is null then
    raise exception 'No published interest form found. Nothing changed.';
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

  -- The 41. Order is deliberate and roughly west to east, US first.
  v_zone_options := jsonb_build_array(
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
  );

  select exists (
    select 1 from jsonb_array_elements(v_def -> 'questions') q
     where q ->> 'key' = 'student_timezone'
  ) into v_has_tz;

  -- ---------------------------------------------------------------------
  -- 1. student_lives_in_us, if it is not already there.
  -- ---------------------------------------------------------------------
  if not exists (
    select 1 from jsonb_array_elements(v_def -> 'questions') q
     where q ->> 'key' = 'student_lives_in_us'
  ) then
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
           )));
  end if;

  -- ---------------------------------------------------------------------
  -- 3. student_timezone. Replaced where it exists - the seven American
  --    zones the first 459 left behind - added where it does not.
  --
  --    jsonb_set on the options rather than a rebuilt object, so a
  --    defaultValue set later by 461 is not silently wiped if this file is
  --    ever run again afterwards.
  -- ---------------------------------------------------------------------
  if v_has_tz then
    select jsonb_set(v_def, '{questions}', (
             select jsonb_agg(
                      case when q ->> 'key' = 'student_timezone'
                           then jsonb_set(q, '{options}', v_zone_options)
                           else q end
                      order by ord)
               from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
      into v_def;
  else
    v_def := jsonb_set(v_def, '{questions}', (v_def -> 'questions')
      || jsonb_build_object(
           'key', 'student_timezone',
           'type', 'select',
           'label', 'Which time zone do you live in?',
           'helpText', 'The Academy runs on Eastern time. This tells us how '
                       || 'your child''s school day lines up with yours.',
           'required', true,
           'order', v_max_order + 2,
           'options', v_zone_options));
  end if;

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
  --
  --    Both keys are stripped out first, so this lands them correctly
  --    whether they are absent, already in place, or - as student_timezone
  --    is today - sitting somewhere the first 459 put them. Tripling the
  --    ordinal of what remains leaves a slot free on each side of every key.
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
                                     where t.k not in ('student_lives_in_us','student_timezone')
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
    raise notice '460: the live form already says all of this. No version published.';
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
    '460: published v% - a family outside the United States can submit the '
    'inquiry again.', v_next_number;
end $$;

commit;

-- ── VERIFY 1 ─────────────────────────────────────────────────────────────────
-- Run this block on its own. The running order of Student Information, and
-- who sees each question. Expect, in this order:
--
--   ... student_lives_in_us      everyone
--       student_residency_state  only when student_lives_in_us = Yes
--       student_timezone         everyone
--       hs_student_email         only at The Academy HS
--
-- The last column must read "not set" for student_timezone. If it reads
-- __DETECT_TIMEZONE__ then 461 has been run, and it must not be until the
-- deploy carrying the detection code is live.

select qk.ord                                          as position,
       qk.key                                          as question_key,
       case
         when q.value -> 'visibleWhen' is null
           or q.value -> 'visibleWhen' = 'null'::jsonb then 'everyone'
         else 'only when ' || (q.value #>> '{visibleWhen,all,0,path}')
              || ' = ' || (q.value #>> '{visibleWhen,all,0,value}')
       end                                             as shown_to,
       coalesce(q.value ->> 'defaultValue', 'not set') as default_value
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
-- Run this block on its own. Every time zone offered, in the order a parent
-- sees it, the identifier stored behind it, and whether this database
-- recognises that identifier.
--
-- Expect 41 rows, every one of them "recognised", row 4 - US - Arizona -
-- reading America/Phoenix, and row 41 New Zealand.
--
-- THE ORDER BY IS LOAD-BEARING, and the first draft of this block did not
-- have it. `row_number() over ()` with no window order numbers whatever
-- order the planner happens to return, and the left join to
-- pg_timezone_names is enough to make that order arbitrary - so the first
-- run of this came back with Hawaii at position 1 and looked like the
-- options had been written in a jumble. They had not. Taking ordinality
-- from the options array and ordering on it is what makes this read the
-- array rather than the plan.
--
-- Option order is not cosmetic: where two regions share a time all year -
-- Nairobi, Riyadh and Moscow are all UTC+3 - browser detection takes the
-- earliest match in this list. US first is deliberate.

select t.ord                as position,
       t.label              as parent_sees,
       t.value              as stored_value,
       case when z.name is null then 'NOT RECOGNISED' else 'recognised' end
                            as identifier
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'questions') q
  cross join lateral (
    select ordinality        as ord,
           value ->> 'label' as label,
           value ->> 'value' as value
      from jsonb_array_elements(q -> 'options') with ordinality
  ) t
  left join pg_timezone_names z on z.name = t.value
 where q ->> 'key' = 'student_timezone'
 order by t.ord;

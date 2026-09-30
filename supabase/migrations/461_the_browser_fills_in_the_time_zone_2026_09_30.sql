-- 461_the_browser_fills_in_the_time_zone_2026_09_30.sql
--
-- DO NOT RUN THIS UNTIL THE DEPLOY CARRYING THE DETECTION CODE IS LIVE.
--
-- It sets one field: defaultValue on student_timezone, to the sentinel
-- "__DETECT_TIMEZONE__". The renderer reads that sentinel and resolves it
-- with the browser's own time zone. Without that code deployed, the literal
-- string "__DETECT_TIMEZONE__" is written into the dropdown as its value -
-- and the server refuses a select value that is not one of the question's
-- options, which would block every inquiry at every campus.
--
-- NOTHING IN A DATABASE CAN SEE WHETHER A DEPLOY HAPPENED, so this file
-- cannot check that for you and does not pretend to. It checks only what it
-- can: that 460 has run and the 41 options are in place. The deploy is the
-- one condition you have to confirm yourself - Vercel showing the commit
-- "The world is bigger than fifty states" as Ready on production.
--
-- WHY A SENTINEL AND NOT A ZONE. The default is declared in the form, not
-- hardcoded in the renderer, so nothing in the code knows this question by
-- name and the form builder can rename or move it without breaking
-- detection.
--
-- WHAT THE CODE DOES WITH IT. Exact name match first. The question offers 41
-- regions, not the 400 IANA publishes, so an exact hit is the lucky case:
-- Atlanta reports America/New_York and matches, Detroit reports
-- America/Detroit and does not, though Detroit IS Eastern. So it then takes
-- the first offered zone that agrees with the browser's at four points
-- across the year - four, because two readings six months apart cannot tell
-- Santiago from Sao Paulo, and one cannot tell Brisbane from Sydney. 88% of
-- the world's zones land on a correct time. The rest - Kathmandu, Kabul,
-- Newfoundland, the Pacific islands - get NO default and the parent picks,
-- because a wrong zone filled in silently is worse than an empty one.
--
-- Safe to re-run: it publishes nothing once the default is set.

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
    select 1 from jsonb_array_elements(v_def -> 'questions') q
     where q ->> 'key' = 'student_timezone'
  ) then
    raise exception
      'student_timezone is not on the form. Run 460 first. Nothing changed.';
  end if;

  -- The 41-option list is what detection matches against. If the question
  -- still carries the seven American zones the first 459 left, 460 has not
  -- run and detection would refuse for most of the world.
  if (select jsonb_array_length(q -> 'options')
        from jsonb_array_elements(v_def -> 'questions') q
       where q ->> 'key' = 'student_timezone') < 41 then
    raise exception
      'student_timezone still has fewer than 41 options, so 460 has not run. '
      'Nothing changed.';
  end if;

  v_before := v_def::text;

  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case when q ->> 'key' = 'student_timezone'
                         then jsonb_set(q, '{defaultValue}', '"__DETECT_TIMEZONE__"'::jsonb)
                         else q end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  v_after := v_def::text;

  if v_after = v_before then
    raise notice '461: the default is already set. No version published.';
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
    '461: published v% - the browser fills the time zone in and the parent '
    'confirms it.', v_next_number;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- One row. default_value must read __DETECT_TIMEZONE__ and options must be 41.

select q ->> 'key'                             as question_key,
       coalesce(q ->> 'defaultValue','not set') as default_value,
       jsonb_array_length(q -> 'options')      as options
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'questions') q
 where q ->> 'key' = 'student_timezone';

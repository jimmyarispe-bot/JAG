/*
  WHICH FORM IS THE APPLICATION — read-only. Nothing here writes.

  Corrected: the first version named f.name, which does not exist (42703).
  Nothing below names a column on these two tables. Every value is pulled out
  of the row as JSON with ->>, which yields null for a key that is not there
  rather than failing. That is the third time today a guessed column has cost
  a round trip, so this one guesses nothing.

  WHY THIS EXISTS. I built a seven-question form and put it behind the
  invitation link. It is not the application. Per
  campus-application-map-2026-09-11.md the real applications are one
  conditional form, per campus, with visibleWhen keyed to school_id. This shows
  what is actually published so the next step is chosen from the database
  rather than from me.

  WHAT EMPTY MEANS, decided before running it:

  1. the forms    — one row per form definition. Zero would mean these are not
                    the tables the builder writes to at all.
  2. the versions — one row per version, with whatever status field exists.
                    The published one is the live definition.
  3. campus keyed — whether a version's JSON mentions school_id at all. "NO
                    school_id" on the live version means the per-campus
                    conditionals are not in what families currently see.
  4. size         — characters of JSON per version. The map describes a large
                    form; a small number means I am reading the wrong row.
*/

with forms as (
  select id, to_jsonb(f) as j from public.admissions_interest_forms f
),
versions as (
  select id, form_id, to_jsonb(v) as j from public.admissions_interest_form_versions v
)

select
  '1. the forms' as check,
  coalesce(
    f.j ->> 'name', f.j ->> 'title', f.j ->> 'slug', f.j ->> 'key', f.id::text
  ) as detail,
  'id=' || f.id::text
    || ' | versions=' || (select count(*)::text from versions v where v.form_id = f.id)
    || ' | keys: ' || (
      select string_agg(k, ', ' order by k) from jsonb_object_keys(f.j) as k
    ) as extra
from forms f

union all

select
  '2. the versions',
  coalesce(f.j ->> 'name', f.j ->> 'slug', 'form ' || f.id::text)
    || '  v' || coalesce(v.j ->> 'version_number', v.j ->> 'version', '?'),
  'status=' || coalesce(v.j ->> 'status', v.j ->> 'state', 'none')
    || ' | published_at=' || coalesce(v.j ->> 'published_at', 'null')
    || ' | created=' || coalesce(left(v.j ->> 'created_at', 16), '?')
from versions v
join forms f on f.id = v.form_id

union all

select
  '3. campus keyed',
  coalesce(f.j ->> 'name', f.j ->> 'slug', 'form ' || f.id::text)
    || '  v' || coalesce(v.j ->> 'version_number', v.j ->> 'version', '?'),
  case
    when v.j::text like '%school_id%' then 'mentions school_id'
    else 'NO school_id anywhere in this version'
  end
from versions v
join forms f on f.id = v.form_id

union all

select
  '4. size',
  coalesce(f.j ->> 'name', f.j ->> 'slug', 'form ' || f.id::text)
    || '  v' || coalesce(v.j ->> 'version_number', v.j ->> 'version', '?'),
  length(v.j::text)::text || ' characters of JSON'
from versions v
join forms f on f.id = v.form_id

order by 1, 2;

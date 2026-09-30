-- 457_the_application_does_not_ask_twice_2026_09_30.sql
--
-- Jimmy, 30 September, having opened Julian Towa's real application link:
-- "we need to delete the first program of interest option that appears with
-- only virtual as the option. it's redundant based on the next question."
--
-- WHAT HE SAW. Three programme questions on one page, two of them carrying
-- the IDENTICAL label "Program(s) of Interest":
--
--   program                   In-Person / Only Virtual / Hybrid, campus
--                             filtered - so at Virtual it offers exactly one
--   program_virtual           Full School Program / Tutoring
--   virtual_program_interest  the five from the CRM catalogue
--
-- WHY IT CANNOT SIMPLY MOVE TO THE APPLICATION. `program` is one of the 20
-- fields the inquiry must ask at every campus - Jimmy, twice: "these are the
-- only fields that should ever show for the inquiry/interest form for all
-- schools at all times". It has to be asked at the front door. It just must
-- not be asked again behind the token.
--
-- So it becomes inquiry_only, the third phase value, shipped with this.
--
-- Chose (a) of two: `program` never appears on the application. The other was
-- hiding it only at HS and Virtual, where a campus question covers it. (a)
-- means a Florida or Georgia family answers it once, at the inquiry, and
-- their answer stands - it is on the lead and staff can see it. Jimmy: "a".
--
-- Safe to re-run. If the live definition already says this, nothing is
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
begin

  select f.id, f.organization_id, f.published_version_id, v.definition
    into v_form_id, v_org_id, v_published_id, v_def
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
   limit 1;

  if v_form_id is null or v_def is null then
    raise exception 'No published interest form found. Fix that before this.';
  end if;

  if not exists (
    select 1 from jsonb_array_elements(v_def -> 'questions') q
     where q ->> 'key' = 'program'
  ) then
    raise exception
      'The published form has no question keyed `program`. Nothing changed - '
      'find out what it is called before marking anything.';
  end if;

  v_before := v_def::text;

  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case when q ->> 'key' = 'program'
                         then jsonb_set(q, '{phase}', '"inquiry_only"'::jsonb)
                         else q end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  v_after := v_def::text;

  if v_after = v_before then
    raise notice '457: the live form already says this. No version published.';
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
    '457: published v% - `program` is asked at the inquiry and not repeated '
    'on the application.', v_next_number;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect three rows. Only `program` says inquiry_only; the other two
-- programme questions stay application-phase, where they belong.

select q ->> 'key'                                   as question_key,
       coalesce(q ->> 'phase', '(inherits section)')  as phase,
       jsonb_array_length(coalesce(q -> 'options','[]'::jsonb)) as options
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'questions') q
 where q ->> 'key' in ('program', 'program_hs', 'program_virtual')
 order by 1;

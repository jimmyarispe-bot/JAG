-- 458_the_student_email_is_a_high_school_question_2026_09_30.sql
--
-- Jimmy, 30 September, on the live public form with no campus selected:
-- "this is wrong. student email and related function only applies to the
-- academy hs application form."
--
-- HE IS RIGHT AND I CAUSED IT. Migration 454 moved hs_student_email out of
-- the hs_detail section and into `student` - his choice (b), so the inquiry
-- would not grow a lone "The Academy HS" heading with one field under it.
--
-- What I missed: hs_student_email has NO visibleWhen of its own. Its
-- HS-only visibility came ENTIRELY from the section it lived in, whose rule
-- is school_id = The Academy HS. `student` is shown to everybody. So the
-- moment it moved, a REQUIRED question meant for high-schoolers started
-- appearing on every campus's inquiry - and being required, it has been
-- blocking submissions from families who have no student email to give.
--
-- Migration 454's own comment says "Its visibleWhen is untouched, so only HS
-- families see it." That sentence is false. There was nothing to untouch. I
-- asserted a safety property without reading whether it existed, and the
-- diagnostic I had ALREADY RUN said so - q_shown was empty on that row.
--
-- THE FIX. Give the question the rule it never had, matching what hs_detail
-- still uses for the rest of the high school's questions.
--
-- The help text Jimmy approved on the 29th - "You will be copied into the
-- email we send your student." - rides along untouched, and is now seen only
-- by the families it was written for.
--
-- The school id is looked up by name, as in 455, and this REFUSES rather
-- than publishing a rule that points nowhere.
--
-- Safe to re-run.

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
  v_id_hs        text;
  v_rule         jsonb;
begin

  select f.id, f.organization_id, f.published_version_id, v.definition
    into v_form_id, v_org_id, v_published_id, v_def
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
   limit 1;

  if v_form_id is null or v_def is null then
    raise exception 'No published interest form found. Nothing changed.';
  end if;

  select s.id::text into v_id_hs from public.schools s
   where s.organization_id = v_org_id and s.name = 'The Academy HS' limit 1;

  if v_id_hs is null then
    raise exception
      'Could not find The Academy HS by name. A visibility rule pointing at '
      'nothing would hide this question from everyone. Nothing changed.';
  end if;

  if not exists (
    select 1 from jsonb_array_elements(v_def -> 'questions') q
     where q ->> 'key' = 'hs_student_email'
  ) then
    raise exception 'No question keyed hs_student_email. Nothing changed.';
  end if;

  v_before := v_def::text;

  v_rule := jsonb_build_object('all', jsonb_build_array(
    jsonb_build_object('path','school_id','op','eq','value', v_id_hs)
  ));

  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case when q ->> 'key' = 'hs_student_email'
                         then jsonb_set(q, '{visibleWhen}', v_rule)
                         else q end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  v_after := v_def::text;

  if v_after = v_before then
    raise notice '458: the live form already says this. No version published.';
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
    '458: published v% - the student email is asked at The Academy HS and '
    'nowhere else.', v_next_number;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Every question in the `student` section. Only hs_student_email should be
-- conditional; the other ten are asked of everyone. Anything ELSE showing a
-- rule here is another question that quietly lost or gained one.

select qk.ord                                            as position,
       qk.key                                            as question_key,
       case when (q.value -> 'required')::boolean then 'REQUIRED' else '' end as req,
       case
         when q.value -> 'visibleWhen' is null
           or q.value -> 'visibleWhen' = 'null'::jsonb then 'everyone'
         else 'conditional: ' || (q.value #>> '{visibleWhen,all,0,value}')
       end                                               as shown_to
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

-- =========================================
-- 186 — Academy Launch 002.1: canonical program codes only
-- create_student_record no longer silently remaps marketing aliases.
-- Invalid must submit students_program_check codes (or null).
-- =========================================

create or replace function public.create_student_record(
  p_school_id uuid,
  p_first_name text,
  p_last_name text,
  p_family_id uuid default null,
  p_preferred_name text default null,
  p_date_of_birth date default null,
  p_grade_level text default null,
  p_gender text default null,
  p_program text default null,
  p_enrollment_status text default 'pending',
  p_funding_source_codes text[] default '{}'::text[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_student_id uuid;
  v_program text;
  v_enrollment_status text;
  v_code text;
  v_funding_id uuid;
begin
  if p_school_id is null then
    raise exception 'school_id is required';
  end if;

  if coalesce(trim(p_first_name), '') = '' or coalesce(trim(p_last_name), '') = '' then
    raise exception 'Student first and last name are required';
  end if;

  if not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'Invalid school';
  end if;

  if p_family_id is not null
     and not exists (
       select 1 from public.families f
       where f.id = p_family_id and f.school_id = p_school_id
     ) then
    raise exception 'Family must belong to the selected school';
  end if;

  -- Canonical-only: do not remap aliases (application layer rejects those first).
  v_program := nullif(trim(coalesce(p_program, '')), '');
  if v_program is not null then
    if v_program not in (
      'academy_fl_campus',
      'academy_fl_virtual',
      'academy_ga_campus',
      'academy_ga_hybrid',
      'academy_hs',
      'academy_virtual'
    ) then
      raise exception
        'Invalid program "%". Allowed values: academy_fl_campus, academy_fl_virtual, academy_ga_campus, academy_ga_hybrid, academy_hs, academy_virtual.',
        v_program;
    end if;
  end if;

  v_enrollment_status := coalesce(nullif(trim(p_enrollment_status), ''), 'pending');
  if v_enrollment_status not in ('pending', 'enrolled', 'waitlisted', 'withdrawn', 'graduated') then
    raise exception 'Invalid enrollment_status "%"', v_enrollment_status;
  end if;

  insert into public.students (
    school_id,
    family_id,
    first_name,
    last_name,
    preferred_name,
    date_of_birth,
    grade_level,
    gender,
    program,
    enrollment_status,
    status
  )
  values (
    p_school_id,
    p_family_id,
    trim(p_first_name),
    trim(p_last_name),
    nullif(trim(coalesce(p_preferred_name, '')), ''),
    p_date_of_birth,
    nullif(trim(coalesce(p_grade_level, '')), ''),
    nullif(trim(coalesce(p_gender, '')), ''),
    v_program,
    v_enrollment_status,
    'active'
  )
  returning id into v_student_id;

  if coalesce(array_length(p_funding_source_codes, 1), 0) > 0 then
    foreach v_code in array p_funding_source_codes
    loop
      if coalesce(trim(v_code), '') = '' then
        continue;
      end if;

      select fs.id into v_funding_id
      from public.funding_sources fs
      where fs.code = trim(v_code)
      limit 1;

      if v_funding_id is null then
        raise exception 'Unknown funding source code "%"', trim(v_code);
      end if;

      insert into public.student_funding_sources (student_id, funding_source_id)
      values (v_student_id, v_funding_id)
      on conflict do nothing;
    end loop;
  end if;

  return v_student_id;
end;
$$;

grant execute on function public.create_student_record(
  uuid, text, text, uuid, text, date, text, text, text, text, text[]
) to authenticated, service_role;

notify pgrst, 'reload schema';

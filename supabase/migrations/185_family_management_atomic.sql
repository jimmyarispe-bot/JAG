-- =========================================
-- 185 — Academy Launch 002: Family Management
-- Atomic family + guardian creation and student linking.
-- =========================================

insert into public.platform_permissions (permission_key, name, description, module, category, sort_order)
values
  (
    'families.manage',
    'Manage Families',
    'Create families, guardians, and student–family links.',
    'sis',
    'students',
    45
  )
on conflict (permission_key) do update
set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module,
  category = excluded.category;

-- Atomic: create family + guardians, optionally link a student.
create or replace function public.create_family_with_guardians(
  p_school_id uuid,
  p_family_name text,
  p_guardians jsonb default '[]'::jsonb,
  p_student_id uuid default null,
  p_billing_email text default null,
  p_billing_phone text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_family_id uuid;
  v_guardian jsonb;
  v_guardian_id uuid;
  v_guardian_ids uuid[] := '{}';
  v_idx integer := 0;
  v_first text;
  v_last text;
  v_email text;
  v_phone text;
  v_rel text;
  v_is_primary boolean;
  v_is_emergency boolean;
  v_preferred text;
  v_contact_type text;
begin
  if p_school_id is null then
    raise exception 'school_id is required';
  end if;

  if coalesce(trim(p_family_name), '') = '' then
    raise exception 'family_name is required';
  end if;

  if not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'Invalid school';
  end if;

  if p_student_id is not null then
    if not exists (
      select 1 from public.students s
      where s.id = p_student_id and s.school_id = p_school_id
    ) then
      raise exception 'Student must belong to the selected school';
    end if;
  end if;

  if jsonb_typeof(p_guardians) is distinct from 'array' or jsonb_array_length(p_guardians) < 1 then
    raise exception 'At least one guardian is required';
  end if;

  insert into public.families (
    school_id,
    family_name,
    billing_email,
    billing_phone,
    status
  )
  values (
    p_school_id,
    trim(p_family_name),
    nullif(trim(coalesce(p_billing_email, '')), ''),
    nullif(trim(coalesce(p_billing_phone, '')), ''),
    'active'
  )
  returning id into v_family_id;

  for v_idx in 0 .. jsonb_array_length(p_guardians) - 1
  loop
    v_guardian := p_guardians -> v_idx;
    v_first := nullif(trim(coalesce(v_guardian ->> 'first_name', '')), '');
    v_last := nullif(trim(coalesce(v_guardian ->> 'last_name', '')), '');
    v_email := nullif(trim(coalesce(v_guardian ->> 'email', '')), '');
    v_phone := nullif(trim(coalesce(v_guardian ->> 'phone', '')), '');
    v_rel := nullif(trim(coalesce(v_guardian ->> 'relationship', '')), '');
    v_is_primary := coalesce((v_guardian ->> 'is_primary')::boolean, v_idx = 0);
    v_is_emergency := coalesce((v_guardian ->> 'is_emergency_contact')::boolean, false);
    v_preferred := nullif(trim(coalesce(v_guardian ->> 'preferred_contact_method', '')), '');
    v_contact_type := case
      when v_is_emergency then 'emergency'
      when lower(coalesce(v_rel, '')) in (
        'mother','father','guardian','parent','grandparent','foster_parent',
        'case_worker','advocate','attorney','therapist','transportation','emergency','other'
      ) then lower(v_rel)
      else 'guardian'
    end;

    if v_first is null or v_last is null then
      raise exception 'Guardian first and last name are required';
    end if;

    insert into public.guardians (
      family_id,
      first_name,
      last_name,
      relationship_to_student,
      email,
      phone,
      is_primary,
      is_emergency_contact,
      contact_type,
      receives_communications,
      communication_preferences
    )
    values (
      v_family_id,
      v_first,
      v_last,
      v_rel,
      v_email,
      v_phone,
      v_is_primary,
      v_is_emergency,
      v_contact_type,
      true,
      case
        when v_preferred is null then '{}'::jsonb
        else jsonb_build_object('preferred_method', v_preferred)
      end
    )
    returning id into v_guardian_id;

    v_guardian_ids := array_append(v_guardian_ids, v_guardian_id);
  end loop;

  if p_student_id is not null then
    update public.students
    set family_id = v_family_id,
        updated_at = now()
    where id = p_student_id;
  end if;

  return jsonb_build_object(
    'family_id', v_family_id,
    'guardian_ids', to_jsonb(v_guardian_ids),
    'student_id', p_student_id
  );
end;
$$;

grant execute on function public.create_family_with_guardians(uuid, text, jsonb, uuid, text, text)
  to authenticated, service_role;

-- Link an existing student to an existing family (same school).
create or replace function public.link_student_to_family(
  p_student_id uuid,
  p_family_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_student_school uuid;
  v_family_school uuid;
begin
  if p_student_id is null or p_family_id is null then
    raise exception 'student_id and family_id are required';
  end if;

  select school_id into v_student_school
  from public.students
  where id = p_student_id;

  if v_student_school is null then
    raise exception 'Student not found';
  end if;

  select school_id into v_family_school
  from public.families
  where id = p_family_id;

  if v_family_school is null then
    raise exception 'Family not found';
  end if;

  if v_student_school is distinct from v_family_school then
    raise exception 'Student and family must belong to the same school';
  end if;

  update public.students
  set family_id = p_family_id,
      updated_at = now()
  where id = p_student_id;

  return p_student_id;
end;
$$;

grant execute on function public.link_student_to_family(uuid, uuid)
  to authenticated, service_role;

notify pgrst, 'reload schema';

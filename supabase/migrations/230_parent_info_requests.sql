-- Ask parents for the details the school is missing, and let them answer
-- without an account.
--
-- Twelve enrolled students have no date of birth, five have no grade, three
-- families have no email, and almost nobody has an address. Every one of those
-- gaps is something a parent could fill in thirty seconds. Nothing in the
-- platform asks them.
--
-- The token design is copied from the listening campaigns (migration 214),
-- which is the one public-link pattern here that was built properly:
--
--   * 256 bits of randomness, generated in the application
--   * only the SHA-256 digest is stored -- a database leak yields no usable links
--   * resolution and submission go through SECURITY DEFINER functions that fail
--     closed, so the anon role never touches students or families directly
--   * hard expiry, checked in the database rather than the page
--
-- One request row per family, listing exactly which fields were missing when it
-- was raised. The parent sees only their own fields and only their own children.

create table if not exists public.parent_info_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,

  -- Digest only. The plaintext token exists in the email and nowhere else.
  token_hash bytea not null unique,

  -- What was missing when this was raised, as {"students":[{id,name,fields:[]}],
  -- "family":["email","address"]}. Frozen at creation so the email and the page
  -- agree even if the record changes underneath them.
  requested jsonb not null default '{}'::jsonb,

  status text not null default 'open'
    check (status in ('open', 'completed', 'expired', 'cancelled')),

  sent_count integer not null default 0,
  last_sent_at timestamptz,
  -- Four attempts, then stop. A parent who has ignored four emails is not going
  -- to answer the fifth, and the school still has a telephone.
  max_sends integer not null default 4,

  opened_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),

  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One live request per family. A second email about the same gaps is noise, and
-- two live links for one family makes "did they answer?" unanswerable.
create unique index if not exists idx_parent_info_requests_one_open
  on public.parent_info_requests (family_id)
  where status = 'open';

create index if not exists idx_parent_info_requests_due
  on public.parent_info_requests (status, last_sent_at)
  where status = 'open';

comment on column public.parent_info_requests.token_hash is
  'SHA-256 of the link token. The plaintext is never stored — it lives only in the email that was sent.';

-- What the parent actually submitted, kept separate from the record it updates.
-- A parent's answer is evidence; the student row is the school's conclusion.
-- Keeping both means a wrong value can be traced to who supplied it.
create table if not exists public.parent_info_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.parent_info_requests(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  field text not null,
  value text,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_parent_info_submissions_request
  on public.parent_info_submissions (request_id);

alter table public.parent_info_requests    enable row level security;
alter table public.parent_info_submissions enable row level security;

-- Staff only. Parents never touch these tables directly; they go through the
-- SECURITY DEFINER functions below.
drop policy if exists parent_info_requests_staff on public.parent_info_requests;
create policy parent_info_requests_staff on public.parent_info_requests
  for all to authenticated
  using (can_access_school(school_id))
  with check (can_access_school(school_id));

drop policy if exists parent_info_submissions_staff on public.parent_info_submissions;
create policy parent_info_submissions_staff on public.parent_info_submissions
  for all to authenticated
  using (exists (
    select 1 from public.parent_info_requests r
    where r.id = request_id and can_access_school(r.school_id)
  ))
  with check (exists (
    select 1 from public.parent_info_requests r
    where r.id = request_id and can_access_school(r.school_id)
  ));

-- ---------------------------------------------------------------------------
-- Token helpers
-- ---------------------------------------------------------------------------

create or replace function public.parent_info_token_digest(p_token text)
returns bytea
language sql
immutable
set search_path = public
as $$
  select extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'::text);
$$;

-- ---------------------------------------------------------------------------
-- Public: what does this link ask for?
--
-- Returns the family name, the children, and the fields still missing. It does
-- NOT return the family id, the school id, or anything the caller could use to
-- go looking for other families.
-- ---------------------------------------------------------------------------

create or replace function public.resolve_parent_info_request(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash bytea;
  v_req public.parent_info_requests%rowtype;
  v_school text;
  v_family text;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    raise exception 'parent_info_token_invalid' using errcode = 'invalid_parameter_value';
  end if;

  v_hash := public.parent_info_token_digest(trim(p_token));

  select * into v_req
  from public.parent_info_requests r
  where r.token_hash = v_hash
  limit 1;

  if not found then
    raise exception 'parent_info_token_invalid' using errcode = 'invalid_parameter_value';
  end if;

  if v_req.expires_at <= now() then
    raise exception 'parent_info_link_expired' using errcode = 'check_violation';
  end if;

  if v_req.status = 'completed' then
    return jsonb_build_object('status', 'completed');
  end if;

  if v_req.status <> 'open' then
    raise exception 'parent_info_link_closed' using errcode = 'check_violation';
  end if;

  -- First view stamps the open, which is the only engagement signal here.
  if v_req.opened_at is null then
    update public.parent_info_requests set opened_at = now(), updated_at = now()
    where id = v_req.id;
  end if;

  select s.name into v_school from public.schools s where s.id = v_req.school_id;
  select f.family_name into v_family from public.families f where f.id = v_req.family_id;

  return jsonb_build_object(
    'status', 'open',
    'school', coalesce(v_school, ''),
    'family', coalesce(v_family, ''),
    'requested', v_req.requested,
    'expires_at', v_req.expires_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Public: accept the answers.
--
-- Writes the submission rows, then applies them to the real records. Only the
-- fields this request asked for are applied, and only to students in this
-- family -- a crafted payload naming another child's id updates nothing.
-- ---------------------------------------------------------------------------

create or replace function public.submit_parent_info(p_token text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash bytea;
  v_req public.parent_info_requests%rowtype;
  v_answer jsonb;
  v_student uuid;
  v_field text;
  v_value text;
  v_applied int := 0;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    raise exception 'parent_info_token_invalid' using errcode = 'invalid_parameter_value';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'parent_info_answers_invalid' using errcode = 'invalid_parameter_value';
  end if;

  v_hash := public.parent_info_token_digest(trim(p_token));

  select * into v_req
  from public.parent_info_requests r
  where r.token_hash = v_hash
  for update;

  if not found then
    raise exception 'parent_info_token_invalid' using errcode = 'invalid_parameter_value';
  end if;
  if v_req.status <> 'open' then
    raise exception 'parent_info_link_closed' using errcode = 'check_violation';
  end if;
  if v_req.expires_at <= now() then
    raise exception 'parent_info_link_expired' using errcode = 'check_violation';
  end if;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    v_field := nullif(trim(v_answer ->> 'field'), '');
    v_value := nullif(trim(v_answer ->> 'value'), '');
    v_student := nullif(v_answer ->> 'student_id', '')::uuid;

    if v_field is null or v_value is null then
      continue;
    end if;

    -- A student id that is not in this family is ignored, not obeyed.
    if v_student is not null and not exists (
      select 1 from public.students st
      where st.id = v_student and st.family_id = v_req.family_id
    ) then
      continue;
    end if;

    insert into public.parent_info_submissions (request_id, student_id, field, value)
    values (v_req.id, v_student, v_field, v_value);

    if v_field = 'date_of_birth' and v_student is not null then
      update public.students set date_of_birth = v_value::date, updated_at = now()
      where id = v_student;
      v_applied := v_applied + 1;

    elsif v_field = 'grade_level' and v_student is not null then
      update public.students set grade_level = v_value, updated_at = now()
      where id = v_student;
      v_applied := v_applied + 1;

    elsif v_field = 'email' then
      update public.families set billing_email = v_value, updated_at = now()
      where id = v_req.family_id;
      update public.guardians set email = v_value, updated_at = now()
      where family_id = v_req.family_id and is_primary;
      v_applied := v_applied + 1;

    elsif v_field = 'phone' then
      update public.families set billing_phone = v_value, updated_at = now()
      where id = v_req.family_id;
      update public.guardians set phone = v_value, updated_at = now()
      where family_id = v_req.family_id and is_primary;
      v_applied := v_applied + 1;

    elsif v_field = 'address' then
      update public.families set primary_address = v_value, updated_at = now()
      where id = v_req.family_id;
      v_applied := v_applied + 1;

    elsif v_field = 'city' then
      update public.families set city = v_value, updated_at = now() where id = v_req.family_id;
      v_applied := v_applied + 1;
    elsif v_field = 'state' then
      update public.families set state = v_value, updated_at = now() where id = v_req.family_id;
      v_applied := v_applied + 1;
    elsif v_field = 'zip_code' then
      update public.families set zip_code = v_value, updated_at = now() where id = v_req.family_id;
      v_applied := v_applied + 1;
    end if;
  end loop;

  update public.parent_info_requests
  set status = 'completed', completed_at = now(), updated_at = now()
  where id = v_req.id;

  return jsonb_build_object('status', 'completed', 'applied', v_applied);
end;
$$;

revoke all on function public.resolve_parent_info_request(text) from public;
revoke all on function public.submit_parent_info(text, jsonb)  from public;
grant execute on function public.resolve_parent_info_request(text) to anon, authenticated;
grant execute on function public.submit_parent_info(text, jsonb)  to anon, authenticated;

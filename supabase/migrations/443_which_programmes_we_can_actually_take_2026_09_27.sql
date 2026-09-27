-- 443_which_programmes_we_can_actually_take_2026_09_27.sql
--
-- Where a programme is approved, and at which campus.
--
-- THE GAP THIS CLOSES, and the way it showed itself. Migration 438 recorded
-- 91 state programmes: what each one is, what it pays, what a family must
-- hand a school. It recorded nothing about whether The Academy Way can
-- accept that money. So on 27 September I read a researcher's note about
-- Arizona's participation rules and reported it to Jimmy as a live risk
-- against roughly $10,900 already received for one student.
--
-- Jimmy, 27 September 2026:
--
--   "az does not require a physical facility. the academy virtual and the
--    academy hs are already approved there. same thing in arkansas. both
--    approved there too."
--
-- The answer existed. It was in his head and in no column, so the platform
-- could not give it and I invented an alarm in the space where it should
-- have been. In February an admissions person looking at an Arizona family
-- will need that same answer and will not have Jimmy to hand.
--
-- ABSENCE MEANS UNKNOWN, NOT NO. This is the load-bearing rule of the table
-- and the reason `status` exists rather than a boolean. No row for a
-- programme and campus means nobody has recorded the position - it does NOT
-- mean we are barred. Reading a missing row as "not approved" would repeat
-- exactly the mistake this table is here to prevent, one layer down. Only a
-- row saying `not_approved` means not approved.
--
-- WHAT IS SEEDED. Four rows, and only four: the two programmes and two
-- campuses Jimmy named. Arizona has five programmes in the catalogue and
-- only `az_esa` is recorded here, because only the ESA was named. The four
-- Arizona tax-credit STO programmes are left unrecorded rather than assumed,
-- which is the rule above applied to my own seed.
--
-- WHAT THIS DOES NOT DO. It does not filter the admissions form. The
-- out-of-state question added in 439 still offers every programme in the
-- asking family's state. Wiring the form to this table - so a family is only
-- offered money we can take - is the obvious next step and is deliberately
-- not in this migration: it would change what a live form shows, and that is
-- Jimmy's call, not a side effect of adding a table.
--
-- Safe to re-run.

create table if not exists public.funding_program_approvals (
  id uuid primary key default gen_random_uuid(),

  program_code text not null
    references public.funding_program_catalog(program_code)
    on update cascade on delete cascade,

  school_id uuid not null
    references public.schools(id) on delete cascade,

  status text not null default 'approved'
    check (status in ('approved', 'pending', 'not_approved', 'withdrawn', 'expired')),

  approved_on date,
  expires_on  date,

  -- the identifier the state or its platform knows us by: a vendor number, a
  -- provider id, a ClassWallet or Odyssey vendor record. Not a credential.
  provider_reference text,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint funding_program_approvals_unique unique (program_code, school_id)
);

create index if not exists idx_funding_program_approvals_school
  on public.funding_program_approvals (school_id);
create index if not exists idx_funding_program_approvals_program
  on public.funding_program_approvals (program_code);

drop trigger if exists funding_program_approvals_set_updated_at
  on public.funding_program_approvals;
create trigger funding_program_approvals_set_updated_at
  before update on public.funding_program_approvals
  for each row execute function public.trigger_set_updated_at();

comment on table public.funding_program_approvals is
  'Whether The Academy Way can accept a given state programme at a given campus. NO ROW MEANS UNKNOWN, NOT NO - only status = not_approved means not approved.';
comment on column public.funding_program_approvals.status is
  'approved | pending | not_approved | withdrawn | expired. The absence of a row is none of these: it means nobody has recorded the position yet.';
comment on column public.funding_program_approvals.provider_reference is
  'The identifier the state or its payment platform knows this campus by - a vendor or provider number. Never a login or a credential.';

-- RLS follows state_funding_expected_payments and state_funding_received_payments:
-- school_id is NOT NULL here, so one policy covers read and write.
alter table public.funding_program_approvals enable row level security;

drop policy if exists funding_program_approvals_staff on public.funding_program_approvals;
create policy funding_program_approvals_staff on public.funding_program_approvals
for all using (can_access_school(school_id)) with check (can_access_school(school_id));

-- ── what Jimmy confirmed on 27 September ─────────────────────────────────────

do $$
declare
  v_virtual uuid;
  v_hs      uuid;
  v_n       int := 0;
begin
  select id into v_virtual from public.schools where lower(trim(name)) = 'the academy virtual';
  select id into v_hs      from public.schools where lower(trim(name)) = 'the academy hs';

  if v_virtual is null or v_hs is null then
    raise exception 'Could not resolve both campuses: virtual=%, hs=%', v_virtual, v_hs;
  end if;

  insert into public.funding_program_approvals
    (program_code, school_id, status, notes)
  select p.code, s.id, 'approved',
         'Confirmed by Jimmy, 27 September 2026. Approval date not recorded at the time.'
    from (values ('az_esa'), ('ar_efa')) as p(code)
    cross join (values (v_virtual), (v_hs)) as s(id)
  on conflict (program_code, school_id) do nothing;

  get diagnostics v_n = row_count;
  raise notice 'Recorded % approvals.', v_n;
end $$;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- 'approved'      : four rows - az_esa and ar_efa, each at Virtual and HS.
-- 'unrecorded, AZ and AR' : the four Arizona STO programmes. They are not
--                   "no" - nobody has said. If any of them is in fact
--                   approved, add a row rather than assuming from this one.

select 'approved'::text as finding,
       a.program_code as detail,
       s.name as detail_2
  from public.funding_program_approvals a
  join public.schools s on s.id = a.school_id
 where a.status = 'approved'

union all

select 'unrecorded, AZ and AR',
       c.program_code,
       c.program_name
  from public.funding_program_catalog c
 where c.state_code in ('AZ', 'AR')
   and not exists (select 1 from public.funding_program_approvals a
                    where a.program_code = c.program_code)

order by 1, 2, 3;

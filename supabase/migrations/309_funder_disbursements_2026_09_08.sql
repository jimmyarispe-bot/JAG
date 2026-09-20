-- 309_funder_disbursements_2026_09_08.sql
--
-- The layer underneath scholarship_awards / scholarship_receipts (migration
-- 254): the raw money that arrives from a state voucher portal, before anyone
-- has decided which JAG student it belongs to.
--
-- WHY THIS IS NOT JUST scholarship_receipts
--
-- A receipt in 254 hangs off an AWARD, and an award hangs off a student_id.
-- That is the right shape once a payment is understood. But a ClassWallet order
-- does not arrive understood. It arrives as:
--
--     35309739 | Areli Romero | AR EFA | $1,537.50 | Settled
--
-- A name and an amount. No student id, no award, and - this is the part that
-- caught us - NO RELIABLE SCHOOL EITHER. Two independent observations, from two
-- states, on 8 September:
--
--   * Arizona reports School = "N/A" on all 28 of its orders. No attribution.
--   * Arkansas reports School = "Friendship Lab School for Dyslexia" and
--     School = "Homeschool" - the FAMILY's declared school on file with the
--     state. Neither names an Academy. It is a family attribute wearing a
--     column name that invites you to trust it.
--
-- So the export cannot tell you which entity earned the money. What CAN is the
-- LOGIN: ClassWallet and Odyssey run one account per JAG entity per state, and
-- the export inherits the entity from whichever account produced it. That fact
-- lives entirely outside the file. Today it survives only as the word Jimmy
-- types into the filename at download time, and on 8 September two files
-- labelled for different entities came back byte-identical (MD5 87b72b14...)
-- because the account had not actually been switched. It was caught by checking
-- the totals, not by anything in the data.
--
-- funder_accounts below makes that mapping a row in the database instead of a
-- habit. Every disbursement points at an account, and the account carries the
-- school. That is the only path by which a dollar becomes The Academy Virtual's.
--
-- WHY student_id IS NULLABLE AND NOTHING AUTO-MATCHES
--
-- The export gives a name. Matching a name to a student is exactly the mistake
-- this codebase has already made twice: "Julian Oubre / Towa" became two
-- students, and the admissions import matcher put parents' names into seven
-- children's name fields. A name is not an identifier.
--
-- Worse, here we do not even know WHOSE name it is. ClassWallet calls the
-- column "User Name", which is the account holder - who may be the parent, and
-- in Arizona reads like a mix of both. So this table records the name AS
-- PRINTED, in payer_account_name, and leaves student_id null with
-- match_status = 'unmatched' until a human says otherwise. An unmatched
-- disbursement is still real money and still counts toward revenue; it simply
-- is not yet attached to a child.
--
-- No data is loaded here. 310 loads the 40 settled ClassWallet orders.
--
-- SAFE TO RE-RUN.

begin;

-- ---------------------------------------------------------------------------
-- 0. The five programs JAG is approved in that the catalog does not know about.
-- ---------------------------------------------------------------------------
-- The catalog had fl_esa, fl_step_up, ga_esa (Georgia Special Needs), and
-- ga_goal from migration 254. Everything below is new.
--
-- payment_schedule is written defensively. The column carries a check
-- constraint whose permitted values are not visible from here, and 'annual' is
-- the only value proven to pass it (254 used it). Each row therefore tries the
-- schedule that is actually true and falls back to 'annual' if the constraint
-- refuses, rather than failing the migration over a label. A NOTICE records
-- every fallback so it can be corrected once the constraint is known.

do $$
declare
  p record;
begin
  for p in
    select * from (values
      ('az_esa',      'Arizona Empowerment Scholarship Account', 'AZ', 'Arizona Department of Education',                   'monthly'),
      ('nc_esa_plus', 'North Carolina ESA+',                     'NC', 'North Carolina State Education Assistance Authority','monthly'),
      ('ar_efa',      'Arkansas Education Freedom Account',      'AR', 'Arkansas Department of Education',                  'monthly'),
      ('ga_promise',  'Georgia Promise Scholarship',             'GA', 'Georgia Education Savings Authority',               'quarterly'),
      ('tx_esa',      'Texas Education Savings Account',         'TX', 'Texas Comptroller of Public Accounts',              'quarterly')
    ) as t(code, name, st, agency, sched)
  loop
    begin
      insert into public.funding_program_catalog
        (program_code, program_name, state_code, funding_agency, payment_schedule, is_active)
      values (p.code, p.name, p.st, p.agency, p.sched, true)
      on conflict (program_code) do nothing;
    exception when check_violation then
      insert into public.funding_program_catalog
        (program_code, program_name, state_code, funding_agency, payment_schedule, is_active)
      values (p.code, p.name, p.st, p.agency, 'annual', true)
      on conflict (program_code) do nothing;
      raise notice 'funding_program_catalog: % fell back to payment_schedule=annual (constraint refused %)', p.code, p.sched;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 1. funder_accounts - the login, and therefore the entity.
-- ---------------------------------------------------------------------------
-- One row per (platform, program, JAG entity). This is the ONLY thing that
-- attributes a disbursement to a school. It is deliberately a table and not a
-- column on the disbursement, so that the mapping is stated once, reviewably,
-- rather than repeated 40 times and capable of disagreeing with itself.

create table if not exists public.funder_accounts (
  id            uuid primary key default gen_random_uuid(),

  platform      text not null
                  check (platform in ('classwallet','odyssey','ema','goal','gsns','other')),

  program_code  text not null
                  references public.funding_program_catalog(program_code),

  -- The JAG entity whose login this is. on delete restrict: losing a school row
  -- must never silently orphan settled money.
  school_id     uuid not null references public.schools(id) on delete restrict,

  -- What the account is called when you log into it. This is what should be
  -- checked ON SCREEN before an export is trusted.
  account_label text not null,

  is_active     boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (platform, program_code, school_id)
);

comment on table public.funder_accounts is
  'One portal login per JAG entity per program. The export file does not say which entity earned the money - the login does. This table is where that fact lives.';
comment on column public.funder_accounts.account_label is
  'The account name as shown in the portal. Verify this on screen before trusting an export: on 2026-09-08 two files labelled for different entities were byte-identical because the account had not been switched.';

-- ---------------------------------------------------------------------------
-- 2. funder_disbursements - money that actually moved.
-- ---------------------------------------------------------------------------

create table if not exists public.funder_disbursements (
  id                     uuid primary key default gen_random_uuid(),

  funder_account_id      uuid not null
                           references public.funder_accounts(id) on delete restrict,

  -- The portal's own order number. STABLE, and therefore the import key.
  external_order_id      text not null,

  -- Kept, but explicitly NOT a key. NC order 27528057 exported its transaction
  -- id as "2.5112E+14" - Excel coerced it to scientific notation on the way out
  -- and the real value is gone. A key that a spreadsheet can destroy is not a
  -- key.
  external_transaction_id text,
  external_invoice_ref    text,

  -- The name as PRINTED in the export, untouched. ClassWallet calls this
  -- "User Name" and it is the account holder, who may be the parent or the
  -- child. Recorded so a human can judge; never parsed.
  payer_account_name     text not null,

  -- The funder's own name for the funding round, normalised. Arizona exports
  -- both "Arizona - ESA" (hyphen) and "Arizona – ESA" (en dash) depending on
  -- the year; unnormalised they are two different funders.
  award_period           text not null,

  -- THE THREE AMOUNTS ARE NOT INTERCHANGEABLE.
  --   gross = what the state debited from the family's account
  --   fee   = what the platform kept
  --   net   = WHAT JAG ACTUALLY RECEIVED. This is revenue.
  -- The fee is state-specific: NC 2.50%, AZ 2.06%, AR 0%. Booking gross as
  -- revenue would have overstated ClassWallet by $1,404.39 as at 8 Sept 2026.
  gross_amount           numeric(12,2) not null check (gross_amount >= 0),
  fee_amount             numeric(12,2) not null default 0 check (fee_amount >= 0),
  net_amount             numeric(12,2) not null check (net_amount >= 0),

  approved_on            date,
  settled_on             date,

  status                 text not null default 'settled'
                           check (status in ('settled','pending','processing','returned','cancelled')),

  -- The school the FAMILY declared to the state. Recorded because it is in the
  -- file and because it is occasionally interesting ("Homeschool"), and named
  -- declared_ so that nobody mistakes it for JAG attribution. It is not.
  declared_school        text,

  -- Nullable, and it stays null until a person decides. See the header.
  student_id             uuid references public.students(id) on delete set null,
  match_status           text not null default 'unmatched'
                           check (match_status in ('unmatched','matched','ambiguous','not_a_student')),
  matched_by             uuid references public.users(id) on delete set null,
  matched_at             timestamptz,

  source_file            text,
  raw                    jsonb not null default '{}'::jsonb,
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  -- Re-importing an export must not book the money twice.
  unique (funder_account_id, external_order_id),

  -- Arithmetic guard. A mis-parsed amount - a dropped thousands comma, a
  -- currency symbol eaten - almost always breaks this identity, and it breaks
  -- it at INSERT time rather than three weeks later in a reconciliation.
  -- All 40 orders loaded by 310 satisfy it.
  constraint funder_disbursements_amounts_balance
    check (round(net_amount + fee_amount, 2) = round(gross_amount, 2)),

  -- A row cannot claim to be matched without saying to whom, and cannot name a
  -- student while claiming to be unmatched.
  constraint funder_disbursements_match_coherent
    check (
      (match_status = 'matched' and student_id is not null)
      or (match_status <> 'matched' and student_id is null)
    )
);

comment on table public.funder_disbursements is
  'Settled voucher payments as the portal reports them. net_amount is revenue; gross_amount is what the state debited the family. student_id is null until a human matches it - nothing here auto-matches on a name.';
comment on column public.funder_disbursements.net_amount is
  'What JAG received. Revenue. NOT gross_amount, which includes the platform fee.';
comment on column public.funder_disbursements.declared_school is
  'The school the FAMILY told the state. Not JAG attribution - that comes from funder_accounts.school_id via the login.';

create index if not exists funder_disbursements_account
  on public.funder_disbursements (funder_account_id, settled_on);
create index if not exists funder_disbursements_student
  on public.funder_disbursements (student_id) where student_id is not null;
create index if not exists funder_disbursements_unmatched
  on public.funder_disbursements (match_status) where match_status <> 'matched';
create index if not exists funder_disbursements_payer
  on public.funder_disbursements (payer_account_name);

-- ---------------------------------------------------------------------------
-- 3. The summary that makes a bad export visible.
-- ---------------------------------------------------------------------------

create or replace view public.funder_disbursement_summary
with (security_invoker = on) as
select
  fa.platform,
  fa.program_code,
  c.program_name,
  c.state_code,
  s.name                                             as school,
  fa.account_label,
  count(*)                                           as orders,
  count(distinct d.payer_account_name)               as payers,
  sum(d.net_amount)::numeric(12,2)                   as net_received,
  sum(d.fee_amount)::numeric(12,2)                   as platform_fees,
  sum(d.gross_amount)::numeric(12,2)                 as gross_debited,
  case when sum(d.gross_amount) > 0
       then round(sum(d.fee_amount) / sum(d.gross_amount) * 100, 3)
       end                                           as fee_pct,
  min(d.settled_on)                                  as first_settled,
  max(d.settled_on)                                  as last_settled,
  count(*) filter (where d.match_status <> 'matched') as unmatched_orders,
  sum(d.net_amount) filter (where d.match_status <> 'matched')::numeric(12,2)
                                                     as unmatched_net
from public.funder_disbursements d
join public.funder_accounts fa on fa.id = d.funder_account_id
join public.funding_program_catalog c on c.program_code = fa.program_code
join public.schools s on s.id = fa.school_id
group by fa.platform, fa.program_code, c.program_name, c.state_code,
         s.name, fa.account_label;

comment on view public.funder_disbursement_summary is
  'Per portal account: what came in, what the platform kept, and how much is still unattached to a student.';

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
-- Both USING and WITH CHECK on every policy. An UPDATE policy with only USING
-- matches zero rows and reports success - migration 235's schools bug.

alter table public.funder_accounts      enable row level security;
alter table public.funder_disbursements enable row level security;

drop policy if exists funder_accounts_staff on public.funder_accounts;
create policy funder_accounts_staff on public.funder_accounts
  for all
  using (can_access_school(school_id))
  with check (can_access_school(school_id));

drop policy if exists funder_disbursements_staff on public.funder_disbursements;
create policy funder_disbursements_staff on public.funder_disbursements
  for all
  using (
    exists (
      select 1 from public.funder_accounts fa
      where fa.id = funder_disbursements.funder_account_id
        and can_access_school(fa.school_id)
    )
  )
  with check (
    exists (
      select 1 from public.funder_accounts fa
      where fa.id = funder_disbursements.funder_account_id
        and can_access_school(fa.school_id)
    )
  );

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification. Expect 9 catalog rows (4 pre-existing + 5 new) and 0
-- disbursements - 310 loads those.
-- ---------------------------------------------------------------------------

select program_code, program_name, state_code, payment_schedule
from public.funding_program_catalog
order by state_code, program_code;

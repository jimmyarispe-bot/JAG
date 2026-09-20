-- 291_application_fee_2026_09_06.sql
--
-- Record the $100 admissions application fee.
--
-- All four applications (FL, GA, HS, Virtual) collect $100 through Square at
-- submission. No table in the database has an application-fee column -- I checked
-- all 454 -- so today the only record that a family paid is inside Square.
--
-- The fee is one-per-application, so it lives on admissions_applications rather
-- than in a table of its own. Money is integer cents, as everywhere else.
--
-- ON THE BACKFILL. Existing applications get status 'unknown', not 'unpaid'.
-- We do not know whether those families paid -- the record is in Square and has
-- never been reconciled. Defaulting them to 'unpaid' would assert something
-- false about real families and would show up as a list of people to chase.
-- 'unknown' is the honest state and it is visibly different from a new
-- application that genuinely has not paid yet.

begin;

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------

alter table public.admissions_applications
  add column if not exists application_fee_cents integer not null default 10000,
  add column if not exists application_fee_status text not null default 'unpaid',
  add column if not exists application_fee_paid_at timestamptz,
  add column if not exists application_fee_reference text,
  add column if not exists application_fee_waived_by_user_id uuid,
  add column if not exists application_fee_waiver_reason text;

comment on column public.admissions_applications.application_fee_cents is
  'Application fee in integer cents. $100 = 10000. Stored per application so a '
  'change to the published fee does not rewrite history.';
comment on column public.admissions_applications.application_fee_status is
  'unknown = predates this column; the true state lives in Square and has not been '
  'reconciled. unpaid | paid | waived.';
comment on column public.admissions_applications.application_fee_reference is
  'Square payment or invoice id, once a live Square read exists. Free text until '
  'then so staff can paste a reference by hand.';

-- ---------------------------------------------------------------------------
-- 2. Backfill: everything that already exists is 'unknown'
--    Every row present inside this transaction predates the column.
-- ---------------------------------------------------------------------------

update public.admissions_applications
   set application_fee_status = 'unknown'
 where application_fee_status = 'unpaid';

-- ---------------------------------------------------------------------------
-- 3. Constraints -- added AFTER the backfill, or the update above would fail
--    against its own rule.
-- ---------------------------------------------------------------------------

alter table public.admissions_applications
  drop constraint if exists admissions_applications_fee_cents_nonneg;
alter table public.admissions_applications
  add constraint admissions_applications_fee_cents_nonneg
  check (application_fee_cents >= 0);

alter table public.admissions_applications
  drop constraint if exists admissions_applications_fee_status_valid;
alter table public.admissions_applications
  add constraint admissions_applications_fee_status_valid
  check (application_fee_status in ('unknown', 'unpaid', 'paid', 'waived'));

-- The status and its supporting fields must agree. A row marked paid with no
-- timestamp, or waived with nobody's name on it, is the kind of row that turns
-- into an argument with a parent eighteen months later.
alter table public.admissions_applications
  drop constraint if exists admissions_applications_fee_status_coherent;
alter table public.admissions_applications
  add constraint admissions_applications_fee_status_coherent
  check (
    (application_fee_status = 'paid'
       and application_fee_paid_at is not null
       and application_fee_waived_by_user_id is null
       and application_fee_waiver_reason is null)
    or
    (application_fee_status = 'waived'
       and application_fee_waived_by_user_id is not null
       and application_fee_waiver_reason is not null
       and application_fee_paid_at is null)
    or
    (application_fee_status in ('unknown', 'unpaid')
       and application_fee_paid_at is null
       and application_fee_waived_by_user_id is null
       and application_fee_waiver_reason is null)
  );

-- Waivers point at a real person. No cascade: if the user record goes, the
-- waiver still happened and we keep the fact.
alter table public.admissions_applications
  drop constraint if exists admissions_applications_fee_waived_by_fk;
alter table public.admissions_applications
  add constraint admissions_applications_fee_waived_by_fk
  foreign key (application_fee_waived_by_user_id)
  references auth.users(id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- 4. Index -- the only question anyone asks of this column is "who owes us?"
-- ---------------------------------------------------------------------------

create index if not exists admissions_applications_fee_outstanding_idx
  on public.admissions_applications (application_fee_status, application_date)
  where application_fee_status in ('unknown', 'unpaid');

-- ---------------------------------------------------------------------------
-- 5. Report. RLS first -- new columns inherit the table's existing policies,
--    so if the table has no RLS these columns have none either, and that is
--    worth seeing rather than assuming.
-- ---------------------------------------------------------------------------

do $$
declare
  v_rls      boolean;
  v_policies integer;
  v_unknown  integer;
  v_unpaid   integer;
  v_paid     integer;
  v_waived   integer;
  v_total    integer;
begin
  select c.relrowsecurity into v_rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'admissions_applications';

  select count(*) into v_policies
    from pg_policies
   where schemaname = 'public' and tablename = 'admissions_applications';

  select
    count(*) filter (where application_fee_status = 'unknown'),
    count(*) filter (where application_fee_status = 'unpaid'),
    count(*) filter (where application_fee_status = 'paid'),
    count(*) filter (where application_fee_status = 'waived'),
    count(*)
  into v_unknown, v_unpaid, v_paid, v_waived, v_total
  from public.admissions_applications;

  raise notice '--- 291 application fee ---';
  raise notice 'RLS enabled on admissions_applications: %  (policies: %)',
    coalesce(v_rls, false), v_policies;
  if not coalesce(v_rls, false) then
    raise notice '  !! RLS IS OFF. The new columns are as exposed as the rest of';
    raise notice '  !! this table. That is a pre-existing condition, not something';
    raise notice '  !! 291 caused -- but do not treat these columns as protected.';
  end if;
  raise notice 'applications total: %', v_total;
  raise notice '  unknown (predate this column, true state in Square): %', v_unknown;
  raise notice '  unpaid: %   paid: %   waived: %', v_unpaid, v_paid, v_waived;
  raise notice 'default fee for new applications: $%',
    to_char(10000 / 100.0, 'FM999990.00');
end $$;

commit;

-- ---------------------------------------------------------------------------
-- WHAT THIS DOES NOT DO
--
-- 1. It does not reconcile anything. Every existing application is 'unknown'
--    until either a live Square read fills them in or someone works through the
--    Square history by hand. The column is now there to hold the answer; it does
--    not know the answer.
--
-- 2. It does not collect the fee. The four web forms still take the $100 through
--    Square directly. Nothing writes to these columns yet -- staff set them by
--    hand, or a future Square sync sets them.
--
-- 3. It does not assume $100 stays $100. The amount is stored per application,
--    so raising the published fee next year leaves this year's records intact.
-- ---------------------------------------------------------------------------

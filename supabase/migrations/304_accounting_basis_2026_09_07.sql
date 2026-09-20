-- 304_accounting_basis_2026_09_07.sql
--
-- Adds accounting_method to fi_quickbooks_financials, and puts it in the key.
--
-- WHY. The 2025 sync was compared against the filed 1120-S and produced this:
--
--     interest    36,013 QBO   vs   35,984 return   -- $29 apart
--     labour     765,624 QBO   vs  755,939 return   -- 1.3% apart
--     income     863,595 QBO   vs 1,618,795 return  -- 47% apart
--
-- Two figures reconciling almost exactly while revenue is off by half is not a
-- parsing failure. It is the signature of an ACCOUNTING BASIS difference:
-- payroll and interest land in the same period either way, tuition revenue and
-- prepaid expenses do not.
--
-- Form 1120-S, Schedule B, line 1 for this entity: [X] Cash. The sync had
-- `accounting_method: "Accrual"` hardcoded. Neither is wrong -- they answer
-- different questions -- but a stored figure that does not say which one it
-- answers is a number with no meaning, and this table already exists because
-- of numbers with no meaning.
--
-- SO IT GOES IN THE UNIQUE KEY. A period's cash-basis figures and its
-- accrual-basis figures are different facts about the same period and must be
-- able to coexist. Keying on (connection_id, period_start, period_end) alone
-- would have made the second sync silently overwrite the first, and the row
-- would then be whichever basis was requested last -- unknowable after the fact.
--
-- Existing rows were all fetched on Accrual, which is why that is the default.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

alter table public.fi_quickbooks_financials
  add column if not exists accounting_method text not null default 'Accrual';

alter table public.fi_quickbooks_financials
  drop constraint if exists fi_qbo_fin_method_valid;
alter table public.fi_quickbooks_financials
  add constraint fi_qbo_fin_method_valid
  check (accounting_method in ('Cash', 'Accrual'));

alter table public.fi_quickbooks_financials
  drop constraint if exists fi_qbo_fin_unique;
alter table public.fi_quickbooks_financials
  add constraint fi_qbo_fin_unique
  unique (connection_id, period_start, period_end, accounting_method);

comment on column public.fi_quickbooks_financials.accounting_method is
  'Basis the figures were fetched on. The Academy Way Network files its 1120-S '
  'on CASH basis (Schedule B line 1), so cash-basis rows are the ones that '
  'reconcile to the return. Accrual rows match tuition to the period taught. '
  'Both are legitimate; neither is meaningful without this column.';

commit;

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------

select
  coalesce(s.name, 'Network')   as entity,
  f.period_start,
  f.period_end,
  f.accounting_method,
  f.total_income,
  f.total_expenses,
  f.net_income,
  f.labor_expense
from public.fi_quickbooks_financials f
left join public.schools s on s.id = f.school_id
order by f.period_start, f.accounting_method, f.total_income desc nulls last;

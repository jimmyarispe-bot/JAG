-- 303_labor_expense_rename_2026_09_07.sql
--
-- Renames fi_quickbooks_financials.payroll_expense -> labor_expense.
--
-- WHY, from the books themselves. The Academy HS's chart of accounts:
--
--     66000 Payroll Expenses                     (section)
--       66100 Payroll Wages                      (section)
--         66150 Independent Contractor Payment   45,561.95
--
-- HS and The Academy Virtual do not run a W-2 payroll. They pay independent
-- contractors by Zelle. That single account is 94% of HS's total expenses --
-- and the first sync reported its payroll as NULL, because the leaf carries no
-- payroll word and the matcher only read leaf names.
--
-- "Payroll" named an EMPLOYMENT ARRANGEMENT. The figure the platform actually
-- needs is a COST: what it costs to put a teacher in front of a student. A
-- contractor teaching a class and an employee teaching a class are the same
-- expense for cost-per-student, for margin, and for EBITDA. Two of four schools
-- would have been permanently mislabelled by the old name, and the column would
-- have quietly meant something different per entity.
--
-- Rename now, with five rows in the table, rather than after anything reads it.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

alter table public.fi_quickbooks_financials
  rename column payroll_expense to labor_expense;

comment on column public.fi_quickbooks_financials.labor_expense is
  'Total cost of labour for the period: W-2 payroll AND 1099 / independent '
  'contractor payments. The Academy HS and The Academy Virtual run entirely on '
  'contractors, so a payroll-only figure would read NULL for them. NULL still '
  'means no labour account was found -- which is a finding, not a zero.';

commit;

-- ---------------------------------------------------------------------------
-- Report. labor_expense is still whatever the FIRST sync stored, which found
-- payroll only. Re-run the sync route after deploying the parser change and
-- these numbers should change for HS and Virtual specifically.
-- ---------------------------------------------------------------------------

select
  coalesce(s.name, 'Network')              as entity,
  f.total_income,
  f.total_expenses,
  f.net_income,
  f.labor_expense,
  case
    when f.labor_expense is null then 'NOT FOUND - expect this to fill in'
    when f.total_expenses is null or f.total_expenses = 0 then 'n/a'
    else round(f.labor_expense / f.total_expenses * 100, 1)::text || '% of expenses'
  end                                      as labour_share,
  f.cash_balance,
  f.fetched_at
from public.fi_quickbooks_financials f
left join public.schools s on s.id = f.school_id
order by f.total_income desc nulls last;

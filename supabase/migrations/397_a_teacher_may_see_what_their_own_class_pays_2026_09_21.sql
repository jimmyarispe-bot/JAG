-- 397_a_teacher_may_see_what_their_own_class_pays_2026_09_21.sql
--
-- TWO RULES OF MINE THAT CONTRADICTED EACH OTHER, TWO DAYS APART.
--
-- Migration 376, 19 September, following Jimmy's standing rule - "only danni n
-- me see anything related to money" - locked class_pay_rates to finance.view
-- and FOUNDER.
--
-- The design of 20 September then said a teacher must see what their week pays
-- BEFORE they submit it, because "they cannot verify a number they are not
-- allowed to see". Both are mine. They cannot both stand.
--
-- HOW THE TEST FOUND IT
--
-- A synthetic teacher signed in on 21 September and saw five classes reading
-- "0 on roster", "no agreed rate" and $0.00 - with the rate sitting in the
-- table, correct, and invisible to her. computeClassPay runs with the
-- TEACHER'S OWN client, so RLS returned no rates, no error, and the class was
-- skipped. Zero rows, no error: the house pattern, in the code path that
-- decides what somebody is paid.
--
-- It would have hit all eleven teachers on Friday, and worse than cosmetically:
-- submitWeekAction REFUSES a week containing unrated classes, so nobody could
-- have submitted anything at all.
--
-- THE RESOLUTION, AND WHY IT DOES NOT BREAK THE MONEY RULE
--
-- A teacher may read a rate only when BOTH are true:
--
--   1. it applies to a course THEY teach, and
--   2. it is the course's network rate, or a personal rate that is THEIRS.
--
-- So a teacher sees what they earn for their own classes. They do not see the
-- network's money, they do not see another teacher's rate - Craig's $30 with
-- Ivy stays Craig's - and they gain nothing about tuition, the ledger, or what
-- anybody else is paid. The money rule was about the network's finances. What a
-- person is paid for their own work is not somebody else's business kept from
-- them; it is the number they are being asked to verify.

begin;

drop policy if exists class_pay_rates_read on public.class_pay_rates;

create policy class_pay_rates_read on public.class_pay_rates
  for select using (
    has_permission('finance.view')
    or has_role('FOUNDER')
    or (
      -- Their own rate, or the rate anybody teaching this course gets.
      (class_pay_rates.employee_id is null
        or public.is_self_employee(class_pay_rates.employee_id))
      -- And only for a course they actually teach.
      and exists (
        select 1
          from public.course_sections cs
          join public.employees e on e.id = cs.instructor_employee_id
         where cs.course_id = class_pay_rates.course_id
           and e.user_id = auth.uid()
      )
    )
  );

-- The write side is UNCHANGED and stays finance/FOUNDER only. A teacher may
-- read what they are paid. Nobody but finance may decide it.

commit;

-- =========================================================================
-- THE REPORT
--
-- The policy cannot be tested from here - this editor runs as the service
-- role, which bypasses RLS entirely, so everything looks readable no matter
-- what the policy says. THE ONLY REAL TEST IS THE TEACHER'S OWN SCREEN.
--
-- Reload https://theacademyway.thejag.org/dashboard/teacher/timesheets as the
-- test teacher. Four classes should read "2 on roster" and $25.00, and the
-- Monday one should still say "not paid" because it is marked not held.
-- =========================================================================

select
  'policy replaced'                                  as fact,
  (select count(*)::text from pg_policies
    where tablename = 'class_pay_rates'
      and policyname = 'class_pay_rates_read')       as value
union all
select
  'rates this policy now covers',
  (select count(*)::text from public.class_pay_rates)
union all
select
  'write access still finance/FOUNDER only',
  case when exists (select 1 from pg_policies
                     where tablename = 'class_pay_rates'
                       and policyname = 'class_pay_rates_write')
       then 'yes' else 'MISSING' end;

/*
  IS THERE ANYTHING TO PREFILL — read-only. Nothing here writes.

  Corrected: admissions_interest_answers has no lead_id. Answers hang off
  admissions_interest_submissions, and THAT carries the lead - which
  carry-forward.ts states in its own header. Everything below joins through
  the submission.

  THE QUESTION. Prefilling the campus application only helps a family who
  actually filled in the inquiry form. A lead created by the Monday board
  import on 10 Sep never went through /apply, so it has no answers at all, and
  a prefill built for it produces an empty form under an invitation promising
  "you will not need to repeat anything you already told us".

  WHAT EMPTY MEANS, decided before running it:

  1. jayden       — zero means Lisa Roy never filled in the inquiry form and
                    there is nothing of hers to carry forward. Rows mean her
                    answers are there and the form simply does not read them.
  2. the 27 gates — of the families waiting on a decision, how many have
                    inquiry answers. This decides whether prefill is worth
                    doing first or only helps families arriving in future.
  3. everyone     — the same split across all leads, for scale.
*/

select
  '1. jayden' as check,
  'answers on this lead' as detail,
  count(a.*)::text as extra
from public.admissions_interest_submissions s
left join public.admissions_interest_answers a on a.submission_id = s.id
where s.lead_id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'

union all

select
  '2. the 27 gates',
  case when exists (
    select 1
    from public.admissions_interest_submissions s
    where s.lead_id = l.id
  ) then 'HAS an inquiry submission' else 'none - nothing to prefill' end,
  count(*)::text || ' lead(s) awaiting a decision'
from public.admissions_decision_gates g
join public.admissions_leads l on l.id = g.lead_id
where g.status = 'pending'
group by 2

union all

select
  '3. everyone',
  case when exists (
    select 1
    from public.admissions_interest_submissions s
    where s.lead_id = l.id
  ) then 'HAS an inquiry submission' else 'none' end,
  count(*)::text || ' of ' || (select count(*) from public.admissions_leads)::text || ' leads'
from public.admissions_leads l
group by 2

order by 1, 2;

/*
  WHO IS SITTING IN DOCUMENTS PENDING AND COMMITTEE REVIEW — 2026-09-24
  Read-only. Nothing here writes.

  WHY. Jimmy: "i have no idea what those are or where those came from... we
  don't have a committee so where did that come from." Both columns are coming
  off the board. Before removing a column I have to know whether anyone is
  standing in it, because removing it would make those families invisible.

  The board's "Documents Pending" column is lead_stage = 'records_requested'.
  The board's "Committee Review" column is lead_stage = 'admissions_review'.
  Those are the legacy values the registry maps to those two labels.

  WHAT EMPTY MEANS, decided before running it:

  1 and 2 — ZERO ROWS IS THE GOOD ANSWER. It means nobody is in that column and
            removing it strands no one. Any rows at all means those families
            need moving to a real stage first, and I must not remove the column
            until they have been.
  3       — the full count by stage, so the two answers above can be read
            against the whole pipeline rather than trusted on their own. A
            stage missing from this list simply has nobody in it.
*/

select
  '1. documents pending' as check,
  coalesce(first_name, '') || ' ' || coalesce(last_name, '') as detail,
  'id=' || id::text || ' | since ' || coalesce(stage_entered_at::text, 'unknown') as extra
from public.admissions_leads
where lead_stage = 'records_requested'

union all

select
  '2. committee review',
  coalesce(first_name, '') || ' ' || coalesce(last_name, ''),
  'id=' || id::text || ' | since ' || coalesce(stage_entered_at::text, 'unknown')
from public.admissions_leads
where lead_stage = 'admissions_review'

union all

select
  '3. every stage, counted',
  coalesce(lead_stage, 'NO STAGE SET'),
  count(*)::text || ' families'
from public.admissions_leads
group by lead_stage

order by 1, 2;

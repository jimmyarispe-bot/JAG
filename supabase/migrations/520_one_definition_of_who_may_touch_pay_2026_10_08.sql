-- ==========================================================================
-- 520 — ONE DEFINITION OF WHO MAY TOUCH PAY
--
-- 8 October 2026. Run after 519. The last statement verifies.
--
-- ── WHAT I GOT WRONG IN 519, AN HOUR AGO ──────────────────────────────────
--
-- set_teacher_week_override decides who may use it like this:
--
--     has_role('FOUNDER') or has_role('EXECUTIVE_DIRECTOR')
--
-- which is correct today and is a SECOND DEFINITION of a question this
-- build already answers in one place. Migration 462 created
-- may_adaminister_teacher_pay(), and approve_teacher_week and
-- reopen_teacher_week both call it. payroll-actions.ts says why, in its
-- own words:
--
--     "WHO IS ALLOWED IS NOT DECIDED HERE. approve_teacher_week and
--      reopen_teacher_week check may_administer_teacher_pay() inside
--      themselves, because security definer runs past row-level security
--      and a check around a function is not a check."
--
-- I wrote a third check beside those two. Add a role to the payroll
-- administrators tomorrow and they could approve a week and not correct
-- one, or the reverse, and nothing would say which was intended.
--
-- This is the same fault as the two found earlier today and it is worth
-- naming plainly, because it took me one hour to repeat it:
--
--   Danni Treu's calendar was invisible for five days because the JAG held
--   danni.treu@theacademyfl.org and Google answered to
--   danni.treu@theacademyway.org.
--
--   Cassandra Manghum's name is spelled two ways in two tables, and the
--   email on her HR record would bounce.
--
-- One fact, one place. This migration makes the override obey the same
-- predicate as approving and reopening, so there is one answer to "who may
-- touch a teacher's pay" and changing it changes all three.
--
-- NOTHING ELSE CHANGES. The columns, the policy and the signature from 519
-- stand. Only the gate is replaced.
--
-- Idempotent. Safe to re-run.
-- ==========================================================================

begin;

create or replace function public.set_teacher_week_override(
  p_week_id uuid,
  p_cents   integer,
  p_reason  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  /*
   * THE SAME PREDICATE approve_teacher_week AND reopen_teacher_week USE.
   * Checked inside the function, not around it: security definer runs past
   * row-level security, so a check anywhere else is not a check.
   */
  if not coalesce(public.may_administer_teacher_pay(), false) then
    raise exception
      'Only the people who administer teacher pay may set a different amount.';
  end if;

  /* Clearing it is allowed and needs no reason: going back to what the JAG
     computed is not a decision that needs defending. Setting one is. */
  if p_cents is null then
    update public.teacher_weeks
    set override_total_cents = null,
        override_reason      = null,
        override_by          = null,
        override_at          = null,
        updated_at           = now()
    where id = p_week_id;

    if not found then
      raise exception 'That week could not be found.';
    end if;
    return;
  end if;

  if p_cents < 0 then
    raise exception 'A week cannot pay a negative amount.';
  end if;

  if coalesce(trim(p_reason), '') = '' then
    raise exception
      'Say why the amount is different. A figure somebody changed with no '
      'reason on it is indistinguishable from a fault six weeks later.';
  end if;

  update public.teacher_weeks
  set override_total_cents = p_cents,
      override_reason      = trim(p_reason),
      override_by          = v_actor,
      override_at          = now(),
      updated_at           = now()
  where id = p_week_id;

  if not found then
    raise exception 'That week could not be found.';
  end if;
end;
$$;

revoke all on function public.set_teacher_week_override(uuid, integer, text) from public;
grant execute on function public.set_teacher_week_override(uuid, integer, text) to authenticated;

comment on function public.set_teacher_week_override(uuid, integer, text) is
  'Paysheet change 4 of 6, 8 October 2026. Jimmy or Danni set what a week '
  'actually pays when it differs from the computed figure, BESIDE the '
  'computed figure and never instead of it. Gated on '
  'may_administer_teacher_pay() - the same predicate approve_teacher_week '
  'and reopen_teacher_week use, so there is one answer to who may touch a '
  'teacher''s pay. 519 wrote its own role check here; 520 removed it.';

-- ASSERT: the function no longer carries its own role list ------------------
do $$
declare
  body text;
begin
  select pg_get_functiondef(p.oid) into body
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'set_teacher_week_override';

  if body is null then
    raise exception '520: set_teacher_week_override is missing';
  end if;

  if body not like '%may_administer_teacher_pay%' then
    raise exception '520: the function does not call may_administer_teacher_pay';
  end if;

  if body like '%EXECUTIVE_DIRECTOR%' then
    raise exception '520: the old role list is still in the function body';
  end if;
end $$;

commit;

-- ── SEE IT DONE ──────────────────────────────────────────────────────────
-- All three money functions, and the predicate each one gates on. They
-- should now read the same.
select
  p.proname                                                   as function_name,
  case when p.prosecdef then 'security definer' else 'invoker' end as runs_as,
  case
    when pg_get_functiondef(p.oid) like '%may_administer_teacher_pay%'
      then 'may_administer_teacher_pay()'
    when pg_get_functiondef(p.oid) like '%has_role%'
      then 'ITS OWN ROLE LIST — second definition'
    else '(no gate found)'
  end                                                         as gated_on
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'set_teacher_week_override',
    'approve_teacher_week',
    'reopen_teacher_week'
  )
order by p.proname;

-- WAIVE JAYDEN ROY'S $100 APPLICATION FEE
--
-- Jimmy, 29 September 2026: "waive jayden's fee."
--
-- WHY HE IS NOT BEING CHARGED. Jayden was accepted on 25 September. The rule
-- that an application cannot be submitted until the $100 is paid shipped on
-- 28 September (commit 55e52ec3). His record predates it: application_status
-- is already 'accepted' while submitted_at is null and the fee is unpaid. He
-- was accepted under the previous process, so charging him now would be
-- applying a rule backwards to a family who already has their answer.
--
-- WHY THIS IS SQL AND NOT A BUTTON. waiveApplicationFee() exists and is gated
-- on APPLICATION_FEE_WAIVER, which only the Founder holds - but nothing
-- renders it yet. There is no screen in the JAG from which a fee can be
-- waived. That gap is worth closing; until it is, this file is the mechanism.
--
-- WHAT THIS DOES NOT DO, AND YOU SHOULD KNOW IT. The server action writes a
-- platform audit row recording who waived and why. This does not - it writes
-- only the columns on the application. The waiver reason below is therefore
-- the whole record of this decision, so it is written to be read by somebody
-- in eighteen months who was not here.
--
-- Guarded three ways. It refuses rather than guesses:
--   - the application must be Jayden's, by id
--   - it must not already be paid (waiving a paid fee is a refund, and this
--     system has no refund path)
--   - Jimmy's user id must resolve, or nobody's name goes on the decision
--
-- Safe to re-run: a second run finds it already waived and changes nothing.

begin;

do $$
declare
  v_app_id  uuid := '39eef219-d91d-459b-8f56-ac18766b1d09';
  v_user_id uuid;
  v_status  text;
  v_child   text;
  v_reason  text :=
    'Accepted 25 September 2026 under the previous admissions process, before '
    'the $100 submission gate shipped on 28 September 2026 (commit 55e52ec3). '
    'His application was accepted while still unsubmitted and unpaid, so the '
    'fee would be a rule applied backwards to a family who already has their '
    'answer. Waived by Jimmy Arispe, 29 September 2026.';
begin

  -- Jimmy, by his network address. 291 requires a real user on a waiver.
  select id into v_user_id
    from auth.users
   where lower(email) in ('jimmy.arispe@theacademyway.org', 'jimmy.arispe@gmail.com')
   order by (lower(email) = 'jimmy.arispe@theacademyway.org') desc
   limit 1;

  if v_user_id is null then
    raise exception
      'Could not find Jimmy''s user account, so nobody''s name would be on this '
      'waiver. Nothing changed.';
  end if;

  select a.application_fee_status,
         l.first_name || ' ' || l.last_name
    into v_status, v_child
    from public.admissions_applications a
    join public.admissions_leads l on l.id = a.lead_id
   where a.id = v_app_id;

  if v_status is null then
    raise exception 'No application with id %. Nothing changed.', v_app_id;
  end if;

  if v_child not ilike '%jayden%roy%' then
    raise exception
      'That application belongs to %, not Jayden Roy. Nothing changed.', v_child;
  end if;

  if v_status = 'paid' then
    raise exception
      'That fee is already PAID. Waiving it would not return the money - that '
      'is a refund, and refunds are not handled here. Nothing changed.';
  end if;

  if v_status = 'waived' then
    raise notice 'Already waived. Nothing changed.';
    return;
  end if;

  update public.admissions_applications
     set application_fee_status         = 'waived',
         application_fee_waived_by_user_id = v_user_id,
         application_fee_waiver_reason   = v_reason,
         -- 291's coherence constraint: a waived row cannot also claim money
         -- arrived.
         application_fee_paid_at         = null
   where id = v_app_id;

  raise notice 'Waived the $100 application fee for %.', v_child;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect one row: waived, with Jimmy's address and the reason on it.

select l.first_name || ' ' || l.last_name as child,
       s.name        as campus,
       a.application_fee_status,
       u.email       as waived_by,
       a.application_fee_paid_at,
       left(a.application_fee_waiver_reason, 120) as reason_starts
  from public.admissions_applications a
  join public.admissions_leads l on l.id = a.lead_id
  left join public.schools s on s.id = l.school_id
  left join auth.users u on u.id = a.application_fee_waived_by_user_id
 where a.id = '39eef219-d91d-459b-8f56-ac18766b1d09';

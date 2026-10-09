-- MOVE NINA OFF A DOMAIN THAT DOES NOT DELIVER
--
-- 30 September 2026. Four staff emails have failed and every one of them
-- went to nina.gaddy@theacademyga.org - three decision-gate requests between
-- 17 and 22 September, and one acceptance notification on the 25th. Heather,
-- on theacademyway.org, has no failures. Two of those four are the reason
-- Nina was asked to decide on Jayden Roy twice and never saw either request.
--
-- THIS IS THE FAST FIX, NOT THE RIGHT ONE. The right fix is verifying
-- theacademyga.org in Resend so mail from her own school's domain works.
-- That takes DNS records and up to 72 hours. This moves her to a domain that
-- is already delivering, today, so Georgia is not blind while that happens.
-- Move her back afterwards if you want her on the GA domain.
--
-- ═══════════════════════════════════════════════════════════════════════
--   EDIT THE LINE BELOW BEFORE RUNNING. Put Nina's real theacademyway.org
--   mailbox there - one that EXISTS. I have not invented an address, and
--   this file refuses to run until somebody who knows has typed one in.
-- ═══════════════════════════════════════════════════════════════════════

begin;

do $$
declare
  v_new  text := 'PUT_NINAS_REAL_ADDRESS_HERE';
  v_old  text := 'nina.gaddy@theacademyga.org';
  v_ga   uuid;
  v_n    integer;
begin

  if v_new = 'PUT_NINAS_REAL_ADDRESS_HERE' then
    raise exception
      'Nina''s new address has not been filled in. Open this file, replace '
      'PUT_NINAS_REAL_ADDRESS_HERE with her real mailbox, and run it again. '
      'Nothing changed.';
  end if;

  if v_new not ilike '%@theacademyway.org' then
    raise exception
      'The new address (%) is not on theacademyway.org - the only domain '
      'observed to deliver. If that is deliberate, edit this check out. '
      'Nothing changed.', v_new;
  end if;

  select id into v_ga from public.schools where name = 'The Academy GA';
  if v_ga is null then
    raise exception 'No school named exactly "The Academy GA". Nothing changed.';
  end if;

  -- ---------------------------------------------------------------------
  -- 1. The contacts table, which is what the engine reads now.
  -- ---------------------------------------------------------------------
  update public.school_admissions_contacts
     set email = v_new, updated_at = now()
   where school_id = v_ga and lower(email) = lower(v_old);
  get diagnostics v_n = row_count;

  if v_n = 0 then
    raise notice
      'No contacts row matched % at The Academy GA. Check the verify below '
      'before assuming this worked.', v_old;
  end if;

  -- ---------------------------------------------------------------------
  -- 2. The school's own column, kept in step. It is the fallback when the
  --    contacts table is empty, AND the reply-to on every resent
  --    communication - so leaving it stale would put a dead address on
  --    mail that tells a family to reply to it.
  -- ---------------------------------------------------------------------
  update public.schools
     set admissions_contact_email = v_new
   where id = v_ga and lower(coalesce(admissions_contact_email, '')) = lower(v_old);

  raise notice 'Nina moved from % to % at The Academy GA.', v_old, v_new;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Both places should now agree, and neither should say theacademyga.org.

select s.name                                as campus,
       c.name                                as contact,
       c.email                               as contacts_table,
       s.admissions_contact_email            as school_column,
       case when c.is_booking_contact then 'BOOKING' else 'notified' end as role
  from public.schools s
  left join public.school_admissions_contacts c
    on c.school_id = s.id and c.is_active
 where s.name = 'The Academy GA'
 order by c.is_booking_contact desc nulls last, c.email;

-- AN APPLICATION LINK FOR JULIAN TOWA AND MADDOX MIXON
--
-- 30 September 2026. Jimmy: "now give me the application link so i can send
-- it to them". There is no link to give - no token has ever been minted for
-- either child, which is the same gap that left them accepted on 28 September
-- with nothing to do next. This creates one.
--
-- THIS WRITES. Everything else sent about these two children today has been
-- read-only; this is not.
--
-- WHICH RECORD. Each child has TWO leads: the older one that was accepted and
-- carries the application with the unpaid $100, and one created on
-- 30 September when the parent filled the inquiry in again. The link must
-- point at the ACCEPTED record - it is the one with the application, so it is
-- the only one where the fee panel can render and the payment can land
-- somewhere that matters.
--
-- REFUSES RATHER THAN GUESSES. If a child does not have exactly one accepted
-- lead, nothing is minted for anybody and the transaction rolls back. Minting
-- against the wrong record would send a family to a page with no fee on it,
-- and we would not find out until somebody wondered why they had not paid.
--
-- mint_application_access_token is idempotent: a lead that already has a
-- token gets the same one back, so re-running does not break a link already
-- in somebody's inbox.
--
-- THE DUPLICATE LEADS ARE NOT TOUCHED. Two inquiries from 30 September are
-- still sitting there. Merging or closing them is a separate decision and
-- nobody has made it.

begin;

do $$
declare
  v_julian  uuid;
  v_maddox  uuid;
  v_n       integer;
begin

  -- ---------------------------------------------------------------------
  -- 1. Exactly one accepted lead per child, or nothing happens.
  -- ---------------------------------------------------------------------
  select count(*) into v_n from public.admissions_leads l
   where lower(l.first_name) like '%julian%' and lower(l.last_name) like '%tow%'
     and l.lead_stage = 'accepted';
  if v_n <> 1 then
    raise exception
      'Expected exactly ONE accepted lead for Julian Towa, found %. Nothing '
      'minted. Look at the records before deciding which one is real.', v_n;
  end if;

  select count(*) into v_n from public.admissions_leads l
   where lower(l.first_name) like '%maddox%' and lower(l.last_name) like '%mix%'
     and l.lead_stage = 'accepted';
  if v_n <> 1 then
    raise exception
      'Expected exactly ONE accepted lead for Maddox Mixon, found %. Nothing '
      'minted.', v_n;
  end if;

  select l.id into v_julian from public.admissions_leads l
   where lower(l.first_name) like '%julian%' and lower(l.last_name) like '%tow%'
     and l.lead_stage = 'accepted';

  select l.id into v_maddox from public.admissions_leads l
   where lower(l.first_name) like '%maddox%' and lower(l.last_name) like '%mix%'
     and l.lead_stage = 'accepted';

  -- ---------------------------------------------------------------------
  -- 2. Both children must already have an application, because the link is
  --    only worth sending if the $100 has somewhere to land.
  -- ---------------------------------------------------------------------
  if not exists (select 1 from public.admissions_applications a where a.lead_id = v_julian) then
    raise exception 'Julian Towa has no application. Nothing minted.';
  end if;
  if not exists (select 1 from public.admissions_applications a where a.lead_id = v_maddox) then
    raise exception 'Maddox Mixon has no application. Nothing minted.';
  end if;

  -- ---------------------------------------------------------------------
  -- 3. Mint.
  -- ---------------------------------------------------------------------
  perform public.mint_application_access_token(v_julian);
  perform public.mint_application_access_token(v_maddox);

  raise notice '456/links: tokens minted for Julian Towa and Maddox Mixon.';
end $$;

commit;

-- ── THE LINKS ────────────────────────────────────────────────────────────────
-- Send `send_this_link` to the guardian address beside it. Nothing else.
-- The link needs no account and no password: it opens the application with
-- what the family already told us filled in, and the $100 above the form.

select l.first_name || ' ' || l.last_name                as child,
       coalesce(s.name, '(no campus)')                   as campus,
       l.guardian_email                                  as send_to,
       coalesce(a.application_fee_status, '?')           as fee_now,
       'https://apply.theacademyway.org/apply/start/' || l.application_access_token
                                                         as send_this_link
  from public.admissions_leads l
  left join public.schools s on s.id = l.school_id
  left join lateral (
    select * from public.admissions_applications x
     where x.lead_id = l.id order by x.created_at desc limit 1
  ) a on true
 where l.lead_stage = 'accepted'
   and ( (lower(l.first_name) like '%julian%' and lower(l.last_name) like '%tow%')
      or (lower(l.first_name) like '%maddox%' and lower(l.last_name) like '%mix%') )
 order by 1;

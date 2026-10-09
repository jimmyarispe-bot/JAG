-- LET GEORGIA AND FLORIDA SEND EMAIL AGAIN
--
-- 30 September 2026. Resend's own words, from the Mission Control queue:
--
--   "The theacademyga.org domain is not verified."
--   "The theacademyfl.org domain is not verified."
--
-- engine.ts sends AS schools.admissions_from_email. GA is set to a
-- theacademyga.org address and FL to a theacademyfl.org one, and neither
-- domain is verified with Resend - so every email either campus sends is
-- refused before it leaves, whoever it is addressed to. Virtual and HS send
-- as theacademyway.org, which is verified, and have not lost one.
--
-- IT IS NOT A STAFF PROBLEM. Four families got nothing:
--   Dominic Anders   FL   application invite       15 Sept
--   Deidra Williams  FL   application invite       15 Sept
--   Michael Stone    GA   inquiry confirmation     17 Sept
--   Camden Fox       GA   interview scheduled      18 Sept
-- plus Nina, twice, on Jayden Roy's decision.
--
-- WHAT THIS DOES. Clears admissions_from_email on any campus whose sending
-- domain is not theacademyway.org. engine.ts already treats an absent value
-- as "use EMAIL_FROM", deliberately:
--
--     const from = params.mergeCtx.fromEmail?.trim() || undefined;
--
-- so those campuses fall back to the verified sender and start delivering
-- immediately. No code change, no deploy.
--
-- WHAT IT COSTS. A parent at GA or FL sees a theacademyway.org From line
-- until the domains are verified. The contact NAME is untouched, so the mail
-- still reads as being from Nina or Danni, and reply-to still goes to their
-- real inbox. That is the same arrangement Virtual and HS have always had.
--
-- THE OLD VALUES ARE PRINTED BELOW BEFORE THEY GO, so putting them back
-- after verification is copy and paste.
--
-- THIS ALSO UNDOES A REGRESSION I SHIPPED THIS MORNING. Commit 5fb1a529
-- made resendCommunication send as the campus rather than the platform
-- default - right for Virtual and HS, and for GA and FL it turned resends
-- that used to work into ones that fail.
--
-- Safe to re-run.

begin;

-- ── WHAT IS ABOUT TO CHANGE. Copy this somewhere before the update runs. ────
select name                          as campus,
       admissions_from_email         as from_address_being_cleared,
       admissions_contact_email      as reply_to_unchanged
  from public.schools
 where coalesce(trim(admissions_from_email), '') <> ''
   and admissions_from_email not ilike '%@theacademyway.org';

do $$
declare
  v_n integer;
begin
  update public.schools
     set admissions_from_email = null
   where coalesce(trim(admissions_from_email), '') <> ''
     and admissions_from_email not ilike '%@theacademyway.org';
  get diagnostics v_n = row_count;

  if v_n = 0 then
    raise notice
      'Nothing to clear - every campus already sends from a theacademyway.org '
      'address, or from the platform default.';
  else
    raise notice
      '% campus(es) will now send from the verified default. Verify their own '
      'domains in Resend, then put the addresses back.', v_n;
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Every campus should now show either a theacademyway.org sender or none at
-- all. Anything else still cannot send.

select name                                              as campus,
       coalesce(admissions_from_email, '(platform default — verified)') as sends_as,
       coalesce(admissions_contact_name, '(none)')       as signed_by,
       coalesce(admissions_contact_email, '(none)')      as replies_go_to
  from public.schools
 order by name;

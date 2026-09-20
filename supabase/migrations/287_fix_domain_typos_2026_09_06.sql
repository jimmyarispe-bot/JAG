-- 287: two more undeliverable guardian addresses.
--
--   Amyosha Sharkull   amiysha06@gmial.com   ->  @gmail.com
--   Rana Mordaa        r.mourdia@gmail.con   ->  @gmail.com
--
-- Both are keystrokes in a well-known domain, not unknown addresses. The local
-- part — everything before the @ — is untouched, so this is not the system
-- guessing at somebody's email; it is correcting a slip in a string there is
-- only one correct spelling of.
--
-- MATCHED ON THE EXACT BROKEN ADDRESS, as 286 was. A name can be shared, a
-- domain typo can recur; this exact string belongs to one row. If it is gone,
-- somebody already fixed it and this does nothing.
--
-- Note `gmial.com` is a REAL registered domain — typo-squatters own it — so
-- mail to it does not bounce. It is delivered to a stranger. That is worse than
-- a bounce, because nobody ever finds out.
--
-- IDEMPOTENT.

begin;

do $$
declare v_hit int; v_total int := 0;
begin
  update public.admissions_leads
     set guardian_email = 'amiysha06@gmail.com'
   where lower(guardian_email) = 'amiysha06@gmial.com';
  get diagnostics v_hit = row_count;
  v_total := v_total + v_hit;
  raise notice 'Sharkull: % corrected.', v_hit;

  update public.admissions_leads
     set guardian_email = 'r.mourdia@gmail.com'
   where lower(guardian_email) = 'r.mourdia@gmail.con';
  get diagnostics v_hit = row_count;
  v_total := v_total + v_hit;
  raise notice 'Mordaa: % corrected.', v_hit;

  raise notice '% address(es) corrected in total.', v_total;
end $$;

commit;

-- The same scan as 286. Expect zero rows.
select l.first_name || ' ' || l.last_name                    as student,
       l.guardian_first_name || ' ' || l.guardian_last_name  as guardian,
       l.guardian_email,
       coalesce(sc.name, '(no school)')                      as school,
       l.lead_stage
from public.admissions_leads l
left join public.schools sc on sc.id = l.school_id
where l.archived_at is null
  and l.guardian_email is not null
  and (
        l.guardian_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[A-Za-z]{2,}$'
     or l.guardian_email ~* '\.(con|cmo|cim|ocm|comm|xom|vom)$'
     or l.guardian_email ~* '@(gmial|gmai|gmil|gnail|yaho|yahooo|hotmial|hotmai|outlok|iclod)\.'
      )
order by 4, 1;

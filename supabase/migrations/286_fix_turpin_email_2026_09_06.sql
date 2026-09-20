-- 286: Casey Turpin's email address is undeliverable.
--
-- Recorded as `turpincasey@yahoo.con`. Not a typo that degrades gracefully —
-- `.con` is not a top-level domain, so every message JAG has ever addressed to
-- this family has bounced and every future one would too.
--
-- She is the guardian for Gavin Matthews at The Academy FL, and migration 285
-- just opened an invite-to-apply gate on that lead. Answering it would have
-- sent an application invitation into a void, and the family would have been
-- recorded as invited and never heard from us.
--
-- Jimmy, 2026-09-06: "turpincasey@yahoo.com".
--
-- MATCHED ON THE BROKEN ADDRESS, not on a name. Two people can share a name;
-- only one row holds this exact string, and if that string is not there any
-- more then somebody has already fixed it and this migration should do nothing
-- rather than guess which Casey to edit.
--
-- IDEMPOTENT.

begin;

do $$
declare v_hit int;
begin
  update public.admissions_leads
     set guardian_email = 'turpincasey@yahoo.com'
   where lower(guardian_email) = 'turpincasey@yahoo.con';
  get diagnostics v_hit = row_count;
  raise notice 'Leads corrected: %', v_hit;

  if v_hit = 0 then
    raise notice 'Nothing matched turpincasey@yahoo.con — already corrected, or the address is held somewhere else.';
  end if;
end $$;

commit;

-- Every remaining address in the leads table whose domain cannot resolve.
--
-- Reported rather than corrected: a wrong address is only fixable by someone
-- who knows the right one. This finds the rest of them so they surface now
-- instead of one bounce at a time.
select l.first_name || ' ' || l.last_name              as student,
       l.guardian_first_name || ' ' || l.guardian_last_name as guardian,
       l.guardian_email,
       coalesce(sc.name, '(no school)')                as school,
       l.lead_stage
from public.admissions_leads l
left join public.schools sc on sc.id = l.school_id
where l.archived_at is null
  and l.guardian_email is not null
  and (
        -- No @ at all, or nothing after it.
        l.guardian_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[A-Za-z]{2,}$'
        -- Common near-misses. `.co` and `.net` are real and are NOT listed:
        -- flagging a valid address is how a list like this gets ignored.
     or l.guardian_email ~* '\.(con|cmo|cim|ocm|comm|xom|vom)$'
     or l.guardian_email ~* '@(gmial|gmai|gmil|gnail|yaho|yahooo|hotmial|hotmai|outlok|iclod)\.'
      )
order by 4, 1;

-- 288: the Sharkull address is still flagged and looks correct on screen.
--
-- After 287, `amiysha06@gmail.com` renders correctly in the results grid and
-- the scan still returns it. A value that looks right and behaves wrong almost
-- always has something in it you cannot see — a trailing space, a tab, a
-- non-breaking space pasted from a phone, a stray newline.
--
-- That is not cosmetic. `to@example.com ` with a trailing space is rejected by
-- some mail APIs outright and silently truncated by others, and a leading
-- space breaks address parsing entirely. It is also why 287's update may have
-- matched nothing: it compared against the clean string.
--
-- STEP 1 SHOWS THE BYTES. Every flagged address is printed inside brackets with
-- its length, so an invisible character has nowhere to hide.
-- STEP 2 TRIMS, which is always safe: no email address legitimately begins or
-- ends with whitespace.
-- STEP 3 re-runs the scan.
--
-- Nothing here guesses at a spelling. Trimming is the only edit, and it cannot
-- change which mailbox an address points at.
--
-- IDEMPOTENT.

begin;

-- 1. What is actually stored, visibly.
do $$
declare r record;
begin
  for r in
    select l.first_name || ' ' || l.last_name as student,
           l.guardian_email as email,
           length(l.guardian_email) as len
    from public.admissions_leads l
    where l.archived_at is null
      and l.guardian_email is not null
      and l.guardian_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[A-Za-z]{2,}$'
  loop
    raise notice 'RAW  %  [%]  length=%  trimmed_length=%',
      r.student, r.email, r.len, length(btrim(r.email));
  end loop;
end $$;

-- 2. Trim every guardian address that has whitespace at either end.
--    `btrim` with an explicit character list covers the ones that are not
--    caught by the default: tab, newline, carriage return, and U+00A0, the
--    non-breaking space that arrives when a parent pastes from a phone.
do $$
declare v_hit int;
begin
  update public.admissions_leads
     set guardian_email = btrim(guardian_email, E' \t\n\r ')
   where guardian_email is not null
     and guardian_email <> btrim(guardian_email, E' \t\n\r ');
  get diagnostics v_hit = row_count;
  raise notice '% address(es) trimmed.', v_hit;
end $$;

commit;

-- 3. The scan again. Anything still here has a real problem, and the bracketed
--    value above says what it is.
select l.first_name || ' ' || l.last_name                    as student,
       l.guardian_first_name || ' ' || l.guardian_last_name  as guardian,
       '[' || l.guardian_email || ']'                        as exact_value,
       length(l.guardian_email)                              as len,
       coalesce(sc.name, '(no school)')                      as school
from public.admissions_leads l
left join public.schools sc on sc.id = l.school_id
where l.archived_at is null
  and l.guardian_email is not null
  and (
        l.guardian_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[A-Za-z]{2,}$'
     or l.guardian_email ~* '\.(con|cmo|cim|ocm|comm|xom|vom)$'
     or l.guardian_email ~* '@(gmial|gmai|gmil|gnail|yaho|yahooo|hotmial|hotmai|outlok|iclod)\.'
      )
order by 5, 1;

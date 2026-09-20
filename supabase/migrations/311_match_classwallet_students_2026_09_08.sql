-- 311_match_classwallet_students_2026_09_08.sql
--
-- Attaches ClassWallet disbursements to student records. Requires 310.
--
-- Six of the nine payer names are matched. Three are not in the roster at all.
--
-- THE MATCH RULE, AND WHY IT CHANGED
--
-- The first draft of this script required first name AND last name AND the
-- school that the portal login belongs to. That was wrong, and the roster query
-- of 2026-09-08 is what showed it.
--
-- School was in the key to disambiguate two people sharing a name. But every
-- one of these six names is UNIQUE ACROSS THE WHOLE ROSTER - there is exactly
-- one Samuel Johns, one Kingstyn Allen, one Jelina Augustave. Against a unique
-- name, school adds nothing to IDENTITY, and instead blocks a certain match
-- over a completely different question.
--
-- So the rule here is: EXACTLY ONE student in the entire students table with
-- that first and last name. Zero matches or two matches and nothing is written,
-- with a NOTICE saying which. That still refuses to guess - "Julian Oubre /
-- Towa" became two students because a name was treated as an identifier - but
-- it stops conflating "who is this" with "whose money is this".
--
-- AND THE SCHOOL QUESTION IS REAL, SO IT IS RECORDED RATHER THAN USED AS A GATE
--
-- Two students were paid through the WRONG ENTITY'S LOGIN:
--
--     Samuel Johns     The Academy HS   paid via AZ VIRTUAL   $10,874.25
--     Kingstyn Allen   The Academy HS   paid via AZ VIRTUAL    $3,971.04
--                                                             ----------
--                                                             $14,845.29
--
-- On 8 September the working assumption was that the portal login IS the school
-- attribution, because the export files carry none - Arizona reports
-- School = "N/A" on all 28 orders and Arkansas reports the FAMILY's declared
-- school. That assumption is now known to be too strong. The login reliably
-- says which ACCOUNT the money came through. It does not reliably say where the
-- child sits.
--
-- Both readings are open and only Jimmy can close them: either the AZ account
-- is a shared or legacy account that predates the HS one, or these students'
-- school_id is wrong. Every affected row carries school_attribution_conflict in
-- its notes so the question survives this conversation.
--
-- NOT IN THE ROSTER AT ALL
--
--   Jaxon Corduan   $10,242.89  Last paid 2025-04-22. Left before the roster
--                               was built, most likely.
--   Kennedy Stone    $5,880.01  Last paid 2025-01-28. The only near-match is
--                               Kennedy BRADLEY at The Academy GA - different
--                               surname, different school, different state.
--                               A shared first name is not a person. Recorded
--                               as rejected so nobody re-proposes it.
--   Areli Romero     $1,537.50  First and only payment 2026-09-04, through the
--                               Arkansas VIRTUAL login. CURRENT money. Far more
--                               likely a student not yet entered than one who
--                               left. Worth chasing this week.
--
-- Unmatched money is still real money. All $17,660.40 of it counts toward
-- revenue in funder_disbursement_summary; it is simply not attached to a child.
--
-- SAFE TO RE-RUN. Every update only ever moves a row from unmatched to matched.

begin;

do $$
declare
  m record;
  v_student uuid;
  v_school_id uuid;
  v_school_name text;
  v_n int;
  v_rows int;
  v_matched int := 0;
  v_conflicts int := 0;
begin
  for m in
    select * from (values
      -- portal name        first       last         login entity           note
      ('Jelina Augustave',  'Jelina',   'Augustave', 'The Academy Virtual',
       'North Carolina ESA+. Ten unbroken monthly payments Nov 2025 - Aug 2026. Still enrolled.'),
      ('Lauryn Allen',      'Lauryn',   'Allen',     'The Academy Virtual',
       'Arizona ESA. Withdrawn. Largest single Arizona payer at $14,462.65 across 6 orders.'),
      ('Samuel Johns',      'Samuel',   'Johns',     'The Academy Virtual',
       'Arizona ESA. Still enrolled and the ONLY Arizona student still paying, through 2026-08-21.'),
      ('Abigail Allen',     'Abigail',  'Allen',     'The Academy Virtual',
       'Arizona ESA. Withdrawn. Sibling of Lauryn and Kingstyn.'),
      ('Kingstyn Allen',    'Kingstyn', 'Allen',     'The Academy Virtual',
       'Arizona ESA. Withdrawn. Sibling of Lauryn and Abigail.'),
      ('Izabella Mccallum', 'Izabella', 'McCallum',  'The Academy HS',
       'Arkansas EFA. Still enrolled. Portal spells the surname Mccallum; the roster spells it McCallum.')
    ) as t(portal_name, first_name, last_name, login_school, why)
  loop
    -- Exactly one student with this name ANYWHERE, or nothing is written.
    select count(*) into v_n
      from public.students st
     where lower(st.first_name) = lower(m.first_name)
       and lower(st.last_name)  = lower(m.last_name);

    if v_n <> 1 then
      raise notice 'SKIPPED % - % students named % % in the roster. Nothing written.',
        m.portal_name, v_n, m.first_name, m.last_name;
      continue;
    end if;

    select st.id, st.school_id, sc.name
      into v_student, v_school_id, v_school_name
      from public.students st
      join public.schools sc on sc.id = st.school_id
     where lower(st.first_name) = lower(m.first_name)
       and lower(st.last_name)  = lower(m.last_name);

    update public.funder_disbursements d
       set student_id   = v_student,
           match_status = 'matched',
           matched_at   = now(),
           updated_at   = now(),
           notes        = coalesce(d.notes || E'\n', '') ||
                          'Matched to ' || m.first_name || ' ' || m.last_name ||
                          ' (roster school: ' || v_school_name || ') by script 311 on 2026-09-08. ' ||
                          m.why ||
                          case when v_school_name <> m.login_school then
                            E'\nSCHOOL ATTRIBUTION CONFLICT: this money arrived through the ' ||
                            m.login_school || ' ClassWallet login, but the roster places this student at ' ||
                            v_school_name || '. Identity is not in doubt - the name is unique in the roster - ' ||
                            'but the entity that earned the revenue is. Either the login is shared or legacy, ' ||
                            'or the student record carries the wrong school. UNRESOLVED as at 2026-09-08.'
                          else '' end
     where d.payer_account_name = m.portal_name
       and d.match_status = 'unmatched';

    get diagnostics v_rows = row_count;
    v_matched := v_matched + v_rows;

    if v_school_name <> m.login_school then
      v_conflicts := v_conflicts + v_rows;
      raise notice 'MATCHED WITH CONFLICT: % -> % % | roster=% but login=% | % orders',
        m.portal_name, m.first_name, m.last_name, v_school_name, m.login_school, v_rows;
    else
      raise notice 'matched % -> % % (%) | % orders',
        m.portal_name, m.first_name, m.last_name, v_school_name, v_rows;
    end if;
  end loop;

  raise notice 'TOTAL: % orders matched, of which % carry a school attribution conflict.',
    v_matched, v_conflicts;
end $$;

-- ---------------------------------------------------------------------------
-- The three with no roster record. Reasons written onto the rows, because a
-- reason that lives only in a conversation does not survive the conversation.
-- ---------------------------------------------------------------------------

update public.funder_disbursements
   set updated_at = now(),
       notes      = coalesce(notes || E'\n', '') ||
                    'NO ROSTER RECORD (311, 2026-09-08): no student named Jaxon Corduan exists in '
                    'public.students. Last payment 2025-04-22 - most likely a student who left before '
                    'the roster was built. $10,242.89 across 5 orders.'
 where payer_account_name = 'Jaxon Corduan'
   and match_status = 'unmatched';

update public.funder_disbursements
   set updated_at = now(),
       notes      = coalesce(notes || E'\n', '') ||
                    'NO ROSTER RECORD, CANDIDATE REJECTED (311, 2026-09-08): no student named Kennedy Stone '
                    'exists. The only near-match is Kennedy BRADLEY at The Academy GA - different surname, '
                    'different school, and this money came through the Arizona Virtual login. A shared first '
                    'name is not a person. Do not re-propose this match. $5,880.01 across 6 orders, last '
                    'paid 2025-01-28.'
 where payer_account_name = 'Kennedy Stone'
   and match_status = 'unmatched';

update public.funder_disbursements
   set updated_at = now(),
       notes      = coalesce(notes || E'\n', '') ||
                    'NO ROSTER RECORD (311, 2026-09-08): no student named Areli Romero exists in '
                    'public.students. Unlike the other two unmatched payers this is CURRENT money - first '
                    'and only payment 2026-09-04, through the Arkansas Virtual login, $1,537.50. Far more '
                    'likely a student not yet entered than one who left. Chase this.'
 where payer_account_name = 'Areli Romero'
   and match_status = 'unmatched';

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification. Nine payers, six matched. Expect:
--
--   matched    Jelina Augustave   10  $14,649.36  Virtual  (enrolled)
--   matched    Lauryn Allen        6  $14,462.65  Virtual  (withdrawn)
--   matched    Samuel Johns        7  $10,874.25  HS       <- CONFLICT
--   matched    Abigail Allen       2   $4,454.90  Virtual  (withdrawn)
--   matched    Kingstyn Allen      2   $3,971.04  HS       <- CONFLICT
--   matched    Izabella Mccallum   1     $865.73  HS       (enrolled)
--   unmatched  Jaxon Corduan       5  $10,242.89
--   unmatched  Kennedy Stone       6   $5,880.01
--   unmatched  Areli Romero        1   $1,537.50
--
--   matched     $49,277.93   (14 orders of which carry a school conflict)
--   unmatched   $17,660.40
--   total       $66,938.33
--
-- school_conflict = true on 9 orders worth $14,845.29.
-- ---------------------------------------------------------------------------

select
  d.match_status,
  d.payer_account_name,
  coalesce(st.first_name || ' ' || st.last_name, '--')  as matched_student,
  coalesce(rs.name, '--')                               as roster_school,
  ls.name                                               as login_entity,
  (st.id is not null and rs.name is distinct from ls.name) as school_conflict,
  count(*)                                              as orders,
  sum(d.net_amount)::numeric(12,2)                      as net_received,
  max(d.settled_on)                                     as last_settled
from public.funder_disbursements d
join public.funder_accounts fa on fa.id = d.funder_account_id
join public.schools ls on ls.id = fa.school_id
left join public.students st on st.id = d.student_id
left join public.schools rs on rs.id = st.school_id
group by d.match_status, d.payer_account_name, st.id, st.first_name, st.last_name, rs.name, ls.name
order by
  case d.match_status when 'matched' then 1 else 2 end,
  sum(d.net_amount) desc;

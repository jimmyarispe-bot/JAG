-- 317_status_drift_2026_09_09.sql
--
-- REPLACES the earlier 317 (duplicate + enrollment fixes), which was written
-- before we knew what was actually wrong. Do not run that version.
--
-- WHAT IS WRONG
--
-- public.students carries TWO status columns and they disagree. Every archive
-- migration in this project - 258, 260, 268, 277, 278, 282 - sets
-- status = 'archived' and leaves enrollment_status alone. Any query that filters
-- on enrollment_status therefore counts students who left months ago.
--
-- Found because Gabriella Gomes-Gindel appeared in a roster query on 9 September
-- despite migration 282 having archived her on 6 September. 282 worked. The
-- query was asking the wrong column.
--
--   campus     status     enrollment_status   n
--   GA         archived   enrolled            3   Bourgeois, Bradley, Davis
--   HS         archived   enrolled            1   Israel Cooks
--   Virtual    archived   enrolled            1   Gabriella Gomes-Gindel
--
-- WHAT THIS COSTS
--
--   campus     counted   actually active
--   FL              32        32
--   GA              22        19
--   HS              14        13
--   Virtual         16        15
--
-- Five students, and every per-student cost figure built on those counts was
-- wrong by that much.
--
-- THIS IS THE SIXTH INSTANCE OF THE HOUSE PATTERN. The other five were queries
-- that returned zero rows without an error. This one returns the WRONG rows
-- without an error, which is worse, because zero invites suspicion and a
-- plausible number does not.
--
-- WHAT THIS DOES NOT DO
--
-- It does not delete Gabriella Gomes-Gindel. Migration 282 chose to archive
-- rather than merge, and wrote down why: "a silent merge is how a guardian or a
-- document ends up attached to the wrong child." That decision stands. She is
-- archived; she just needs to stop being counted.
--
-- SAFE TO RE-RUN.

begin;

create temp table _r317 (seq int, item text, detail text);

do $$
declare
  v_has_prev bool;
  v_has_arch bool;
  v_n        bigint;
  v_lera     uuid;
  v_status   text;
  v_enroll   text;
begin

  -- 282 wrote previous_status and archived_at. They are not in the generated
  -- types (which stop at migration 236), so their existence is checked rather
  -- than assumed - a missing column would otherwise abort the whole script.
  select exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='students'
                    and column_name='previous_status') into v_has_prev;
  select exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='students'
                    and column_name='archived_at') into v_has_arch;

  insert into _r317 values (1, 'schema',
    format('previous_status present: %s | archived_at present: %s', v_has_prev, v_has_arch));

  ---------------------------------------------------------------------------
  -- 1. Archived students still reading enrolled
  ---------------------------------------------------------------------------
  update public.students
     set enrollment_status = 'withdrawn',
         updated_at        = now()
   where status = 'archived'
     and enrollment_status = 'enrolled';
  get diagnostics v_n = row_count;

  insert into _r317 values (10, 'archived but still enrolled',
    format('%s student(s) corrected to enrollment_status = withdrawn', v_n));

  ---------------------------------------------------------------------------
  -- 2. Lera Osterhoudt - active and enrolled, and not a student
  --    (Jimmy, 2026-09-09: "Lera Osterhoudt not enrolled")
  ---------------------------------------------------------------------------
  select st.id, st.status, st.enrollment_status
    into v_lera, v_status, v_enroll
    from public.students st
    join public.schools sc on sc.id = st.school_id
   where lower(st.first_name) = 'lera'
     and lower(st.last_name)  = 'osterhoudt'
     and sc.name = 'The Academy Virtual';

  if v_lera is null then
    insert into _r317 values (20, 'Lera Osterhoudt', 'NOT FOUND at The Academy Virtual. Nothing changed.');
  elsif v_status = 'archived' and v_enroll <> 'enrolled' then
    insert into _r317 values (20, 'Lera Osterhoudt', 'Already archived and not enrolled. Nothing to do.');
  else
    -- Same shape as 282, so the archive trail stays consistent.
    if v_has_prev then
      execute 'update public.students set previous_status = coalesce(previous_status, status) where id = $1'
        using v_lera;
    end if;
    if v_has_arch then
      execute 'update public.students set archived_at = coalesce(archived_at, now()) where id = $1'
        using v_lera;
    end if;

    update public.students
       set status            = 'archived',
           enrollment_status = 'withdrawn',
           updated_at        = now()
     where id = v_lera;

    insert into _r317 values (20, 'Lera Osterhoudt',
      format('status %s -> archived, enrollment_status %s -> withdrawn', v_status, v_enroll));
  end if;

  ---------------------------------------------------------------------------
  -- 3. Israel Cooks - flagged, not changed
  ---------------------------------------------------------------------------
  -- He is archived at The Academy HS, and separately recorded as sitting on the
  -- Georgia Special Needs roster. His Square series ("GA Monthly Tuition Payment
  -- - HS") ended in April 2026. So Georgia may still believe it is funding a
  -- student who left five months ago. That is a reporting question, not a
  -- database one, and this script only surfaces it.
  insert into _r317
  select 30, 'Israel Cooks',
         format('archived at %s. Georgia Special Needs roster still lists him; Square series ended April 2026. '
                'CHECK WHAT GEORGIA HAS BEEN TOLD.', sc.name)
    from public.students st
    join public.schools sc on sc.id = st.school_id
   where lower(st.first_name) = 'israel' and lower(st.last_name) = 'cooks';

end $$;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- What happened.
-- ---------------------------------------------------------------------------
select item, detail from _r317 order by seq, item, detail;

-- ---------------------------------------------------------------------------
-- The drift, afterwards. THIS MUST COME BACK EMPTY.
-- ---------------------------------------------------------------------------
select sc.name as campus, st.status, st.enrollment_status, count(*) as students
from public.students st
join public.schools sc on sc.id = st.school_id
where st.status = 'archived' and st.enrollment_status = 'enrolled'
group by sc.name, st.status, st.enrollment_status;

-- ---------------------------------------------------------------------------
-- The real roster. Both columns agreeing, which is the only count worth using.
--
--   FL       32
--   GA       19
--   HS       13    (14 once Carter Fromm arrives in 319)
--   Virtual  14    (13 once Carter Fromm leaves in 319)
-- ---------------------------------------------------------------------------
select
  sc.name                                                   as campus,
  count(*) filter (where st.status = 'active'
                     and st.enrollment_status = 'enrolled')  as truly_enrolled,
  count(*) filter (where st.status = 'active')               as active_records,
  count(*)                                                   as all_records
from public.students st
join public.schools sc on sc.id = st.school_id
group by sc.name
order by 2 desc;

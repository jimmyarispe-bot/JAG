-- 292_fix_email_gmil_2026_09_06.sql
--
-- Fix amiysha06@gmil.com -> amiysha06@gmail.com
--
-- HISTORY, because this is the third attempt and the first two failed for
-- reasons worth not repeating:
--
--   286  read the value back and I misread the grid as "gmail"
--   287  targeted 'gmial.com' -- a transposition. Matched NOTHING and reported
--        success, because zero rows updated is not an error.
--   288  dumped the actual bytes: length 18, no hidden characters, and the
--        domain is 'gmil.com' -- a DROPPED letter, not a transposed one.
--
-- So this migration does not trust my reading of anything. It searches every
-- email-shaped column in the schema, refuses to run if it finds nothing, and
-- reports exactly which table and column it touched.
--
-- IT ALSO DOES NOT GUESS BEYOND THE ONE ADDRESS. Other @gmil.com addresses are
-- REPORTED, not changed. gmil.com resolves as a real domain, so a blanket
-- rewrite could redirect somebody's genuine mail to the wrong place.
--
-- SUPABASE NOTES:
--   * The editor shows only the LAST result set. The final SELECT is the report.
--   * It will flag "creates tables without RLS" because of the temp table.
--     That is a false positive. Run without RLS is correct.

begin;

-- NOT "on commit drop": the report SELECT runs after COMMIT, and an
-- on-commit-drop table would be gone by then. It dies with the session anyway.
drop table if exists _email_fix_report;
create temp table _email_fix_report (
  seq        integer,
  finding    text,
  table_name text,
  column_name text,
  detail     text
);

do $$
declare
  r            record;
  v_hits       integer;
  v_total_hits integer := 0;
  v_seq        integer := 0;
  v_other      integer;
  v_others     integer := 0;
begin
  -- Pass 1: find and fix the exact address, wherever it lives.
  for r in
    select c.table_name, c.column_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema
       and t.table_name  = c.table_name
     where c.table_schema = 'public'
       and t.table_type   = 'BASE TABLE'
       and c.data_type in ('text', 'character varying')
       and c.column_name ilike '%email%'
     order by c.table_name, c.column_name
  loop
    execute format(
      'update public.%I set %I = %L where %I = %L',
      r.table_name, r.column_name,
      'amiysha06@gmail.com',
      r.column_name,
      'amiysha06@gmil.com'
    );
    get diagnostics v_hits = row_count;

    if v_hits > 0 then
      v_seq := v_seq + 1;
      v_total_hits := v_total_hits + v_hits;
      insert into _email_fix_report
        values (v_seq, 'FIXED', r.table_name, r.column_name,
                format('%s row(s): amiysha06@gmil.com -> amiysha06@gmail.com', v_hits));
    end if;

    -- Pass 2: any OTHER @gmil.com address in the same column. Reported only.
    execute format(
      'select count(*) from public.%I where %I like %L and %I <> %L',
      r.table_name, r.column_name, '%@gmil.com',
      r.column_name, 'amiysha06@gmail.com'
    ) into v_other;

    if v_other > 0 then
      v_seq := v_seq + 1;
      v_others := v_others + v_other;
      insert into _email_fix_report
        values (v_seq, 'REPORTED, NOT CHANGED', r.table_name, r.column_name,
                format('%s other address(es) ending @gmil.com -- your call', v_other));
    end if;
  end loop;

  -- Zero rows with no error is a policy refusal wearing a success costume.
  -- 287 already did that once. Not again.
  if v_total_hits = 0 then
    raise exception
      'Aborting: amiysha06@gmil.com was not found in any email column in public. '
      'Either it was already fixed, or the stored value differs again. '
      'Nothing has been changed.';
  end if;

  if v_total_hits > 1 then
    insert into _email_fix_report
      values (999, 'NOTE', '-', '-',
        format('%s rows carried this address across the schema. That is normal '
               'if the same guardian email is denormalised onto leads, guardians '
               'and students -- but check the list above.', v_total_hits));
  end if;

  insert into _email_fix_report
    values (1000, 'TOTAL', '-', '-',
      format('%s row(s) fixed. %s other @gmil.com address(es) left alone.',
             v_total_hits, v_others));
end $$;

-- Confirm the old value is gone from every email column before committing.
do $$
declare
  r       record;
  v_left  integer;
  v_bad   integer := 0;
begin
  for r in
    select c.table_name, c.column_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name
     where c.table_schema = 'public'
       and t.table_type   = 'BASE TABLE'
       and c.data_type in ('text', 'character varying')
       and c.column_name ilike '%email%'
  loop
    execute format('select count(*) from public.%I where %I = %L',
                   r.table_name, r.column_name, 'amiysha06@gmil.com')
      into v_left;
    v_bad := v_bad + v_left;
  end loop;

  if v_bad > 0 then
    raise exception 'Aborting: % row(s) still hold the old address after the update.', v_bad;
  end if;

  insert into _email_fix_report
    values (1001, 'VERIFIED', '-', '-',
            'amiysha06@gmil.com no longer appears in any email column in public.');
end $$;

commit;

-- The report. This is the last statement, so it is what the editor shows.
select finding, table_name, column_name, detail
  from _email_fix_report
 order by seq;

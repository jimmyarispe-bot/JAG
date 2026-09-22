/*
  WHAT IS ACTUALLY ON A STUDENT RECORD — read-only. Nothing here writes.

  WHY. An export of pupil records is about to be specified. Every field in it
  must be a column that exists and is populated; a spec written from memory
  produces an export with empty columns nobody notices until a state report is
  due.

  This lists every column on students and family contacts, with how many of the
  82 active students actually have a value. Ethnicity (migration 407) is called
  out because it was added recently and may be almost entirely empty.

  WHAT EMPTY MEANS: a column at 0 populated is not necessarily wrong - it may
  simply never have been collected. That is the point of running this before
  writing the spec rather than after.
*/

select
  c.table_name,
  c.column_name,
  c.data_type,
  case
    when c.table_name = 'students' then (
      select count(*)::text || ' of ' || (select count(*) from public.students)::text
      from public.students s
      where to_jsonb(s) ->> c.column_name is not null
    )
    else 'not counted'
  end as populated
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in ('students', 'families', 'family_contacts', 'guardians')
order by c.table_name, c.ordinal_position;

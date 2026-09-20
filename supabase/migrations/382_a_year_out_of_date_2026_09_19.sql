-- Two children a year behind, and a column with no convention.
--
-- Jimmy, 19 September 2026: "israel 10th; fiona 11th".
--
-- Both were wrong for the same reason. Israel Cooks read '9th_grade' - true in
-- 2025-2026, the year his contract covers. Fiona Drescher I created an hour ago
-- reading '10', taken from HER contract, which is also 2025-2026. Neither
-- document is this year's, and I copied a grade off one without noticing it had
-- expired. Contracts describe the year they were signed for; a student record
-- describes now.
--
-- WHICH FORMAT. The two rows disagreed: '9th_grade' against '10'. Rather than
-- guess and create a third spelling, this counts how the rest of the network
-- writes a grade and follows the majority. The report says which it chose and
-- what the alternatives were - if it picked wrong, the fix is one update, and
-- you will be able to see that it picked wrong rather than having to wonder.

begin;

with style as (
  select
    count(*) filter (where grade_level ~ '^[0-9]+(st|nd|rd|th)_grade$') as suffixed,
    count(*) filter (where grade_level ~ '^[0-9]+$')                    as plain
  from public.students
  where grade_level is not null
    and id not in ('8be1e5ba-c998-41b5-aea6-b60171f883b3',
                   '3815dd71-31a9-4ed0-886b-daa3d24389af')
),
target(student_id, ordinal, plain_form) as (
  values ('8be1e5ba-c998-41b5-aea6-b60171f883b3'::uuid, '10th_grade', '10'),
         ('3815dd71-31a9-4ed0-886b-daa3d24389af'::uuid, '11th_grade', '11')
)
update public.students s
   set grade_level = case when st.suffixed >= st.plain
                          then t.ordinal else t.plain_form end,
       updated_at  = now()
  from target t, style st
 where s.id = t.student_id;

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- Israel must read tenth grade, Fiona eleventh, BOTH IN THE SAME FORMAT as
-- each other and as the rows beneath them. The second block shows every
-- spelling in use: if the two children do not match the commonest one, the
-- majority count was close and the choice went the wrong way.

select first_name, last_name, preferred_name, grade_level,
       enrollment_status, student_number
from public.students
where id in ('8be1e5ba-c998-41b5-aea6-b60171f883b3',
             '3815dd71-31a9-4ed0-886b-daa3d24389af')

union all

select '--- every spelling in use ---', null, null,
       coalesce(grade_level, '(null)'), count(*)::text || ' students', null
from public.students
group by grade_level
order by 1, 4;

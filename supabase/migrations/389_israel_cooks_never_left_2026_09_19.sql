-- Israel Cooks is not withdrawn.
--
-- His student record read enrollment_status 'withdrawn' while he sat in four
-- classes on the Fall 2026-2027 Virtual schedule, and while the Georgia
-- Department of Education held him eligible for 10,712.00 for school year
-- 2026-2027, determined 31 July 2026 - an award whose continuing payments
-- require "evidence of continued enrollment and attendance at the participating
-- school". Jimmy confirmed on 19 September 2026: the status is left over from
-- last year and was never updated when he re-enrolled.
--
-- WHY THIS WAS WORTH CHASING RATHER THAN SHRUGGING AT.
--
-- Nothing was broken. No error, no failed write, no missing row. A field simply
-- went on saying something that had stopped being true, and every screen that
-- reads it repeated it faithfully. It would have surfaced as a teacher paid for
-- one student fewer, four times a day, in a pay run nobody had reason to
-- distrust - or worse, as a scholarship claim for a child the platform's own
-- records described as gone.
--
-- GRADE IS DELIBERATELY NOT TOUCHED HERE.
--
-- His grade reads '9th_grade', which was true in 2025-2026. Fiona Drescher,
-- created an hour ago, reads '10'. Two children, one column, two formats - so
-- there is no way to write "tenth grade" without first knowing which spelling
-- the other hundred students use. The report below answers that; the update is
-- a separate, one-line migration once the answer is in.

begin;

update public.students
   set enrollment_status = 'enrolled',
       lifecycle_stage   = 'active',
       status            = 'active',
       previous_status   = status,
       updated_at        = now()
 where id = '8be1e5ba-c998-41b5-aea6-b60171f883b3'
   and enrollment_status = 'withdrawn';

commit;

-- =========================================================================
-- REPORT 1 - Israel
-- =========================================================================
--
-- One row, enrollment_status 'enrolled'. If it still says 'withdrawn' the
-- update matched nothing, which means somebody changed it in between.

select first_name, last_name, preferred_name, grade_level,
       enrollment_status, lifecycle_stage, student_number
from public.students
where id = '8be1e5ba-c998-41b5-aea6-b60171f883b3';

-- =========================================================================
-- REPORT 2 - how does this network write a grade level?
-- =========================================================================
--
-- Every distinct spelling, most common first. If this returns one clean family
-- of values and a couple of strays, the strays are the bug. If it returns a
-- dozen shapes, then grade_level has never had a convention and anything that
-- groups, sorts or matches on it has been quietly wrong for a long time.

select coalesce(grade_level, '(null)') as grade_level_as_stored,
       count(*) as students,
       string_agg(distinct first_name || ' ' || last_name, ', '
                  order by first_name || ' ' || last_name) filter (where true) as who
from public.students
group by 1
order by count(*) desc, 1;

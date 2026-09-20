-- SUPERSEDED - DO NOT RUN
--
-- This file was 317_duplicate_and_enrollment_fixes_2026_09_09.sql. It was
-- written before the real fault was understood and it would have DELETED
-- Gabriella Gomes-Gindel.
--
-- She does not need deleting. Migration 282 archived her on 6 September, on
-- purpose, and wrote down why. She kept appearing in roster queries because
-- public.students carries TWO status columns - status and enrollment_status -
-- and 282 only set the first. Five students across three campuses are in that
-- state.
--
-- Run 317_status_drift_2026_09_09.sql instead.

do $$
begin
  raise exception 'Superseded. Run 317_status_drift_2026_09_09.sql instead.';
end $$;

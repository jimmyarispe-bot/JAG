-- SUPERSEDED - DO NOT RUN
--
-- This tried to write monthly_amount onto three plans whose billing_mode is
-- 'scheduled'. The check constraint plan_mode_fields_present refused it, and
-- was right to:
--
--   scheduled    -> annual_tuition, billing_basis and remaining_due present,
--                   monthly_amount MUST BE NULL. The money lives in
--                   student_tuition_instalments.
--   monthly_open -> monthly_amount present, the schedule fields all null.
--
-- Cate Crath's plan already reads "8,500 over ten payments" = $850, which is
-- exactly what her Square series charges. Cole Heffernan ($8,500 over 9) and
-- Violet Heffernan ($12,500 over 9) are the same shape.
--
-- Nothing was missing. The roster query showed monthly_amount and null was read
-- as a gap rather than as the correct value for a scheduled plan.
--
-- The real question - does each schedule agree with its Square series - is a
-- read, not a write. Nothing to run here.

do $$
begin
  raise exception 'Superseded. There was no missing amount - see the header.';
end $$;

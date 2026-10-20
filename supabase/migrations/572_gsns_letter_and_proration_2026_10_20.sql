-- 572 - GA Special Needs Scholarship: the letter's total, the GTID, and the
-- share of the total this family receives.
--
-- Jimmy, 20 October 2026: "when the parent uploads the scholarship document
-- into the jag, it should pull out the students student number and also the
-- total scholarship amount and include this automatcally in the students
-- financial information. however, according to these dates of enrollment
-- determines the percentage of the total scholarship amount they will
-- receive. we would need to receive the signed contract and first payment
-- before these dates for the corresponding scholarship percentage to apply -
-- September 5th for 100% November 6th for 75% January 8th for 50% April 9th
-- for 25%"
--
-- awarded_amount stays the figure the plan bills from. These columns record
-- where it came from: total_award_amount x award_percent / 100.

alter table public.scholarship_awards
  add column if not exists total_award_amount numeric(12,2)
    check (total_award_amount is null or total_award_amount >= 0),
  add column if not exists award_percent numeric(5,2)
    check (award_percent is null or (award_percent >= 0 and award_percent <= 100)),
  add column if not exists award_percent_deadline date,
  add column if not exists state_student_number text,
  add column if not exists source_document_path text;

comment on column public.scholarship_awards.total_award_amount is
  'The full-year total printed on the state''s award letter, before the enrollment-date share.';
comment on column public.scholarship_awards.award_percent is
  'Share of total_award_amount this family receives (GSNS: 100/75/50/25 by when the contract is signed and the first payment made).';
comment on column public.scholarship_awards.award_percent_deadline is
  'The date the signed contract and first payment must both arrive by for award_percent to hold.';
comment on column public.scholarship_awards.state_student_number is
  'The state''s student number from the letter (Georgia: GTID).';

-- 575 - The first tuition payment, invoiced by Square when the contract is signed.
--
-- The contract letter: "Once it is signed, you will receive an invoice for your
-- first tuition payment." Nothing sent it. Jimmy, 20 October 2026, tapped:
-- "Square invoice, emailed".

alter table public.student_tuition_instalments
  add column if not exists square_invoice_id text,
  add column if not exists square_invoice_number text,
  add column if not exists square_invoice_error text;

comment on column public.student_tuition_instalments.square_invoice_id is
  'The Square invoice emailed to the family for this instalment (migration 575).';

select count(*) as instalments from public.student_tuition_instalments;

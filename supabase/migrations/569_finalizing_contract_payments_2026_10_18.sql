-- ============================================================================
-- 569  FINALIZING CONTRACT - RECORDING A PAYMENT
--      18 October 2026
-- ============================================================================
--
-- Jimmy, 18 October: "once the initial payment is made move these to
-- Enrolled Students". Asked how payments reach the JAG he gave no preference,
-- so the default stands: Jimmy records them by hand on the Finalizing
-- Contract page. Online payment comes later.
--
-- WHY ON THE INSTALMENT, NOT IN `payments`. `payments.invoice_id` is NOT NULL
-- and there are no invoices - nothing turns an instalment into a bill yet
-- (phase 3 of the 27 September plan). A payment recorded against an invented
-- invoice is a second fact to keep in step. The instalment is already what the
-- Schedule of Tuition Payments prints and what `is_paid` / `paid_at` describe;
-- this adds what a receipt needs beside them.
--
-- A PART PAYMENT IS RECORDED, NOT ROUNDED UP. `paid_amount` below the
-- instalment leaves `is_paid` false. Only a full instalment counts as paid.
--
-- Additive only. Every existing row keeps its values; the 583 imported
-- instalments carry nulls in the new columns.
-- ============================================================================

begin;

alter table public.student_tuition_instalments
  add column if not exists paid_amount numeric,
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists payment_notes text,
  add column if not exists payment_recorded_by uuid references public.users(id) on delete set null,
  add column if not exists payment_recorded_at timestamptz;

alter table public.student_tuition_instalments
  drop constraint if exists instalment_paid_amount_positive;
alter table public.student_tuition_instalments
  add constraint instalment_paid_amount_positive
  check (paid_amount is null or paid_amount > 0);

alter table public.student_tuition_instalments
  drop constraint if exists instalment_payment_method_valid;
alter table public.student_tuition_instalments
  add constraint instalment_payment_method_valid
  check (payment_method is null or payment_method in
    ('ach', 'credit_card', 'check', 'cash', 'square', 'classwallet', 'state_direct', 'scholarship', 'other'));

-- A recorded payment names how it was paid and when it was recorded.
alter table public.student_tuition_instalments
  drop constraint if exists instalment_payment_is_described;
alter table public.student_tuition_instalments
  add constraint instalment_payment_is_described
  check (
    paid_amount is null
    or (payment_method is not null and payment_recorded_at is not null and paid_at is not null)
  );

commit;

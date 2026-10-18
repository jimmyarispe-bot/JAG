-- ============================================================================
-- 568  THE QUIET COLUMNS
--      18 October 2026
-- ============================================================================
--
-- Jimmy, 18 October: the Quiet Students page has four columns -
--   1. Alumni  2. Holding Pattern  3. No - our decision  4. No - family decision
--
-- Three of them already exist as lead stages: not_returning (Alumni),
-- waitlisted (Holding Pattern - what Move to Quiet has always set) and
-- declined (No - our decision). Those are relabelled in code. NO CHILD MOVES.
--
-- The fourth, No - family decision, is new. This adds the one value the
-- database needs for it. Nothing else changes: every existing value stays
-- allowed, so no stored row and no deployed code can be refused by it.
--
-- Safe to run before or after the code deploys.
-- ============================================================================

begin;

alter table public.admissions_leads
  drop constraint admissions_leads_lead_stage_check;

alter table public.admissions_leads
  add constraint admissions_leads_lead_stage_check check (lead_stage in (
    'new_inquiry', 'information_sent', 'tour_scheduled', 'tour_completed',
    'application_started', 'application_submitted', 'records_requested',
    'admissions_review', 'accepted', 'waitlisted', 'declined', 'enrolled',
    'interview_scheduled', 'interest_meeting_held', 'tour_requested',
    'shadow_day_scheduled', 'shadow_day_completed', 'assessment_scheduled',
    'not_returning',
    'family_declined'
  ));

commit;

-- 225: widen admissions_leads.lead_stage to the Academy Way pipeline
--
-- Migration 052 pinned lead_stage to twelve Phase 1 values. Commit dd5070f7
-- rewrote the admissions registry to Academy Way's actual process, which emits
-- six stage values that constraint rejects — so leads in those stages fail on
-- insert while the application layer believes them valid.
--
-- Added here: interview_scheduled, interest_meeting_held, tour_requested,
-- shadow_day_scheduled, assessment_scheduled, not_returning.
--
-- Purely additive. Every value allowed before is still allowed, so existing
-- rows cannot violate the new constraint and no data is rewritten.

alter table public.admissions_leads
  drop constraint if exists admissions_leads_lead_stage_check;

alter table public.admissions_leads
  add constraint admissions_leads_lead_stage_check
  check (
    lead_stage in (
      -- Phase 1 values (migration 052) — unchanged
      'new_inquiry',
      'information_sent',
      'tour_scheduled',
      'tour_completed',
      'application_started',
      'application_submitted',
      'records_requested',
      'admissions_review',
      'accepted',
      'waitlisted',
      'declined',
      'enrolled',
      -- Academy Way pipeline (registry commit dd5070f7)
      'interview_scheduled',
      'interest_meeting_held',
      'tour_requested',
      'shadow_day_scheduled',
      'assessment_scheduled',
      'not_returning'
    )
  );

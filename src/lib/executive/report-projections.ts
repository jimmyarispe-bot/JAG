/**
 * P008 — narrow column projections for executive report views.
 * Consumers only need metric/dimension columns, not full view rows.
 */

export const RPT_ENROLLMENT_SCHOOL_COLS =
  "school_id, school_name, active_students" as const;

export const RPT_ENROLLMENT_CAMPUS_COLS =
  "campus_id, campus_name, active_students" as const;

export const RPT_ENROLLMENT_PROGRAM_COLS =
  "program, active_students" as const;

export const RPT_FINANCIAL_KPI_COLS =
  "school_id, school_name, total_collected, outstanding_ar" as const;

export const RPT_OUTCOMES_COLS =
  "school_id, school_name, avg_success_score" as const;

export const RPT_WORKFORCE_COLS =
  "school_id, school_name, active_staff" as const;

export const RPT_PIPELINE_COLS = "school_id, lead_count" as const;

export const EXECUTIVE_KPI_DEFINITION_COLS =
  "kpi_key, display_name, category, unit, target_value, warning_threshold, critical_threshold, higher_is_better, sort_order" as const;

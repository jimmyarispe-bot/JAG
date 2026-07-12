/**
 * Executive Intelligence Dashboard — types (Sprint 024 foundation).
 */

export interface IntelligenceDashboardProjection {
  generatedAt: string;
  headline: string;
  sections: Array<{ id: string; title: string; summary: string }>;
}

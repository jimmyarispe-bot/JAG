/**
 * Enterprise ECC widget data (Sprint 078) — provider-neutral operational surfaces.
 */

import {
  buildEnterpriseGraph,
  type EnterpriseGraph,
} from "@/lib/platform/integrations/connectors/enterprise/intelligence/enterprise-graph";
import { buildCrmEccWidgets } from "@/lib/platform/integrations/connectors/crm/intelligence/ecc-widgets";
import { buildEducationEccWidgets } from "@/lib/platform/integrations/connectors/education/intelligence/ecc-widgets";

export type CrmPipelineWidget = {
  kind: "crm_pipeline";
  title: string;
  pipelineValue: number;
  openDeals: number;
};

export type WorkforceWidget = {
  kind: "workforce";
  title: string;
  headcount: number;
  openRoles: number;
};

export type StudentEnrollmentWidget = {
  kind: "student_enrollment";
  title: string;
  activeStudents: number;
  attendanceRate: number;
};

export type ProgramFundingWidget = {
  kind: "program_funding";
  title: string;
  programFunding: number;
  openCompliance: number;
};

export type EnterpriseEccWidgets = {
  crmPipeline: CrmPipelineWidget;
  workforce: WorkforceWidget;
  studentEnrollment: StudentEnrollmentWidget;
  programFunding: ProgramFundingWidget;
  graph: EnterpriseGraph;
};

export function buildEnterpriseEccWidgets(
  organizationId: string
): EnterpriseEccWidgets | null {
  const graph = buildEnterpriseGraph(organizationId);
  if (!graph) return null;
  const { scores } = graph;
  const crm = buildCrmEccWidgets(organizationId);
  const education = buildEducationEccWidgets(organizationId);

  return {
    graph,
    crmPipeline: crm?.crmPipeline ?? {
      kind: "crm_pipeline",
      title: "CRM Pipeline",
      pipelineValue: scores.pipelineValue,
      openDeals: scores.openDeals,
    },
    workforce: {
      kind: "workforce",
      title: "Workforce",
      headcount: scores.headcount,
      openRoles: scores.openRoles,
    },
    studentEnrollment: education?.studentEnrollment ?? {
      kind: "student_enrollment",
      title: "Student Enrollment",
      activeStudents: scores.activeStudents,
      attendanceRate: scores.attendanceRate,
    },
    programFunding: {
      kind: "program_funding",
      title: "Program Funding",
      programFunding: scores.programFunding,
      openCompliance: scores.openCompliance,
    },
  };
}

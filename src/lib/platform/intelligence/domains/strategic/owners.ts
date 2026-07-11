/**
 * Strategic Intelligence — owners.
 *
 * Assigns Primary Owner, Executive Sponsor, Supporting Team, and Approver.
 */

import type {
  StrategicGoal,
  StrategicOpportunity,
  StrategicOpportunityKind,
  StrategicOwners,
} from "@/lib/platform/intelligence/domains/strategic/types";

/** Optional owner overrides. */
export interface StrategicOwnersOptions {
  defaults?: Partial<StrategicOwners>;
}

/**
 * Resolves ownership for strategic work.
 */
export class StrategicOwnersService {
  private readonly defaults: Partial<StrategicOwners>;

  constructor(options: StrategicOwnersOptions = {}) {
    this.defaults = options.defaults ?? {};
  }

  /**
   * Assign owners based on primary opportunity kind / goal priority.
   */
  assign(
    primaryGoal: StrategicGoal | null,
    primaryOpportunity: StrategicOpportunity | null
  ): StrategicOwners {
    const kind = primaryOpportunity?.kind;
    const roleSet = rolesFor(kind);

    return {
      primaryOwner: this.defaults.primaryOwner ?? roleSet.primaryOwner,
      executiveSponsor: this.defaults.executiveSponsor ?? roleSet.executiveSponsor,
      supportingTeam: this.defaults.supportingTeam ?? roleSet.supportingTeam,
      approver: this.defaults.approver ?? roleSet.approver,
      metadata: {
        goalId: primaryGoal?.id ?? null,
        opportunityId: primaryOpportunity?.opportunityId ?? null,
        kind: kind ?? null,
      },
    };
  }

  /**
   * Create an explicit ownership record.
   */
  create(input: {
    primaryOwner: string;
    executiveSponsor: string;
    supportingTeam: string[];
    approver: string;
  }): StrategicOwners {
    return {
      primaryOwner: input.primaryOwner,
      executiveSponsor: input.executiveSponsor,
      supportingTeam: [...input.supportingTeam],
      approver: input.approver,
    };
  }
}

function rolesFor(kind: StrategicOpportunityKind | undefined): StrategicOwners {
  switch (kind) {
    case "financial_weakness":
      return {
        primaryOwner: "Chief Financial Officer",
        executiveSponsor: "Head of School",
        supportingTeam: ["Controller", "Billing Lead", "Finance Analyst"],
        approver: "Board Finance Committee Chair",
      };
    case "growth_opportunity":
      return {
        primaryOwner: "Director of Admissions",
        executiveSponsor: "Head of School",
        supportingTeam: ["Marketing Lead", "Campus Principals"],
        approver: "Executive Leadership Team",
      };
    case "staffing_issue":
      return {
        primaryOwner: "Director of People",
        executiveSponsor: "Head of School",
        supportingTeam: ["HR Generalist", "Instructional Coaches"],
        approver: "Executive Leadership Team",
      };
    case "compliance_risk":
      return {
        primaryOwner: "Compliance Officer",
        executiveSponsor: "Head of School",
        supportingTeam: ["Program Directors", "Legal Counsel"],
        approver: "Board Compliance Liaison",
      };
    case "customer_experience_issue":
      return {
        primaryOwner: "Director of Family Success",
        executiveSponsor: "Chief Operating Officer",
        supportingTeam: ["Front Office Leads", "Communications"],
        approver: "Head of School",
      };
    case "mission_opportunity":
      return {
        primaryOwner: "Chief Mission Officer",
        executiveSponsor: "Head of School",
        supportingTeam: ["Program Directors", "Community Partners"],
        approver: "Board Mission Committee Chair",
      };
    case "operational_weakness":
      return {
        primaryOwner: "Chief Operating Officer",
        executiveSponsor: "Head of School",
        supportingTeam: ["Ops Managers", "Data Analyst"],
        approver: "Executive Leadership Team",
      };
    case "organizational_risk":
    case undefined:
      return {
        primaryOwner: "Chief of Staff",
        executiveSponsor: "Head of School",
        supportingTeam: ["Risk Owner", "Cross-Functional Leads"],
        approver: "Board Chair",
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

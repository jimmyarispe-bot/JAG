/** Opportunity category discovery suite (Sprint 035). */
import type * as C from "@/lib/platform/intelligence/opportunity/contracts";
import { clamp, defaultOpportunityLenses, priorityFromScore } from "@/lib/platform/intelligence/opportunity/models";
import type * as T from "@/lib/platform/intelligence/opportunity/types";

type Id = (prefix: string) => string;

function record(
  input: C.BaselineInput,
  createId: Id,
  category: T.OpportunityCategory,
  categoryLabel: string,
  title: string,
  description: string,
  financialFactor: number,
  missionFactor: number,
  costFactor: number,
  days: number,
  domain: T.OpportunityOriginatingDomain = "opportunity"
): T.CategoryOpportunityRecord {
  const score = clamp(
    input.baseline.executionReadiness * 0.25 +
      input.baseline.missionAlignment * 0.2 +
      input.baseline.marketPosition * 0.2 +
      input.baseline.financialScore * 0.2 +
      (100 - input.baseline.riskTolerance * 100) * 0.15
  );
  const estimatedFinancialImpact = Math.round(input.baseline.annualRevenue * financialFactor * (0.7 + score / 250));
  const implementationCost = Math.round(estimatedFinancialImpact * costFactor);
  const estimatedMissionImpact = clamp(missionFactor * 100 * (0.7 + score / 300));
  const roi = implementationCost > 0 ? (estimatedFinancialImpact - implementationCost) / implementationCost : estimatedFinancialImpact / 10_000;
  return {
    id: createId(category),
    title,
    description,
    category,
    categoryLabel,
    estimatedFinancialImpact,
    estimatedMissionImpact,
    implementationCost,
    score,
    roi,
    confidence: clamp01Score(0.55 + score / 250),
    priority: priorityFromScore(score),
    expectedTimelineDays: days,
    stage: days <= 90 ? "prioritized" : "evaluated",
    originatingDomain: domain,
    lenses: defaultOpportunityLenses(categoryLabel),
    narrative: `${title} offers ~$${estimatedFinancialImpact.toLocaleString()} financial impact with ${Math.round(estimatedMissionImpact)} mission impact and a ${Math.round(score)} opportunity score.`,
  };
}

function clamp01Score(value: number): number {
  return Math.min(1, Math.max(0, value));
}

class Base {
  constructor(protected readonly createId: Id = (p) => `${p}-${Date.now()}`) {}
}

export class RevenueOpportunities extends Base implements C.RevenueOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "revenue", "Revenue Opportunities", "Expand high-margin program revenue", "Grow tuition, contracts, and productized services with healthy margins.", 0.08, 0.7, 0.25, 120, "revenue"),
    ];
  }
}
export class FundingOpportunities extends Base implements C.FundingOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "funding", "Funding Opportunities", "Accelerate diversified funding pursuits", "Prioritize grants, contracts, and philanthropy already surfaced by Funding Intelligence.", 0.12, 0.75, 0.18, 150, "funding"),
    ];
  }
}
export class CostReductionOpportunities extends Base implements C.CostReductionOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "cost_reduction", "Cost Reduction Opportunities", "Reduce non-mission overhead", "Eliminate redundant spend while protecting mission-critical capacity.", 0.05, 0.45, 0.12, 60),
    ];
  }
}
export class PricingOpportunities extends Base implements C.PricingOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "pricing", "Pricing Opportunities", "Optimize value-based pricing", "Align pricing tiers to willingness-to-pay and mission access goals.", 0.04, 0.55, 0.08, 45, "revenue"),
    ];
  }
}
export class MarketExpansionOpportunities extends Base implements C.MarketExpansionOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "market_expansion", "Market Expansion", "Enter adjacent customer segments", "Expand into underserved segments that fit DNA and capabilities.", 0.09, 0.7, 0.35, 180),
    ];
  }
}
export class GeographicExpansionOpportunities extends Base implements C.GeographicExpansionOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "geographic_expansion", "Geographic Expansion", "Pilot a new geography", "Test a controlled geographic expansion with shared services leverage.", 0.1, 0.65, 0.4, 240),
    ];
  }
}
export class CustomerGrowthOpportunities extends Base implements C.CustomerGrowthOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "customer_growth", "Customer Growth", "Increase acquisition conversion", "Improve funnel conversion across admissions, sales, or enrollment pathways.", 0.06, 0.6, 0.2, 90, "revenue"),
    ];
  }
}
export class RetentionOpportunities extends Base implements C.RetentionOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "retention", "Retention Opportunities", "Reduce churn with early interventions", "Deploy retention plays that protect lifetime value and mission continuity.", 0.07, 0.8, 0.15, 75),
    ];
  }
}
export class PartnershipOpportunities extends Base implements C.PartnershipOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "partnership", "Partnership Opportunities", "Launch mission-aligned partnerships", "Co-deliver programs with partners that extend reach at lower capital intensity.", 0.05, 0.85, 0.2, 100),
    ];
  }
}
export class StrategicAllianceOpportunities extends Base implements C.StrategicAllianceOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "strategic_alliance", "Strategic Alliance Opportunities", "Form a strategic alliance", "Create a multi-year alliance that expands capabilities and brand leverage.", 0.08, 0.75, 0.3, 210),
    ];
  }
}
export class AcquisitionOpportunities extends Base implements C.AcquisitionOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "acquisition", "Acquisition Opportunities", "Evaluate a tuck-in acquisition", "Acquire complementary capability or capacity where build-vs-buy favors buy.", 0.15, 0.55, 0.7, 365),
    ];
  }
}
export class MergerOpportunities extends Base implements C.MergerOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "merger", "Merger Opportunities", "Assess a merger of equals pathway", "Explore merger scenarios that strengthen sustainability and mission scale.", 0.18, 0.7, 0.8, 540),
    ];
  }
}
export class TechnologyOpportunities extends Base implements C.TechnologyOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "technology", "Technology Opportunities", "Modernize core operating systems", "Upgrade technology that unlocks productivity, insight, and service quality.", 0.06, 0.6, 0.35, 180),
    ];
  }
}
export class AutomationOpportunities extends Base implements C.AutomationOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "automation", "Automation Opportunities", "Automate high-volume workflows", "Automate repetitive operational work to free capacity for mission delivery.", 0.045, 0.5, 0.22, 90),
    ];
  }
}
export class VendorOptimizationOpportunities extends Base implements C.VendorOptimizationOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "vendor_optimization", "Vendor Optimization", "Consolidate and renegotiate vendors", "Reduce vendor sprawl and improve service-level economics.", 0.035, 0.35, 0.1, 60),
    ];
  }
}
export class ProcurementSavingsOpportunities extends Base implements C.ProcurementSavingsOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "procurement_savings", "Procurement Savings", "Capture procurement savings", "Apply category management and competitive sourcing to major spend pools.", 0.03, 0.3, 0.08, 45),
    ];
  }
}
export class RealEstateOpportunities extends Base implements C.RealEstateOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "real_estate", "Real Estate Optimization", "Optimize facilities footprint", "Right-size facilities utilization and lease commitments.", 0.055, 0.4, 0.25, 200),
    ];
  }
}
export class AssetOptimizationOpportunities extends Base implements C.AssetOptimizationOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "asset_optimization", "Asset Optimization", "Improve underutilized asset yield", "Monetize or redeploy underperforming assets without mission harm.", 0.04, 0.35, 0.15, 120),
    ];
  }
}
export class LicensingOpportunities extends Base implements C.LicensingOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "licensing", "Licensing Opportunities", "License proven programs externally", "License curriculum, IP, or operating playbooks to aligned organizations.", 0.05, 0.65, 0.18, 150),
    ];
  }
}
export class IntellectualPropertyOpportunities extends Base implements C.IntellectualPropertyOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "intellectual_property", "Intellectual Property Opportunities", "Protect and commercialize IP", "Strengthen IP protection and convert know-how into durable advantage.", 0.045, 0.55, 0.2, 180),
    ];
  }
}
export class InnovationOpportunities extends Base implements C.InnovationOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "innovation", "Innovation Opportunities", "Launch a controlled innovation pilot", "Pilot a high-upside innovation with gated investment and learning loops.", 0.07, 0.75, 0.28, 120, "continuous-improvement"),
    ];
  }
}
export class MissionImpactOpportunities extends Base implements C.MissionImpactOpportunities {
  analyze(input: C.BaselineInput): T.CategoryOpportunityRecord[] {
    return [
      record(input, this.createId, "mission_impact", "Mission Impact Opportunities", "Scale highest-impact program pathway", "Expand the program pathway with the strongest mission outcome evidence.", 0.06, 0.95, 0.22, 150, "organization-health"),
    ];
  }
}

export class OpportunityCategoryEngine implements C.OpportunityCategoryEngine {
  private readonly revenue: C.RevenueOpportunities;
  private readonly funding: C.FundingOpportunities;
  private readonly cost: C.CostReductionOpportunities;
  private readonly pricing: C.PricingOpportunities;
  private readonly market: C.MarketExpansionOpportunities;
  private readonly geo: C.GeographicExpansionOpportunities;
  private readonly customer: C.CustomerGrowthOpportunities;
  private readonly retention: C.RetentionOpportunities;
  private readonly partnership: C.PartnershipOpportunities;
  private readonly alliance: C.StrategicAllianceOpportunities;
  private readonly acquisition: C.AcquisitionOpportunities;
  private readonly merger: C.MergerOpportunities;
  private readonly technology: C.TechnologyOpportunities;
  private readonly automation: C.AutomationOpportunities;
  private readonly vendor: C.VendorOptimizationOpportunities;
  private readonly procurement: C.ProcurementSavingsOpportunities;
  private readonly realEstate: C.RealEstateOpportunities;
  private readonly asset: C.AssetOptimizationOpportunities;
  private readonly licensing: C.LicensingOpportunities;
  private readonly ip: C.IntellectualPropertyOpportunities;
  private readonly innovation: C.InnovationOpportunities;
  private readonly mission: C.MissionImpactOpportunities;

  constructor(d: C.OpportunityDependencies = {}) {
    const id = d.createId ?? ((p: string) => `${p}-${Date.now()}`);
    this.revenue = d.revenueOpportunities ?? new RevenueOpportunities(id);
    this.funding = d.fundingOpportunities ?? new FundingOpportunities(id);
    this.cost = d.costReductionOpportunities ?? new CostReductionOpportunities(id);
    this.pricing = d.pricingOpportunities ?? new PricingOpportunities(id);
    this.market = d.marketExpansionOpportunities ?? new MarketExpansionOpportunities(id);
    this.geo = d.geographicExpansionOpportunities ?? new GeographicExpansionOpportunities(id);
    this.customer = d.customerGrowthOpportunities ?? new CustomerGrowthOpportunities(id);
    this.retention = d.retentionOpportunities ?? new RetentionOpportunities(id);
    this.partnership = d.partnershipOpportunities ?? new PartnershipOpportunities(id);
    this.alliance = d.strategicAllianceOpportunities ?? new StrategicAllianceOpportunities(id);
    this.acquisition = d.acquisitionOpportunities ?? new AcquisitionOpportunities(id);
    this.merger = d.mergerOpportunities ?? new MergerOpportunities(id);
    this.technology = d.technologyOpportunities ?? new TechnologyOpportunities(id);
    this.automation = d.automationOpportunities ?? new AutomationOpportunities(id);
    this.vendor = d.vendorOptimizationOpportunities ?? new VendorOptimizationOpportunities(id);
    this.procurement = d.procurementSavingsOpportunities ?? new ProcurementSavingsOpportunities(id);
    this.realEstate = d.realEstateOpportunities ?? new RealEstateOpportunities(id);
    this.asset = d.assetOptimizationOpportunities ?? new AssetOptimizationOpportunities(id);
    this.licensing = d.licensingOpportunities ?? new LicensingOpportunities(id);
    this.ip = d.intellectualPropertyOpportunities ?? new IntellectualPropertyOpportunities(id);
    this.innovation = d.innovationOpportunities ?? new InnovationOpportunities(id);
    this.mission = d.missionImpactOpportunities ?? new MissionImpactOpportunities(id);
  }

  discover(input: C.BaselineInput): Record<T.OpportunityCategory, T.CategoryOpportunityRecord[]> {
    return {
      revenue: this.revenue.analyze(input),
      funding: this.funding.analyze(input),
      cost_reduction: this.cost.analyze(input),
      pricing: this.pricing.analyze(input),
      market_expansion: this.market.analyze(input),
      geographic_expansion: this.geo.analyze(input),
      customer_growth: this.customer.analyze(input),
      retention: this.retention.analyze(input),
      partnership: this.partnership.analyze(input),
      strategic_alliance: this.alliance.analyze(input),
      acquisition: this.acquisition.analyze(input),
      merger: this.merger.analyze(input),
      technology: this.technology.analyze(input),
      automation: this.automation.analyze(input),
      vendor_optimization: this.vendor.analyze(input),
      procurement_savings: this.procurement.analyze(input),
      real_estate: this.realEstate.analyze(input),
      asset_optimization: this.asset.analyze(input),
      licensing: this.licensing.analyze(input),
      intellectual_property: this.ip.analyze(input),
      innovation: this.innovation.analyze(input),
      mission_impact: this.mission.analyze(input),
    };
  }
}

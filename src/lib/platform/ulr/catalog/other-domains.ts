import type { UlrStrand, UlrSubStrand } from "@/lib/platform/ulr/types";

/** Starter strands for non-SL production domains (population pending). */
export const OTHER_DOMAIN_STRANDS: UlrStrand[] = [
  {
    strandKey: "domain.real_life_math.strand.money",
    domainKey: "domain.real_life_math",
    title: "Money",
    description: "Cash, coins, making change",
    version: "1.0.0",
    status: "published",
    sortOrder: 10,
  },
  {
    strandKey: "domain.real_life_math.strand.budgeting",
    domainKey: "domain.real_life_math",
    title: "Budgeting",
    description: "Personal and household budgeting",
    version: "1.0.0",
    status: "published",
    sortOrder: 20,
  },
  {
    strandKey: "domain.litlab.strand.reading",
    domainKey: "domain.litlab",
    title: "Reading",
    description: "Literature and close reading",
    version: "1.0.0",
    status: "published",
    sortOrder: 10,
  },
  {
    strandKey: "domain.earthology.strand.inquiry",
    domainKey: "domain.earthology",
    title: "Scientific Inquiry",
    description: "Environmental inquiry practices",
    version: "1.0.0",
    status: "published",
    sortOrder: 10,
  },
  {
    strandKey: "domain.life_lab.strand.financial_literacy",
    domainKey: "domain.life_lab",
    title: "Financial Literacy",
    description: "Personal finance readiness",
    version: "1.0.0",
    status: "published",
    sortOrder: 10,
  },
  {
    strandKey: "domain.ai_venture_lab.strand.venture_design",
    domainKey: "domain.ai_venture_lab",
    title: "Venture Design",
    description: "Entrepreneurship and venture creation",
    version: "1.0.0",
    status: "published",
    sortOrder: 10,
  },
];

export const OTHER_DOMAIN_SUB_STRANDS: UlrSubStrand[] = [
  {
    subStrandKey: "domain.real_life_math.strand.money.sub_strand.foundational",
    strandKey: "domain.real_life_math.strand.money",
    domainKey: "domain.real_life_math",
    title: "Foundational Money Skills",
    description: "Population pending — Real-Life Math Phase 1",
    version: "1.0.0",
    status: "published",
    sortOrder: 10,
    metadata: { populated: false },
  },
];

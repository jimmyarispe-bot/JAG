# Changelog — Legal, Compliance & Risk Intelligence

## 0.1.0 — Sprint 042

- Initial release of Legal, Compliance & Risk Intelligence (`legal-compliance-risk`).
- 11 capability submodules: contract, regulatory, compliance, enterprise risk,
  policy, audit, license/permit, insurance, litigation, vendor/third-party risk,
  and cyber governance intelligence.
- Enterprise risk register across all 11 risk categories and compliance tracking
  across all 9 compliance scopes.
- Compliance Health Score, Risk Health Score (inverted pressure), Enterprise Risk /
  Compliance / Contract / Audit dashboards, Executive Risk Brief, Board Compliance
  Brief, and a Corrective Action Plan.
- 8-field corrective-action recommendation lens on every recommendation.
- Composes onto Document Intelligence (hard DAG dependency) and integrates soft
  signals from Knowledge, Board Governance, Executive Decision, Human Capital,
  Funding, Operations, Customer, and Organizational Improvement.
- Wired as the terminal module in the intelligence platform pipeline (after
  `document`), registered/active in the OIOS domain registry, and exposed on
  `createIntelligenceService().legalComplianceRisk`.

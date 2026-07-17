# JAG Agents (placeholder surface)

Several agent module files under this folder are **empty stubs** (including `hr-agent.ts`, `finance.agent.ts`, `registry.ts`, `index.ts`).

**A.1 decision:** Do not invent agent implementations here during architecture remediation.  
Call sites must use real platform services (workflow, notifications, domain actions) until a designed agent runtime ships.

Empty files are retained only to avoid breaking path expectations in documentation; they export nothing.

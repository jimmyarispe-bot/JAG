<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:academyos-crud-gate -->
# AcademyOS Module Completion Standard (v2)

A module cannot be marked complete unless it passes **all** applicable gates (CRUD, Security, Workflow, EI, Audit, Communications, Docs, Tests, A11y, Mobile, Performance, Extension, UX, Production).

- Spec: `docs/platform/module-completion-standard.md` (+ CRUD: `docs/platform/crud-standards.md`)
- Registry: `src/lib/platform/release/`
- Dashboard: `/dashboard/executive/release`
- Validate: `npm run validate:release` (also `validate:crud`, `validate:security`, `validate:workflow`, `validate:ei`, …)
- Status model: planned → building → feature-complete → crud-complete → workflow-complete → ei-complete → tested → production-ready → released
<!-- END:academyos-crud-gate -->

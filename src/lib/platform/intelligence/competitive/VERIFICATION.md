# Verification Checklist (Sprint 047)

- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run tests/unit/intelligence/competitive.test.ts` passes
- [ ] `npx vitest run tests/unit/intelligence/economic.test.ts` passes
- [ ] `npx vitest run tests/unit/intelligence/infrastructure.test.ts` passes
- [ ] `npx vitest run tests/unit/intelligence/oios-core.test.ts` passes
- [ ] competitive appears last in PIPELINE_ORDER
- [ ] economic appears at(-2) in pipeline

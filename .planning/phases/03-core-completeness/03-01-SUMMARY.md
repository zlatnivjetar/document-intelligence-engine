---
phase: 03-core-completeness
plan: "01"
subsystem: core
tags: [zod, templates, validation]
requires:
  - phase: 02-extraction-pipeline-invoice-template
    provides: invoice template pattern, core barrel exports
provides:
  - receipt built-in template with schema tests
  - W-2 built-in template with schema tests
  - core barrel exports for all built-in templates
affects: [phase-03-02, phase-03-03, web, cli]
tech-stack:
  added: []
  patterns:
    - explicit Zod shape aliases for exported template schemas
    - nullable template fields for document values that may be absent
key-files:
  created:
    - packages/core/src/templates/receipt.ts
    - packages/core/src/templates/receipt.test.ts
    - packages/core/src/templates/w2.ts
    - packages/core/src/templates/w2.test.ts
  modified:
    - packages/core/src/index.ts
key-decisions:
  - "New built-in templates mirror the invoice schema pattern so all templates share the same Zod/object export contract."
  - "Receipt subtotal/tax and W-2 state fields remain nullable instead of optional to represent missing document values explicitly."
patterns-established:
  - "Built-in templates live under packages/core/src/templates with matching *.test.ts coverage."
  - "Public template APIs are exported only through packages/core/src/index.ts."
requirements-completed: [TMPL-02, TMPL-03]
duration: 2 min
completed: 2026-03-29
---

# Phase 03 Plan 01: Built-in Template Expansion Summary

**Receipt and W-2 built-in Zod templates exported through the shared core package with schema-shape validation coverage**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T10:21:27+02:00
- **Completed:** 2026-03-29T10:23:22.2815479+02:00
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added `receiptSchema` and `ReceiptData` with coverage for required fields, nullables, and line-item validation.
- Added `w2Schema` and `W2Data` with coverage for W-2 field requirements and nullable employer/employee/state fields.
- Extended the `@docpipe/core` barrel so later plans can import invoice, receipt, and W-2 templates from one place.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create receipt Zod schema with all TMPL-02 fields and unit tests** - `14ea4a7` (feat)
2. **Task 2: Create W-2 Zod schema with all TMPL-03 fields, unit tests, and wire both templates into barrel** - `4e67a14` (feat)

**Plan metadata:** this plan summary, state, roadmap, and requirements update commit

## Files Created/Modified
- `packages/core/src/templates/receipt.ts` - receipt template schema and inferred type.
- `packages/core/src/templates/receipt.test.ts` - receipt schema validation coverage.
- `packages/core/src/templates/w2.ts` - W-2 template schema and inferred type.
- `packages/core/src/templates/w2.test.ts` - W-2 schema validation coverage.
- `packages/core/src/index.ts` - public exports for receipt and W-2 templates.

## Decisions Made
- New built-in templates reuse the invoice schema structure so every template follows the same explicit-shape export pattern under `isolatedDeclarations`.
- Nullable fields are preferred over optional properties when a document may omit a value but the extraction result should still surface that absence explicitly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `turbo` was not available on PATH in PowerShell, so the repo-wide verification used `pnpm exec turbo build`. The build still passed without changing project code.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Template exports are ready for PDF routing and validator integration in the remaining Phase 3 plans.
- No blockers remain for Phase 03-02.

---
*Phase: 03-core-completeness*
*Completed: 2026-03-29*

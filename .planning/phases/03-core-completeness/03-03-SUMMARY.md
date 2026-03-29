---
phase: 03-core-completeness
plan: "03"
subsystem: core
tags: [validators, zod, extraction, warnings]
requires:
  - phase: 03-core-completeness
    provides: template exports and PDF routing from 03-01 and 03-02
provides:
  - invoice business-rule validators
  - warning support on extraction results
  - custom schema and built-in template extraction coverage
affects: [phase-03-04, web, cli]
tech-stack:
  added: []
  patterns:
    - post-extraction validators that annotate results without changing retry behavior
    - schema-agnostic extraction tests using mocked generateObject responses
key-files:
  created:
    - packages/core/src/validators/invoice-validators.ts
    - packages/core/src/validators/invoice-validators.test.ts
  modified:
    - packages/core/src/extract.ts
    - packages/core/src/extract.test.ts
    - packages/core/src/index.ts
    - packages/core/src/types.ts
key-decisions:
  - "Warnings are optional annotations on ExtractionResult so validator findings never fail otherwise valid extractions."
  - "Validators execute after schema validation succeeds, preserving the existing retry loop for structural extraction failures only."
patterns-established:
  - "Business-rule validators live under packages/core/src/validators and are exported from the core barrel."
  - "End-to-end extract() tests cover both custom schemas and built-in templates with mocked provider output."
requirements-completed: [EXTRACT-07, TMPL-04]
duration: 2 min
completed: 2026-03-29
---

# Phase 03 Plan 03: Validator Summary

**Invoice business-rule warnings integrated into extract() with custom-schema, receipt, and W-2 end-to-end coverage**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T10:30:33+02:00
- **Completed:** 2026-03-29T10:32:18.8771607+02:00
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added `ExtractionWarning` plus `validateInvoice()` for zero totals, future dates, and subtotal mismatches.
- Extended `extract()` to run optional validators after successful schema extraction and attach warnings non-fatally.
- Proved TMPL-04 with a custom schema test and added full extraction-path tests for the new receipt and W-2 templates.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ExtractionWarning type, implement invoice validators with tests** - `c4494a3` (feat)
2. **Task 2: Wire validators into extract() and add custom schema end-to-end test (TMPL-04)** - `8bc95b0` (feat)

**Plan metadata:** this plan summary, state, roadmap, and requirements update commit

## Files Created/Modified
- `packages/core/src/types.ts` - warning interface and optional warnings field on extraction results.
- `packages/core/src/validators/invoice-validators.ts` - invoice business-rule validator implementation.
- `packages/core/src/validators/invoice-validators.test.ts` - validator coverage for all warning rules and the happy path.
- `packages/core/src/extract.ts` - validator hook added after successful extraction.
- `packages/core/src/extract.test.ts` - validator, custom-schema, receipt, and W-2 extraction coverage.
- `packages/core/src/index.ts` - barrel export for `validateInvoice` and `ExtractionWarning`.

## Decisions Made
- Validator findings are warnings, not failures, so schema-correct output still returns usable data to callers.
- The validator hook runs after `extractCore()` succeeds; retries remain reserved for provider and schema-validation failures.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The core package now exposes complete template, routing, and validator APIs for thin consumers.
- No blockers remain for the LIB-03 consumer verification plan.

---
*Phase: 03-core-completeness*
*Completed: 2026-03-29*

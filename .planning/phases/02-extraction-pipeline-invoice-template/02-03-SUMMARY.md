---
phase: 02-extraction-pipeline-invoice-template
plan: "03"
subsystem: api
tags: [zod, templates, invoice, schema, types]

# Dependency graph
requires:
  - phase: 02-01
    provides: extract() API contract and schema-driven extraction entrypoint
provides:
  - built-in invoiceSchema template with all TMPL-01 top-level fields
  - InvoiceData inferred type for typed extract() results
  - public barrel exports for invoiceSchema and InvoiceData
affects: [02-04, 03-core-completeness, 04-web-app, 06-cli]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - built-in templates live under packages/core/src/templates with colocated tests
    - schema module exports both the Zod object and the inferred TypeScript type
    - exported Zod schemas use explicit internal shape annotations to satisfy isolatedDeclarations

key-files:
  created:
    - packages/core/src/templates/invoice.ts
    - packages/core/src/templates/invoice.test.ts
  modified:
    - packages/core/src/index.ts

key-decisions:
  - "vendorAddress, dueDate, taxAmount, and taxRate are nullable because real invoices may omit them while still matching the built-in template contract."
  - "invoiceSchema uses explicit shape annotations instead of full inference so it compiles under the repo's isolatedDeclarations setting."

patterns-established:
  - "Template pattern: define line-item sub-schema first, then export the parent document schema plus z.infer type."
  - "Template tests assert both parsing behavior and exact top-level field names to protect contract drift."

requirements-completed: [TMPL-01]

# Metrics
duration: 2min
completed: "2026-03-29"
---

# Phase 02 Plan 03: Invoice Template Summary

**Built-in invoiceSchema with nullable optional invoice fields, numeric money values, and public InvoiceData typing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T06:43:50Z
- **Completed:** 2026-03-29T06:45:55Z
- **Tasks:** 2 of 2
- **Files modified:** 3

## Accomplishments
- Added `invoiceSchema` with all 10 TMPL-01 fields and a line-item sub-schema using numeric monetary fields throughout.
- Added 7 invoice template tests covering valid data, nullable fields, invalid totals, and exact top-level field keys.
- Re-exported `invoiceSchema` and `InvoiceData` from `@docpipe/core` so consumers can use the built-in template directly with `extract()`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create invoice Zod schema with all required fields and unit tests** - `aa98d78` (test), `b3580cb` (feat)
2. **Task 2: Wire invoice template exports into the package barrel** - `bf1120a` (feat)

**Plan metadata:** _(pending final commit)_

## Files Created/Modified
- `packages/core/src/templates/invoice.ts` - invoiceSchema, InvoiceData, explicit Zod shape typing for isolatedDeclarations compliance
- `packages/core/src/templates/invoice.test.ts` - contract tests for valid invoices, nullable optional fields, invalid totals, and required field keys
- `packages/core/src/index.ts` - barrel exports for invoiceSchema and InvoiceData

## Decisions Made
- Kept vendorAddress, dueDate, taxAmount, and taxRate nullable so the built-in template matches invoices that omit those fields.
- Preserved numeric types for all money-related fields so extracted results are ready for downstream arithmetic without extra parsing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added explicit Zod shape annotations for isolatedDeclarations**
- **Found during:** Task 1 (Create invoice Zod schema with all required fields and unit tests)
- **Issue:** The repo's `isolatedDeclarations` setting rejected the inferred exported `invoiceSchema` shape during type-check.
- **Fix:** Added explicit internal `InvoiceLineItemShape` and `InvoiceSchemaShape` annotations so the exported schema compiles without weakening types.
- **Files modified:** `packages/core/src/templates/invoice.ts`
- **Verification:** `pnpm --filter @docpipe/core type-check`, `pnpm --filter @docpipe/core test`
- **Committed in:** `b3580cb` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking issue)
**Impact on plan:** The fix was required by the repo's existing TypeScript settings. No scope creep.

## Issues Encountered
- `packages/core/package.json` still emits the existing exports-condition ordering warning during builds. Plan `02-04` remains the right place to fix it because that plan audits the publish/install surface.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `02-04` can now validate the consumer install path against the full public API: `extract`, `createAnthropicProvider`, and `invoiceSchema`.
- Phase 3 can follow the same `src/templates/<name>.ts` plus `<name>.test.ts` pattern for receipt and W-2 templates.

## Self-Check: PASSED

Verified after implementation:
- `pnpm --filter @docpipe/core test`
- `pnpm --filter @docpipe/core type-check`
- `pnpm --filter @docpipe/core build`
- `pnpm build`

Task commits present in git log:
- `aa98d78` - test(02-03): add invoice schema coverage
- `b3580cb` - feat(02-03): add built-in invoice template schema
- `bf1120a` - feat(02-03): export invoice template from core barrel

---
*Phase: 02-extraction-pipeline-invoice-template*
*Completed: 2026-03-29*

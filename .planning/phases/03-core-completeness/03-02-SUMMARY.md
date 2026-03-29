---
phase: 03-core-completeness
plan: "02"
subsystem: core
tags: [pdf, unpdf, routing, extraction]
requires:
  - phase: 03-core-completeness
    provides: built-in template exports from 03-01
provides:
  - unpdf-backed PDF type detection
  - extraction result annotation with pdfType
  - public routing utilities for core consumers
affects: [phase-03-03, web, cli]
tech-stack:
  added:
    - unpdf
  patterns:
    - preflight PDF routing computed once before extraction retries
    - routingOverride for deterministic PDF-path tests
key-files:
  created:
    - packages/core/src/pdf-router.ts
    - packages/core/src/pdf-router.test.ts
  modified:
    - packages/core/package.json
    - packages/core/src/extract.ts
    - packages/core/src/extract.test.ts
    - packages/core/src/index.ts
    - packages/core/src/types.ts
    - pnpm-lock.yaml
key-decisions:
  - "PDF routing uses unpdf with mergePages enabled and a 50-character non-whitespace threshold."
  - "extract() computes pdfType once per PDF input and exposes routingOverride so tests avoid real PDF parsing."
patterns-established:
  - "Core PDF utilities are exported through packages/core/src/index.ts alongside templates."
  - "Extraction annotations are optional fields on ExtractionResult so non-PDF callers stay backward compatible."
requirements-completed: [INPUT-03]
duration: 2 min
completed: 2026-03-29
---

# Phase 03 Plan 02: PDF Routing Summary

**Unpdf-backed PDF type detection with extraction result annotation and deterministic routing override tests**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T10:26:23+02:00
- **Completed:** 2026-03-29T10:28:20.4984454+02:00
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added `detectPdfType()` and `PdfType` using `unpdf` with boundary coverage for text-layer versus image-only classification.
- Extended `ExtractionResult` and `extract()` so PDF inputs return `pdfType` while preserving existing retry and error handling.
- Exported routing utilities from `@docpipe/core` and covered both override paths in extraction tests.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement detectPdfType() with unpdf and unit tests** - `fd0ea4b` (feat)
2. **Task 2: Integrate PDF routing into extract(), add routing tests, and wire exports into barrel** - `e1001e0` (feat)

**Plan metadata:** this plan summary, state, roadmap, and requirements update commit

## Files Created/Modified
- `packages/core/src/pdf-router.ts` - PDF text-layer classifier using `unpdf`.
- `packages/core/src/pdf-router.test.ts` - mocked `unpdf` tests covering thresholds and fallback behavior.
- `packages/core/src/extract.ts` - PDF routing preflight and result annotation.
- `packages/core/src/extract.test.ts` - routing override coverage in the extraction flow.
- `packages/core/src/types.ts` - optional `pdfType` on `ExtractionResult`.
- `packages/core/src/index.ts` - public exports for `detectPdfType` and `PdfType`.
- `packages/core/package.json` - `unpdf` dependency entry.
- `pnpm-lock.yaml` - lockfile update for `unpdf`.

## Decisions Made
- `detectPdfType()` merges pages before counting non-whitespace characters, which keeps the classifier based on full-document text rather than per-page fragments.
- `routingOverride` is part of `ExtractOptions` so tests can cover both PDF routes without passing fake buffers into the real parser.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed fake-PDF parsing from an existing extract test**
- **Found during:** Task 2 (Integrate PDF routing into extract(), add routing tests, and wire exports into barrel)
- **Issue:** The existing PDF buffer test began calling real `unpdf` with fake bytes after the routing preflight was added, producing noisy warnings.
- **Fix:** Updated the test to use `routingOverride`, keeping the test deterministic while still validating the generated file part.
- **Files modified:** `packages/core/src/extract.test.ts`
- **Verification:** `pnpm --filter @docpipe/core test`
- **Committed in:** `e1001e0` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The adjustment kept the test suite deterministic without expanding scope. No production behavior changed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The extraction pipeline now exposes routing metadata, which the validator plan can build on without altering PDF handling again.
- No blockers remain for Phase 03-03.

---
*Phase: 03-core-completeness*
*Completed: 2026-03-29*

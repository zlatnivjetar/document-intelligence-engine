---
phase: 03-core-completeness
plan: "06"
subsystem: core
tags: [pdf, routing, unpdf, testing, extract]
requires:
  - phase: 03-core-completeness
    provides: PDF type detection and extraction pipeline baseline
provides:
  - committed text-layer and image-only routing fixtures
  - analyzePdfRouting seam with extracted text for text-layer PDFs
  - real text-layer versus file-path branching in extract()
affects: [phase-04, phase-05, phase-06]
tech-stack:
  added: []
  patterns:
    - PDF routing separates analysis from public metadata so tests can assert the actual request shape
    - text-layer PDFs feed extracted text into the model while image-only PDFs keep the native file part path
key-files:
  created:
    - packages/core/test/fixtures/pdf/text-layer-routing.pdf
    - packages/core/test/fixtures/pdf/image-only-routing.pdf
    - packages/core/src/pdf-routing.integration.test.ts
  modified:
    - packages/core/src/pdf-router.ts
    - packages/core/src/extract.ts
    - packages/core/src/pdf-router.test.ts
key-decisions:
  - "Routing analysis returns extractedText only for real text-layer PDFs so extract() can branch without changing the existing detectPdfType public API."
  - "routingOverride still controls deterministic metadata tests when real extracted text is unavailable, but it does not suppress a genuine text-layer branch discovered from fixture PDFs."
patterns-established:
  - "Use committed real PDFs plus unpdf in integration tests whenever routing behavior depends on actual document content."
  - "Keep detectPdfType as a wrapper and grow new routing behavior behind analyzePdfRouting to preserve the existing public surface."
requirements-completed: [INPUT-03]
duration: 1 min
completed: 2026-03-29
---

# Phase 03 Plan 06: Real PDF Routing Summary

**Text-layer PDFs now route through extracted text while image-only PDFs stay on the file-part path, proven with committed routing fixtures**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-29T11:33:26+02:00
- **Completed:** 2026-03-29T11:33:37+02:00
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added committed routing fixtures that deterministically classify to opposite routing outcomes under the real `unpdf` extractor.
- Introduced `analyzePdfRouting()` so routing analysis can surface extracted text for text-layer PDFs without breaking the `detectPdfType()` API.
- Updated `extract()` to send text-only prompt parts for text-layer PDFs and preserve the file-part path for image-only PDFs, with integration tests proving the request-shape split.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add committed routing PDF fixtures for real text-layer and image-only cases** - `373f83d` (feat)
2. **Task 2: Implement the real routing split and prove each branch with fixture-backed integration tests** - `8699ba0` (feat)

**Plan metadata:** included in the phase-execution docs commit

## Files Created/Modified
- `packages/core/test/fixtures/pdf/text-layer-routing.pdf` - searchable PDF fixture that exceeds the text-layer threshold and exposes routing sample text.
- `packages/core/test/fixtures/pdf/image-only-routing.pdf` - image-based PDF fixture that stays below the text threshold.
- `packages/core/src/pdf-router.ts` - routing analysis seam that returns both `pdfType` and extracted text when available.
- `packages/core/src/extract.ts` - real text-layer-versus-image-only branching before the model call.
- `packages/core/src/pdf-routing.integration.test.ts` - fixture-backed routing assertions over real PDFs.
- `packages/core/src/pdf-router.test.ts` - unit coverage for the new analysis seam.

## Decisions Made
- Preserved `detectPdfType()` as the public wrapper so existing call sites and tests keep working while new branching behavior depends on `analyzePdfRouting()`.
- Let `routingOverride` remain a metadata/test seam only when real extracted text is absent so fixture-driven routing tests always reflect the actual PDF content.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 03 now has real routing divergence that Phase 4 web uploads can rely on when passing PDFs into the core extractor.
- Downstream consumers continue receiving `pdfType` metadata on both branches, so no API migration is required for later phases.

---
*Phase: 03-core-completeness*
*Completed: 2026-03-29*

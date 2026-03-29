---
phase: 03-core-completeness
plan: "05"
subsystem: core
tags: [fixtures, testing, pdf, receipt, w2]
requires:
  - phase: 03-core-completeness
    provides: receipt and W-2 schemas plus PDF classification metadata
provides:
  - receipt known-answer PDF fixture and expectation manifest
  - W-2 known-answer PDF fixture and expectation manifest
  - fixture-backed extraction tests for TMPL-02 and TMPL-03
affects: [phase-04, phase-05, phase-06]
tech-stack:
  added: []
  patterns:
    - real document fixtures live under packages/core/test/fixtures and stay out of the published tarball
    - built-in template extraction tests assert exact field confidence labels from committed manifests
key-files:
  created:
    - packages/core/test/fixtures/receipt/known-answer.pdf
    - packages/core/test/fixtures/receipt/expected.json
    - packages/core/test/fixtures/w2/known-answer.pdf
    - packages/core/test/fixtures/w2/expected.json
    - packages/core/src/template-fixtures.test.ts
  modified: []
key-decisions:
  - "Known-answer artifacts live under test/fixtures so fixture evidence exists in git without leaking into the published package."
  - "Fixture-backed template tests mock only the model call and rely on real PDFs so confidence assertions prove the extraction surface rather than handwritten objects."
patterns-established:
  - "Template coverage for built-in schemas should pair a committed fixture PDF with an expected.json manifest and one dedicated integration-style test file."
  - "Real PDFs used for template coverage must classify as text-layer under unpdf so routing metadata stays observable in the result."
requirements-completed: [TMPL-02, TMPL-03]
duration: 2 min
completed: 2026-03-29
---

# Phase 03 Plan 05: Fixture-Backed Template Coverage Summary

**Receipt and W-2 known-answer PDFs now back the built-in templates with exact-value and exact-confidence extraction assertions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T11:24:20+02:00
- **Completed:** 2026-03-29T11:25:49+02:00
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added committed receipt and W-2 PDF fixtures whose extracted text matches the expected manifests exactly.
- Added expectation manifests with stable values and confidence labels for TMPL-02 and TMPL-03.
- Added fixture-backed tests that call `extract()` with real PDF bytes and assert exact output, `overallConfidence`, `pdfType`, and warning behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add committed receipt and W-2 known-answer PDF fixtures with expectation manifests** - `50311b4` (feat)
2. **Task 2: Add fixture-backed receipt and W-2 integration tests with exact confidence assertions** - `3a3d031` (test)

**Plan metadata:** included in the phase-execution docs commit

## Files Created/Modified
- `packages/core/test/fixtures/receipt/known-answer.pdf` - text-layer receipt fixture whose extracted text matches the receipt manifest.
- `packages/core/test/fixtures/receipt/expected.json` - exact expected receipt values and confidence labels.
- `packages/core/test/fixtures/w2/known-answer.pdf` - text-layer W-2 fixture with stable extracted text.
- `packages/core/test/fixtures/w2/expected.json` - exact expected W-2 values and confidence labels.
- `packages/core/src/template-fixtures.test.ts` - fixture-backed TMPL-02 and TMPL-03 extraction assertions.

## Decisions Made
- Stored fixture assets under `packages/core/test/fixtures/` so npm packaging remains limited to `dist/` while the repo still contains real verification artifacts.
- Kept the fixture coverage in its own test file instead of extending `extract.test.ts`, which preserves a clean separation between generic extraction behavior and plan-specific known-answer evidence.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 03 now has artifact-backed proof for TMPL-02 and TMPL-03 instead of mocked-only coverage.
- The routing gap remains the only phase-level blocker after this plan and is addressed by Plan 03-06.

---
*Phase: 03-core-completeness*
*Completed: 2026-03-29*

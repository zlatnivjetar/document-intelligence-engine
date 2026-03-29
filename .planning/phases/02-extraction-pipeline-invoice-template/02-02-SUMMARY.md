---
phase: 02-extraction-pipeline-invoice-template
plan: "02"
subsystem: api
tags: [retry, validation, error-handling, ai-sdk, zod]

# Dependency graph
requires:
  - phase: 02-01
    provides: extract() core call path, document routing, confidence response handling
provides:
  - retry wrapper around extractCore() with max two validation retries
  - ExtractionError classification for invalid key, rate limit, unsupported file type, validation failure, and generic extraction failure
  - test coverage for all retry and error branches
affects: [02-04, 03-core-completeness, 04-web-app, 06-cli]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - private extractCore() for raw model calls with public extract() wrapper for reliability policy
    - status-code classification before retry logic for non-retryable provider failures
    - validation retry feedback appended as a second user message

key-files:
  created: []
  modified:
    - packages/core/src/extract.ts
    - packages/core/src/extract.test.ts

key-decisions:
  - "Unsupported mime types fail before any model call so bad inputs do not spend tokens."
  - "Validation retries reuse the existing extractCore() path and append the previous validation error back to the prompt as corrective context."

patterns-established:
  - "Extraction reliability pattern: validate early, classify provider errors, retry only schema-validation failures."
  - "ExtractionError objects are plain discriminated-union payloads, not custom Error subclasses."

requirements-completed: [EXTRACT-04, EXTRACT-05, EXTRACT-08]

# Metrics
duration: 2min
completed: "2026-03-29"
---

# Phase 02 Plan 02: Retry Loop and Error Classification Summary

**extract() now wraps extractCore() with validation retries, preflight mime checks, and all five ExtractionError outcomes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T06:39:20Z
- **Completed:** 2026-03-29T06:41:02Z
- **Tasks:** 1 of 1
- **Files modified:** 2

## Accomplishments
- Refactored the raw model call into `extractCore()` and wrapped it with a public `extract()` retry policy.
- Added explicit failure classification for 401, 429, unsupported file type, validation exhaustion, and generic extraction failures.
- Expanded `extract.test.ts` to 12 extraction tests covering validation retries and all error branches while preserving the phase-01 happy-path coverage.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add retry loop and error classification to extract()** - `ecd0a4d` (test), `11d3c9a` (feat)

**Plan metadata:** _(pending final commit)_

## Files Created/Modified
- `packages/core/src/extract.ts` - `extractCore()` helper, retry loop, mime-type guard, status classification, validation failure handling
- `packages/core/src/extract.test.ts` - RED/GREEN coverage for retry prompting, 401/429 handling, validation exhaustion, generic failures, unsupported file types

## Decisions Made
- Unsupported file types now fail before `generateObject()` is called so the library avoids unnecessary token spend and clearer caller feedback.
- Validation retries are limited strictly to schema-validation failures; 401 and 429 return immediately with non-retryable error payloads.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The `ai` module is fully mocked in tests, so validation-error detection could not rely on importing the concrete `NoObjectGeneratedError` class. The final implementation checks the error `name` and message content instead, which works with both the SDK and the mocked test path.
- `packages/core/package.json` still emits the existing exports-condition ordering warning during builds. This remains queued for `02-04`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `02-03` can now focus solely on the invoice template contract because the extraction engine has both happy-path and retry/error behavior in place.
- `02-04` can validate the publish/install path against the full extraction surface, including the new error exports already exposed through the barrel.

## Self-Check: PASSED

Verified after implementation:
- `pnpm --filter @docpipe/core test`
- `pnpm --filter @docpipe/core type-check`
- `pnpm --filter @docpipe/core build`
- `pnpm build`

Task commits present in git log:
- `ecd0a4d` - test(02-02): add retry and error handling coverage
- `11d3c9a` - feat(02-02): add retry and error classification to extract

---
*Phase: 02-extraction-pipeline-invoice-template*
*Completed: 2026-03-29*

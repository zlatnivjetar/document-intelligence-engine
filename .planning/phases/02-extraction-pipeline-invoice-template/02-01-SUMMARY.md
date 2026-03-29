---
phase: 02-extraction-pipeline-invoice-template
plan: "01"
subsystem: api
tags: [ai-sdk, zod, extraction, pdf, image, confidence]

# Dependency graph
requires:
  - phase: 01-02
    provides: ExtractionInput, ExtractionResult, createAnthropicProvider, LanguageModelV3-compatible provider abstraction
provides:
  - schema-driven extract() function for PDF and image inputs
  - per-field confidence map and overall confidence mean
  - core tests covering document routing and typed extraction results
  - barrel exports for extract and ExtractOptions
affects: [02-02, 02-03, 02-04, 03-core-completeness, 04-web-app, 06-cli]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - generateObject compound response schema with extracted payload plus confidence map
    - file-part document routing for both PDF and image extraction inputs
    - generic extract<T>() typing driven directly by the caller's Zod schema

key-files:
  created:
    - packages/core/src/extract.ts
  modified:
    - packages/core/src/extract.test.ts
    - packages/core/src/index.ts

key-decisions:
  - "Used AI SDK file parts with mediaType instead of the plan's older mimeType example because ai@6.0.141 expects mediaType in UserModelMessage content."
  - "For non-ZodObject schemas, confidence falls back to a z.record schema so dynamic top-level keys are preserved instead of being stripped by an empty Zod object."

patterns-established:
  - "Extraction entrypoint pattern: extract({ input, schema, model }) returns ExtractionResult<T> with T inferred from the provided schema."
  - "Confidence scores live beside extracted data in the model response, then normalize into the public ExtractionResult shape."

requirements-completed: [EXTRACT-01, EXTRACT-02, EXTRACT-03, INPUT-01, INPUT-02]

# Metrics
duration: 5min
completed: "2026-03-29"
---

# Phase 02 Plan 01: Core extract() Function with Document Routing and Confidence Scoring Summary

**Schema-driven extract() using Vercel AI SDK generateObject with PDF/image file routing and per-field confidence scores**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T06:28:00Z
- **Completed:** 2026-03-29T06:33:41Z
- **Tasks:** 2 of 2
- **Files modified:** 3

## Accomplishments
- Added `packages/core/src/extract.ts` with a generic `extract<T>()` entrypoint that accepts `ExtractionInput`, a caller-provided Zod schema, and a `LanguageModelV3` model.
- Routed PDF, PNG, and JPEG inputs through AI SDK file parts and returned a public `ExtractionResult<T>` with per-field confidence scores plus an overall mean.
- Closed the initial TDD loop for extraction routing with 6 focused tests and exported the new API from `@docpipe/core`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement extract() function with document routing and confidence scoring** - `86c89d7` (test), `3e2319d` (feat)
2. **Task 2: Wire extract and ExtractOptions into the package barrel** - `24d5524` (feat)

**Plan metadata:** _(pending final commit)_

## Files Created/Modified
- `packages/core/src/extract.ts` - Core extraction entrypoint, prompt/schema wiring, document routing, confidence normalization
- `packages/core/src/extract.test.ts` - TDD coverage for PDF/image routing, confidence keys, overall confidence mean, typed result shape
- `packages/core/src/index.ts` - Barrel exports for `extract` and `ExtractOptions`

## Decisions Made
- Used the installed AI SDK's `mediaType` property for file parts instead of the plan's older `mimeType` example. This preserves type-safety against `ai@6.0.141`.
- Used a `z.record` fallback confidence schema for non-object schemas so future flexible templates can retain dynamic confidence keys.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated the plan's outdated AI SDK file-part field**
- **Found during:** Task 1 (Implement extract() function with document routing and confidence scoring)
- **Issue:** The plan's message example used `mimeType` on the `file` content part, but the installed AI SDK types require `mediaType`. Following the plan literally would not compile.
- **Fix:** Implemented the request using `mediaType` and updated the red tests to assert the real SDK shape.
- **Files modified:** `packages/core/src/extract.ts`, `packages/core/src/extract.test.ts`
- **Verification:** `pnpm --filter @docpipe/core test`, `pnpm --filter @docpipe/core type-check`
- **Committed in:** `3e2319d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug)
**Impact on plan:** The deviation kept the plan aligned with the installed AI SDK version. No scope creep.

## Issues Encountered
- `packages/core/package.json` still emits an exports-condition ordering warning because `types` comes after `import` and `require`. This does not block `02-01`, and plan `02-04` already includes the publish-audit fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `02-02` can wrap the new `extract()` core in retry and error-classification logic without rewriting document routing.
- `02-03` can attach `invoiceSchema` directly to the new extraction entrypoint and export it from the same barrel.
- `02-04` should correct the package exports ordering warning while validating the consumer install path.

## Self-Check: PASSED

Verified after implementation:
- `pnpm --filter @docpipe/core test`
- `pnpm --filter @docpipe/core type-check`
- `pnpm --filter @docpipe/core build`
- `pnpm build`

Task commits present in git log:
- `86c89d7` - test(02-01): add failing test for extract document routing
- `3e2319d` - feat(02-01): implement extract function with confidence scoring
- `24d5524` - feat(02-01): export extract from core barrel

---
*Phase: 02-extraction-pipeline-invoice-template*
*Completed: 2026-03-29*

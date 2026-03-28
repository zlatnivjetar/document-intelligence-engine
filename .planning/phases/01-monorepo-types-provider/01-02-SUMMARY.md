---
phase: 01-monorepo-types-provider
plan: "02"
subsystem: infra
tags: [typescript, types, provider, anthropic, ai-sdk, vitest, zod]

# Dependency graph
requires:
  - phase: 01-01
    provides: pnpm workspace with packages/core scaffold, tsconfig.base.json with strict + isolatedDeclarations, all LLM SDK dependencies installed
provides:
  - ExtractionInput, ExtractionResult<T>, ExtractionError, ExtractionErrorCode exported from @docpipe/core
  - createAnthropicProvider factory returning LanguageModelV3-compatible instance
  - AnthropicProviderOptions interface
  - 18 vitest tests covering types and provider shape
  - vitest.config.ts for packages/core
  - apps/web minimal page.tsx and layout.tsx for turbo build
affects: [02-extraction-pipeline, 03-pdf-processing, 04-web-app, 05-results-export, 06-cli]

# Tech tracking
tech-stack:
  added:
    - "@ai-sdk/provider 3.0.8" (direct dependency for LanguageModelV3 type — LanguageModelV1 does not exist in ai@6.x)
  patterns:
    - Discriminated union error type pattern (ExtractionError) — code field as discriminant, exhaustive narrowing
    - Generic result type pattern (ExtractionResult<T>) — T flows from Zod schema to extraction output
    - BYOK provider factory pattern — apiKey passed at call time, never stored
    - TDD for types: compile-time behavior tests alongside runtime assertions in same file

key-files:
  created:
    - packages/core/src/types.ts (ExtractionInput, ExtractionResult, ExtractionError, ExtractionErrorCode)
    - packages/core/src/provider.ts (createAnthropicProvider factory, AnthropicProviderOptions)
    - packages/core/src/provider.test.ts (8 tests: provider shape, type narrowing, input/result types)
    - packages/core/src/types.test.ts (10 tests: input variants, result generics, error discriminated union)
    - packages/core/vitest.config.ts (node environment)
    - apps/web/src/app/page.tsx (minimal Next.js page for turbo build)
    - apps/web/src/app/layout.tsx (minimal Next.js layout for turbo build)
  modified:
    - packages/core/src/index.ts (barrel now re-exports all 6 public symbols)
    - packages/core/package.json (@ai-sdk/provider added as direct dependency)
    - pnpm-lock.yaml (lock file updated)

key-decisions:
  - "LanguageModelV1 does not exist in ai@6.x — the current interface is LanguageModelV3 from @ai-sdk/provider. Added @ai-sdk/provider as a direct dependency to packages/core."
  - "provider string from @ai-sdk/anthropic is 'anthropic.messages' (not 'anthropic.chat' as the plan example stated) — corrected in tests"
  - "isolatedDeclarations requires explicit return type annotations on all exported functions — apps/web page.tsx and layout.tsx needed React.JSX.Element annotation"
  - "tsdown produces index.mjs (not index.js) for ESM output — dual ESM+CJS artifacts are index.mjs and index.cjs with .d.mts/.d.cts declarations"

patterns-established:
  - "ExtractionError discriminated union: code field discriminant, each variant has its own retryable value, VALIDATION_FAILED includes validationErrors array"
  - "Provider factory pattern: createAnthropicProvider(options) returns LanguageModelV3 — callers pass this directly to extract() in Phase 2"
  - "BYOK enforcement: apiKey is a required parameter on the factory, never stored in the module or logged"
  - ".js extensions on local imports in NodeNext moduleResolution packages (provider.ts imports from '@ai-sdk/anthropic', not from './types.ts')"

requirements-completed: [LIB-02, EXTRACT-06]

# Metrics
duration: 20min
completed: "2026-03-28"
---

# Phase 01 Plan 02: Core Type Definitions and Anthropic Provider Summary

**ExtractionInput/ExtractionResult/ExtractionError discriminated union types + createAnthropicProvider factory returning LanguageModelV3, with 18 vitest tests and full turbo build passing**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-28T18:56:01Z
- **Completed:** 2026-03-28T19:16:46Z
- **Tasks:** 3 of 3
- **Files modified:** 10 (7 created, 3 updated)

## Accomplishments
- Four public types exported from @docpipe/core: ExtractionInput, ExtractionResult<T>, ExtractionError (discriminated union), ExtractionErrorCode
- createAnthropicProvider factory function with BYOK pattern — returns LanguageModelV3, accepts optional model ID defaulting to claude-sonnet-4-6
- 18 vitest tests passing: 10 for types, 8 for provider shape and type narrowing
- Full turbo build passes cleanly across all 3 workspace packages (core, web, cli)

## Task Commits

Each task was committed atomically:

1. **Task 1: Core type definitions** - `d7632da` (feat)
2. **Task 2: Anthropic provider implementation and vitest config** - `fcd2ef6` (feat)
3. **Task 3: Validate full monorepo build** - `765611d` (feat)

**Plan metadata:** _(pending final commit)_

## Files Created/Modified
- `packages/core/src/types.ts` - ExtractionInput, ExtractionResult<T>, ExtractionError discriminated union, ExtractionErrorCode
- `packages/core/src/provider.ts` - createAnthropicProvider factory returning LanguageModelV3
- `packages/core/src/index.ts` - Updated barrel re-exporting all 6 public symbols
- `packages/core/src/types.test.ts` - 10 tests for types (Buffer/string input, generic result, union narrowing)
- `packages/core/src/provider.test.ts` - 8 tests for provider shape, custom model, and type assertions
- `packages/core/vitest.config.ts` - Vitest configuration for node environment
- `packages/core/package.json` - Added @ai-sdk/provider as direct dependency
- `apps/web/src/app/page.tsx` - Minimal Next.js page (isolatedDeclarations-compliant)
- `apps/web/src/app/layout.tsx` - Minimal Next.js layout (isolatedDeclarations-compliant)
- `pnpm-lock.yaml` - Lock file updated

## Decisions Made
- Used `LanguageModelV3` from `@ai-sdk/provider` (not `LanguageModelV1` from `ai`) — the plan referenced an older API name. In ai@6.x, `LanguageModelV1` was renamed to `LanguageModelV3`. Added `@ai-sdk/provider` as a direct dependency.
- `createAnthropicProvider` defaults to `claude-sonnet-4-6` matching the CLAUDE.md stack spec.
- Minimal Next.js pages needed explicit `React.JSX.Element` return type annotations due to `isolatedDeclarations: true` in tsconfig.base.json.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect provider string assertion in provider.test.ts**
- **Found during:** Task 2 (Anthropic provider implementation)
- **Issue:** The plan's test asserted `model.provider === 'anthropic.chat'` but `@ai-sdk/anthropic@3.0.64` returns `'anthropic.messages'` as the provider identifier
- **Fix:** Updated assertion to `expect(model.provider).toBe('anthropic.messages')`
- **Files modified:** `packages/core/src/provider.test.ts`
- **Verification:** All 8 tests in provider.test.ts pass
- **Committed in:** `fcd2ef6` (Task 2 commit)

**2. [Rule 1 - Bug] LanguageModelV1 renamed to LanguageModelV3 in ai@6.x**
- **Found during:** Task 2 type-check (`pnpm --filter @docpipe/core type-check`)
- **Issue:** `import type { LanguageModelV1 } from 'ai'` fails — ai@6.0.141 does not export `LanguageModelV1`. The interface was renamed to `LanguageModelV3` and lives in `@ai-sdk/provider`.
- **Fix:** Changed import to `import type { LanguageModelV3 } from '@ai-sdk/provider'` and updated return type annotation. Added `@ai-sdk/provider` as a direct dependency via `pnpm --filter @docpipe/core add @ai-sdk/provider`.
- **Files modified:** `packages/core/src/provider.ts`, `packages/core/package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm --filter @docpipe/core type-check` exits 0
- **Committed in:** `fcd2ef6` (Task 2 commit)

**3. [Rule 1 - Bug] isolatedDeclarations requires explicit return types on Next.js page components**
- **Found during:** Task 3 (monorepo build — `next build` TypeScript check)
- **Issue:** `apps/web/src/app/page.tsx` and `layout.tsx` lacked explicit return type annotations. With `isolatedDeclarations: true` inherited from tsconfig.base.json, Next.js TypeScript compilation failed.
- **Fix:** Added `): React.JSX.Element` return type to both `Home()` and `RootLayout()` functions.
- **Files modified:** `apps/web/src/app/page.tsx`, `apps/web/src/app/layout.tsx`
- **Verification:** `turbo build` exits 0 with all 3 packages succeeding
- **Committed in:** `765611d` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (3 Rule 1 bugs from outdated plan references / isolatedDeclarations requirement)
**Impact on plan:** All auto-fixes necessary for compilation and correct type assertions. No scope creep.

## Issues Encountered
- `@ai-sdk/anthropic@3.0.64` uses `LanguageModelV3` from `@ai-sdk/provider@3.0.8`, not `LanguageModelV1` from `ai`. The AI SDK has versioned its provider interface types (V1 → V2 → V3) in tandem with major SDK releases. Future phases using the AI SDK should import provider interfaces from `@ai-sdk/provider` directly.
- `turbo build` produces `index.mjs` (ESM) not `index.js` when using `tsdown` with `--format esm,cjs`. Declaration files are `.d.mts` and `.d.cts`. This is correct tsdown behavior for dual-format output — the plan's acceptance criteria expecting `index.js` referred to ESM output which is correctly named `index.mjs`.

## User Setup Required
None — no external service configuration required.

## Known Stubs
None — this plan only defines types and a provider factory. No UI components or data flows that could have stubs.

## Next Phase Readiness
- Phase 2 (extraction pipeline) can now proceed: `ExtractionInput`, `ExtractionResult<T>`, `ExtractionError`, and `createAnthropicProvider` are all importable from `@docpipe/core`
- The `extract()` function in Phase 2 should accept `model: LanguageModelV3` (not `LanguageModelV1`) — document this as a decision carried forward
- turbo build is clean — CI can run `pnpm build` without modification
- 18 tests all pass — `pnpm test` baseline established for packages/core

## Self-Check: PASSED

All created files verified present. All 3 task commits verified in git log:
- `d7632da` — feat(01-02): core type definitions
- `fcd2ef6` — feat(01-02): Anthropic provider implementation and barrel exports
- `765611d` — feat(01-02): add minimal Next.js app pages for turbo build

---
*Phase: 01-monorepo-types-provider*
*Completed: 2026-03-28*

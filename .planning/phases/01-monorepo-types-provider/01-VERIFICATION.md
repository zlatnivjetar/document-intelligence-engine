---
phase: 01-monorepo-types-provider
verified: 2026-03-28T21:05:00Z
status: passed
score: 10/10 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 9/10
  gaps_closed:
    - "turbo build completes cleanly for packages/core — exports map now correctly points to ./dist/index.mjs and ./dist/index.d.mts"
  gaps_remaining: []
  regressions: []
---

# Phase 01: Monorepo + Types + Provider Verification Report

**Phase Goal:** Create the monorepo root configuration and scaffold all three workspace packages so that `pnpm install` and `turbo build` work end-to-end, then add the locked core TypeScript types and Anthropic provider implementation to `packages/core`.
**Verified:** 2026-03-28T21:05:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (exports map fix applied inline)

---

## Goal Achievement

### Observable Truths

Plan 01-01 declared 4 truths. Plan 01-02 declared 6 truths. All 10 evaluated below.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | pnpm install completes without errors at the repo root | VERIFIED | pnpm-lock.yaml exists; pnpm ls -r shows all 3 packages resolved |
| 2 | turbo build runs each package in topological order (core before web and cli) | VERIFIED | turbo.json `"dependsOn": ["^build"]` confirmed; `pnpm build` output: "3 successful, 3 total" |
| 3 | apps/web, packages/core, and packages/cli are recognized workspace packages | VERIFIED | pnpm-workspace.yaml covers apps/* and packages/*; all three resolve via workspace:* links |
| 4 | Each package has its own tsconfig.json that extends tsconfig.base.json | VERIFIED | packages/core/tsconfig.json, apps/web/tsconfig.json, packages/cli/tsconfig.json each extend `../../tsconfig.base.json` |
| 5 | ExtractionInput, ExtractionResult<T>, and ExtractionError are importable from @docpipe/core | VERIFIED | index.ts re-exports all four types via `from './types.js'`; 18 vitest tests pass importing these types |
| 6 | ExtractionError is a discriminated union — TypeScript exhaustively narrows on the code field | VERIFIED | types.ts defines 5-variant discriminated union on `code`; types.test.ts confirms narrowing at runtime |
| 7 | createAnthropicProvider returns a LanguageModelV3-compatible instance (no any in the function signature) | VERIFIED | provider.ts return type is `LanguageModelV3`; no `: any` anywhere in packages/core/src/**; type-check exits 0 |
| 8 | TypeScript strict mode passes across packages/core with zero any in public API | VERIFIED | `pnpm --filter @docpipe/core type-check` exits 0; grep for `: any` returns no matches |
| 9 | vitest test confirms types compile and provider factory returns correct shape | VERIFIED | 18 tests pass across types.test.ts (10) and provider.test.ts (8); vitest exits 0 |
| 10 | turbo build completes cleanly for packages/core | VERIFIED | `pnpm build` exits 0 ("3 successful, 3 total"); exports map now correctly references `./dist/index.mjs` and `./dist/index.d.mts`, which both exist on disk |

**Score:** 10/10 truths verified

---

### Required Artifacts

#### Plan 01-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `pnpm-workspace.yaml` | workspace package discovery | VERIFIED | Contains `"apps/*"` and `"packages/*"` |
| `turbo.json` | build pipeline with topological ordering | VERIFIED | `"dependsOn": ["^build"]` in build task |
| `tsconfig.base.json` | shared strict TypeScript config | VERIFIED | `"strict": true` and `"isolatedDeclarations": true` present |
| `packages/core/package.json` | @docpipe/core package definition | VERIFIED | `"name": "@docpipe/core"`, exports map points to `./dist/index.mjs` / `./dist/index.d.mts` / `./dist/index.cjs` — all exist post-build |
| `apps/web/package.json` | web app package definition | VERIFIED | Contains `"@docpipe/core": "workspace:*"` and `"next": "16.1.0"` |
| `packages/cli/package.json` | @docpipe/cli package definition | VERIFIED | `"name": "@docpipe/cli"`, `"@docpipe/core": "workspace:*"` |

#### Plan 01-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/types.ts` | ExtractionInput, ExtractionResult, ExtractionError, ExtractionErrorCode | VERIFIED | All 4 exports present, discriminated union correct, no `any` |
| `packages/core/src/provider.ts` | createAnthropicProvider factory | VERIFIED | Exports `createAnthropicProvider` and `AnthropicProviderOptions`; return type `LanguageModelV3` |
| `packages/core/src/provider.test.ts` | compile-time + runtime type tests | VERIFIED | 8 tests; imports and asserts on provider shape |
| `packages/core/src/index.ts` | public barrel export | VERIFIED | Re-exports all 6 public symbols via `.js` extensions (ESM NodeNext compliant) |
| `packages/core/vitest.config.ts` | vitest node environment config | VERIFIED | `environment: 'node'` |

---

### Key Link Verification

#### Plan 01-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/web/package.json` | `packages/core` | pnpm workspace reference | VERIFIED | `"@docpipe/core": "workspace:*"` present |
| `packages/cli/package.json` | `packages/core` | pnpm workspace reference | VERIFIED | `"@docpipe/core": "workspace:*"` present |
| `turbo.json` | build pipeline | dependsOn ^build | VERIFIED | `"dependsOn": ["^build"]` in build task |

#### Plan 01-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/core/src/index.ts` | `packages/core/src/types.ts` | re-export | VERIFIED | `export type { ... } from './types.js'` |
| `packages/core/src/index.ts` | `packages/core/src/provider.ts` | re-export | VERIFIED | `export { createAnthropicProvider } from './provider.js'` |
| `packages/core/src/provider.ts` | `@ai-sdk/anthropic` | createAnthropic import | VERIFIED | `import { createAnthropic } from '@ai-sdk/anthropic'` |
| `packages/core/src/provider.ts` | `@ai-sdk/provider` (LanguageModelV3) | type import | VERIFIED | `import type { LanguageModelV3 } from '@ai-sdk/provider'` — ai@6.x renamed LanguageModelV1 to LanguageModelV3 in `@ai-sdk/provider`. Correct interface applied. |
| `packages/core/package.json` | `./dist/index.mjs` | exports["."]["import"] | VERIFIED | Fixed: was `./dist/index.js` (nonexistent), now `./dist/index.mjs` — file confirmed present on disk |

---

### Data-Flow Trace (Level 4)

Not applicable. Phase 01 produces type definitions, a provider factory, and build configuration — no components or pages that render dynamic data. The `apps/web/src/app/page.tsx` renders a static string; no state variables or data fetching.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 18 vitest tests pass for packages/core | `pnpm --filter @docpipe/core test` | 18 passed, 0 failed | PASS |
| TypeScript strict mode, zero any | `pnpm --filter @docpipe/core type-check` | Exit 0, no output | PASS |
| turbo build completes across all 3 packages | `pnpm build` | "3 successful, 3 total" | PASS |
| CJS dist exports createAnthropicProvider | `node -e "require('./packages/core/dist/index.cjs')"` | `createAnthropicProvider` | PASS |
| ESM dist file exists at declared path | `ls packages/core/dist/index.mjs` | Present | PASS |
| Types declaration exists at declared path | `ls packages/core/dist/index.d.mts` | Present | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LIB-02 | 01-01, 01-02 | Monorepo structure (Turborepo + pnpm) with packages/core, packages/web, packages/cli | SATISFIED | All 3 workspace packages exist, pnpm workspace links confirmed, turbo.json pipeline correct |
| EXTRACT-06 | 01-02 | Provider abstraction layer — start with one LLM provider (Claude), clean interface for adding more | SATISFIED | `createAnthropicProvider` wraps `@ai-sdk/anthropic`; return type is `LanguageModelV3` interface — swapping to OpenAI requires only `createOpenAI({ apiKey })(model)` substitution, no changes to packages/core internals |

No orphaned requirements for Phase 1. REQUIREMENTS.md traceability table maps only LIB-02 and EXTRACT-06 to Phase 1, matching plan frontmatter.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/cli/src/index.ts` | 4 | `export {}` — empty CLI entry | INFO | Intentional per plan ("CLI commands are implemented in Phase 6"). Not a blocker. |

The previously reported anti-pattern — `exports["."]["import"]` pointing to the nonexistent `./dist/index.js` — has been corrected. All three export paths (`./dist/index.mjs`, `./dist/index.cjs`, `./dist/index.d.mts`) now match the actual dist artifacts produced by tsdown.

---

### Human Verification Required

None. The previously identified human verification item (ESM import resolution when Phase 2 adds real imports) is now resolved structurally: the exports map is correct, so any future `import '@docpipe/core'` in a NodeNext or Bundler consumer will resolve to the correct `.mjs` artifact. No further human testing needed for Phase 1.

---

### Gaps Summary

No gaps. All 10 truths verified. The single gap from the initial verification (exports map mismatch) has been closed:

- **Closed gap:** `packages/core/package.json` exports map previously declared `./dist/index.js` (ESM) and `./dist/index.d.ts` (types), neither of which tsdown produces. The fix updated both `exports["."]["import"]`, the top-level `"module"` field, and the top-level `"types"` field to `./dist/index.mjs` and `./dist/index.d.mts` respectively. All three dist artifacts are confirmed present on disk after `pnpm build`.

Phase 1 goal is fully achieved.

---

## Structural Note: LanguageModelV1 vs LanguageModelV3

The plan specified `LanguageModelV1` from `ai` as the return type for `createAnthropicProvider`. The implementation correctly uses `LanguageModelV3` from `@ai-sdk/provider` — this is the current interface name in ai SDK v6.x. The SUMMARY documents this as a known API rename. EXTRACT-06 is satisfied because the provider abstraction exists and works; the interface version number is an implementation detail.

---

_Verified: 2026-03-28T21:05:00Z_
_Verifier: Claude (gsd-verifier)_

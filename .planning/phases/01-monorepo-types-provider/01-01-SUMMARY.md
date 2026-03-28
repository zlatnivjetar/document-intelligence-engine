---
phase: 01-monorepo-types-provider
plan: "01"
subsystem: infra
tags: [turborepo, pnpm, typescript, tsdown, monorepo, workspace]

# Dependency graph
requires: []
provides:
  - pnpm workspace with apps/web, packages/core, packages/cli recognized packages
  - turbo.json pipeline with topological build order (core before consumers)
  - tsconfig.base.json with strict + isolatedDeclarations (required by tsdown)
  - @docpipe/core package skeleton with ai, @ai-sdk/anthropic, @anthropic-ai/sdk, zod dependencies
  - apps/web Next.js 16.1 + React 19 skeleton consuming @docpipe/core via workspace:*
  - @docpipe/cli skeleton consuming @docpipe/core via workspace:*
affects: [01-02, 02-extraction-pipeline, 03-pdf-processing, 04-web-app, 05-results-export, 06-cli]

# Tech tracking
tech-stack:
  added:
    - turbo 2.8.20 (monorepo build orchestration)
    - pnpm 10.0.0 (package manager, installed via npm install -g pnpm@10)
    - typescript 5.9.3 (TS 5.8+ range; 5.9.3 resolved)
    - vitest 3.2.4 (test runner)
    - tsdown 0.21.7 (library bundler for packages/core and packages/cli)
    - ai 6.0.141 (Vercel AI SDK provider abstraction)
    - "@ai-sdk/anthropic 3.0.64" (Claude adapter)
    - "@anthropic-ai/sdk 0.80.0" (Anthropic SDK)
    - "zod 4.3.6" (schema validation)
    - next 16.1.0 (web app framework)
    - react 19.2.4 / react-dom 19.2.4
    - commander 13.1.0 (CLI argument parsing)
  patterns:
    - Workspace packages linked via pnpm workspace:* references (no file: protocol)
    - Each package owns its own package.json, tsconfig.json, and src/
    - All tsconfigs extend ../../tsconfig.base.json (single source of truth for strict/isolatedDeclarations)
    - apps/web overrides moduleResolution to Bundler (required for Next.js App Router webpack/Turbopack)
    - packages/core and packages/cli use NodeNext moduleResolution (inherited from base)
    - tsdown dual ESM+CJS output for packages/core; ESM-only for packages/cli bin

key-files:
  created:
    - package.json (root workspace root, private)
    - pnpm-workspace.yaml (apps/* + packages/* globs)
    - turbo.json (build pipeline with ^build topological order)
    - tsconfig.base.json (strict, isolatedDeclarations, NodeNext, ES2022)
    - .npmrc (auto-install-peers, dedupe-peer-dependents)
    - .gitignore (node_modules, dist, .next, .turbo excluded)
    - packages/core/package.json (@docpipe/core, dual ESM+CJS, publishConfig public)
    - packages/core/tsconfig.json (extends base, NodeNext)
    - packages/core/src/index.ts (empty barrel, types added in plan 02)
    - apps/web/package.json (Next.js 16.1, React 19, workspace:* @docpipe/core)
    - apps/web/tsconfig.json (Bundler moduleResolution for Next.js)
    - apps/web/next.config.ts (minimal Next.js config)
    - packages/cli/package.json (@docpipe/cli, commander, workspace:* @docpipe/core)
    - packages/cli/tsconfig.json (extends base, NodeNext)
    - packages/cli/src/index.ts (empty entry, CLI implemented in Phase 6)
  modified:
    - pnpm-lock.yaml (updated with all workspace package dependencies)

key-decisions:
  - "pnpm installed via npm install -g pnpm@10 (not pre-installed in shell environment)"
  - "apps/web/tsconfig.json overrides moduleResolution to Bundler — required for Next.js App Router (webpack/Turbopack), intentional override of base NodeNext"
  - "Added .gitignore as Rule 2 deviation — critical for any repository, not explicitly in plan but essential for correctness"
  - "packages/core pinned ai@^6.0.140 resolved to 6.0.141 — minor patch, within spec"
  - "TypeScript resolved to 5.9.3 (within ^5.8.0 range) — compatible with tsdown isolatedDeclarations requirement"

patterns-established:
  - "Workspace reference pattern: @docpipe/core: workspace:* (not file: protocol)"
  - "Package tsconfig extends ../../tsconfig.base.json (two levels up from package root)"
  - "tsdown build commands: dual ESM+CJS for library (--format esm,cjs --dts); ESM-only for CLI bin"
  - "publishConfig.access: public on all scoped @docpipe/* packages"

requirements-completed: [LIB-02]

# Metrics
duration: 14min
completed: "2026-03-28"
---

# Phase 01 Plan 01: Monorepo Root Configuration and Package Scaffolding Summary

**Turborepo + pnpm workspace with three packages (core/web/cli), shared tsconfig.base.json with strict + isolatedDeclarations, and full workspace dependency linking via workspace:* references**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-28T18:37:33Z
- **Completed:** 2026-03-28T18:51:15Z
- **Tasks:** 2 of 2
- **Files modified:** 16 (15 created, 1 updated lock file)

## Accomplishments
- Root monorepo configuration: pnpm-workspace.yaml, turbo.json pipeline with topological ^build order, tsconfig.base.json (strict + isolatedDeclarations), .npmrc, .gitignore
- Three workspace packages scaffolded: @docpipe/core (ai + @ai-sdk/anthropic + @anthropic-ai/sdk + zod), apps/web (Next.js 16.1 + React 19), @docpipe/cli (commander)
- pnpm workspace linking confirmed — all packages show as workspace entries with @docpipe/core linked via workspace:* in both consumers

## Task Commits

Each task was committed atomically:

1. **Task 1: Root monorepo configuration** - `1e25a8e` (chore)
2. **Task 2: Scaffold all three workspace packages** - `f5da05c` (feat)

**Plan metadata:** _(pending final commit)_

## Files Created/Modified
- `package.json` - Root workspace root (private, turbo 2.8.20 devDep)
- `pnpm-workspace.yaml` - Workspace glob discovery (apps/*, packages/*)
- `turbo.json` - Build pipeline with topological order (^build)
- `tsconfig.base.json` - Shared strict TypeScript config with isolatedDeclarations
- `.npmrc` - pnpm hoisting control
- `.gitignore` - Excludes node_modules, dist, .next, .turbo (added via Rule 2)
- `packages/core/package.json` - @docpipe/core definition with LLM SDK dependencies
- `packages/core/tsconfig.json` - Extends base, NodeNext moduleResolution
- `packages/core/src/index.ts` - Empty barrel (types added in plan 01-02)
- `apps/web/package.json` - Next.js 16.1 + React 19 + workspace:* core dep
- `apps/web/tsconfig.json` - Bundler moduleResolution for Next.js App Router
- `apps/web/next.config.ts` - Minimal Next.js config
- `packages/cli/package.json` - @docpipe/cli + commander 13.x + workspace:* core dep
- `packages/cli/tsconfig.json` - Extends base, NodeNext moduleResolution
- `packages/cli/src/index.ts` - Empty entry point (CLI implemented in Phase 6)
- `pnpm-lock.yaml` - Lock file updated with all workspace dependencies

## Decisions Made
- apps/web intentionally overrides `moduleResolution` to `Bundler` — Next.js App Router uses webpack/Turbopack, not Node module resolution. Base `NodeNext` is correct for packages/core and packages/cli.
- TypeScript resolved to 5.9.3 (within ^5.8.0 range), compatible with tsdown `isolatedDeclarations` requirement (TS 5.5+).
- Added `.gitignore` as Rule 2 deviation — foundational requirement for any repository.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added .gitignore**
- **Found during:** Task 1 (Root monorepo configuration)
- **Issue:** Plan did not specify a .gitignore file. Without it, node_modules/, dist/, .next/, and .turbo/ would be tracked by git — this breaks every subsequent operation.
- **Fix:** Created .gitignore with standard exclusions for this stack (node_modules, dist, .next, .turbo, TypeScript build info, environment files, OS files)
- **Files modified:** `.gitignore`
- **Verification:** git status no longer shows node_modules/ as untracked
- **Committed in:** `1e25a8e` (Task 1 commit)

**2. [Rule 3 - Blocking] Installed pnpm globally**
- **Found during:** Task 1 verification (pnpm install)
- **Issue:** pnpm not found in shell PATH. The plan calls for `pnpm install` but pnpm was not installed in the execution environment.
- **Fix:** Ran `npm install -g pnpm@10` to install pnpm 10.0.0 globally.
- **Files modified:** None (global installation)
- **Verification:** `pnpm --version` returns 10.0.0; subsequent `pnpm install` succeeded
- **Committed in:** N/A (global tool install, not a repo file change)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for basic operation. No scope creep.

## Issues Encountered
- pnpm not pre-installed in execution shell — resolved by installing via npm (Rule 3)
- esbuild build scripts warning during pnpm install (transitive dep of vitest) — expected, no action needed; esbuild is a build-time tool that works without native build scripts in our use case
- sharp appears as a transitive dependency (likely from Next.js) — ignored per CLAUDE.md (do not use sharp in API routes on Vercel free tier); it's not in any direct dependency list

## User Setup Required

None — no external service configuration required. pnpm is installed globally on this machine.

## Next Phase Readiness
- Plan 01-02 can now proceed: workspace graph exists, all package directories and tsconfigs are in place, packages/core/src/index.ts is the correct barrel to add types and provider abstraction
- Plan 01-02 depends on this plan having created the package directories, tsconfigs, and dependency graph — all confirmed present
- Concern: pnpm must be available in any CI environment — add to CI setup instructions in Phase 4 when Vercel deployment is configured

---
*Phase: 01-monorepo-types-provider*
*Completed: 2026-03-28*

---
phase: 06-cli
plan: "02"
subsystem: cli
tags: [cli, custom-schemas, jiti, npm, packaging]
requires:
  - phase: 06-cli
    provides: baseline docpipe extract command, built artifact wiring, and pipe-safe CLI output helpers
  - phase: 03-core-completeness
    provides: shared extract() support for custom schemas and thin-consumer architecture
provides:
  - local .ts and .mjs custom schema loading for the CLI
  - schema-aware docpipe extract flow with JSON and CSV output parity
  - external consumer verification for the packed CLI tarball
affects: [phase-06-cli, consumer-verification, publish-pipeline, custom-schema-loading]
tech-stack:
  added: [jiti]
  patterns:
    [
      runtime schema loading via jiti with explicit zod object-shape validation,
      exactly-one schema source enforcement across template and custom-schema CLI flows,
      prepack and postpack manifest rewrite for publish-safe workspace dependencies,
    ]
key-files:
  created:
    [
      packages/cli/src/custom-schema.ts,
      packages/cli/src/custom-schema.test.ts,
      packages/cli/test/fixtures/custom-schema/default-schema.ts,
      packages/cli/test/fixtures/custom-schema/named-schema.mjs,
      packages/cli/test/fixtures/custom-schema/invalid-schema.mjs,
      scripts/verify-cli-consumer.mjs,
      scripts/prepare-cli-package.mjs,
    ]
  modified:
    [
      packages/cli/package.json,
      pnpm-lock.yaml,
      packages/cli/src/cli.ts,
      packages/cli/src/cli.test.ts,
    ]
key-decisions:
  - "Custom schema modules may export either default z.object({...}) or named export schema, and the CLI rejects every other module shape deterministically before model calls."
  - "The CLI enforces exactly one schema source so built-in templates and local schema modules share the same extraction path without ambiguous precedence rules."
  - "CLI packing rewrites @docpipe/core from workspace:0.1.0 to 0.1.0 during npm pack so external npm consumers can install the tarball successfully."
patterns-established:
  - "Custom schema loader pattern: resolve paths relative to the CLI cwd, load through jiti, and validate with instanceof z.ZodObject before calling extract()."
  - "Tarball verification pattern: build, npm pack, install core and CLI tarballs into a temp consumer project, then check npx docpipe help and the pre-network missing-key path."
requirements-completed: [CLI-02, CLI-03, CLI-04]
duration: 12 min
completed: 2026-03-30
---

# Phase 06 Plan 02: CLI Custom Schema Summary

**Local `.ts` and `.mjs` schema loading for `docpipe extract`, plus tarball consumer verification that proves the packaged CLI installs and runs outside the monorepo**  

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-30T08:49:26+02:00
- **Completed:** 2026-03-30T09:01:47+02:00
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Added a `jiti`-backed custom schema loader that accepts `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, and `.cjs` modules exporting `z.object({...})`.
- Extended `docpipe extract` with `--schema <path>`, exactly-one schema source validation, and shared JSON/CSV output behavior for template and custom-schema runs.
- Added external CLI consumer verification that packs both tarballs, installs them into a temp project, checks `docpipe extract --help`, and proves the missing-key path stays pipe-safe before any network call.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement `.ts`-capable custom schema loading with explicit module-shape validation** - `e7835bc` (feat)
2. **Task 2: Wire `--schema` into the command flow and verify the packed CLI binary outside the monorepo** - `0641a6f` (feat)

**Plan metadata:** recorded in the final docs commit for summary and planning-state updates

## Files Created/Modified

- `packages/cli/src/custom-schema.ts` - resolves local schema paths, loads modules through `jiti`, and validates supported export shapes.
- `packages/cli/src/custom-schema.test.ts` - verifies `.ts` default exports, named schema exports, invalid shapes, and missing-file handling.
- `packages/cli/test/fixtures/custom-schema/default-schema.ts` - TypeScript fixture proving runtime schema-module loading.
- `packages/cli/test/fixtures/custom-schema/named-schema.mjs` - named-export fixture for `schema`.
- `packages/cli/test/fixtures/custom-schema/invalid-schema.mjs` - invalid non-object schema fixture for deterministic error coverage.
- `packages/cli/src/cli.ts` - adds `--schema`, exactly-one source validation, and shared extraction flow for built-in and custom schemas.
- `packages/cli/src/cli.test.ts` - verifies custom-schema execution, CSV output parity, mutual exclusivity, and updated help guidance.
- `packages/cli/package.json` - adds direct runtime deps plus `prepack` and `postpack` hooks for publish-safe tarballs.
- `pnpm-lock.yaml` - records the CLI’s direct `jiti` dependency in the workspace lockfile.
- `scripts/verify-cli-consumer.mjs` - external CLI pack/install/help/missing-key verification outside the monorepo.
- `scripts/prepare-cli-package.mjs` - rewrites the CLI manifest during pack so the tarball depends on `@docpipe/core@0.1.0` instead of a workspace protocol.

## Decisions Made

- The CLI resolves custom schema files relative to the injected working directory so installed binaries and local monorepo runs behave the same way.
- Built-in templates and custom schemas now share the exact same formatter and extraction path, which keeps CLI output semantics aligned across both modes.
- The tarball packaging fix lives in `prepack`/`postpack` hooks rather than the verification script so every future `npm pack` run produces an installable CLI artifact by default.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added pack-time manifest rewrite for the CLI tarball**
- **Found during:** Task 2 (Wire `--schema` into the command flow and verify the packed CLI binary outside the monorepo)
- **Issue:** The packed CLI tarball preserved `@docpipe/core: workspace:0.1.0`, causing external `npm install` to fail with `EUNSUPPORTEDPROTOCOL`.
- **Fix:** Added `scripts/prepare-cli-package.mjs` plus `prepack`/`postpack` hooks so `npm pack` rewrites the dependency to `0.1.0` for the tarball and restores the workspace manifest afterward.
- **Files modified:** packages/cli/package.json, scripts/prepare-cli-package.mjs
- **Verification:** `node scripts/verify-cli-consumer.mjs`
- **Committed in:** `0641a6f`

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking issue)
**Impact on plan:** The fix was required for the packaged CLI to be installable by plain npm consumers and did not expand the CLI feature scope.

## Issues Encountered

- The first external consumer install failed because `npm` does not accept workspace protocol dependencies from packed tarballs. After the pack-time manifest rewrite was added, the consumer verification passed end-to-end.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 06 now covers both built-in template and local custom-schema CLI flows with a verified packaged binary.
- The remaining work is phase-level regression testing and final phase verification; no further implementation gaps are currently known.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/06-cli/06-02-SUMMARY.md`
- Task commit `e7835bc` exists in git history
- Task commit `0641a6f` exists in git history
- `node scripts/verify-cli-consumer.mjs` passes against the final tree

---
*Phase: 06-cli*
*Completed: 2026-03-30*

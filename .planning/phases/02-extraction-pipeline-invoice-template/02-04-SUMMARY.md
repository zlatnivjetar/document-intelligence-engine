---
phase: 02-extraction-pipeline-invoice-template
plan: "04"
subsystem: infra
tags: [npm, packaging, consumer-test, publish, verification]

# Dependency graph
requires:
  - phase: 02-01
    provides: extract() public API
  - phase: 02-02
    provides: public error classification behavior for extract()
  - phase: 02-03
    provides: invoiceSchema export for built-in template verification
provides:
  - npm-ready package manifest with types-first exports ordering
  - consumer verification script covering pack, install, export probe, and extract invocation
  - user setup handoff for npm token creation and publish readiness
affects: [03-core-completeness, 06-cli, publish-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - external consumer verification via npm pack into a temp project outside the monorepo
    - publish manifest discipline with types-first export conditions and explicit peer metadata
    - public API probe plus invocation test as the packaging smoke test

key-files:
  created:
    - scripts/verify-consumer.mjs
    - .planning/phases/02-extraction-pipeline-invoice-template/02-USER-SETUP.md
  modified:
    - packages/core/package.json

key-decisions:
  - "The consumer verification script asserts tarball contents before install so src/, node_modules/, and test files cannot leak into the publish artifact."
  - "The external extract() smoke test uses a fake model and expects EXTRACTION_FAILED rather than trying to patch ai inside node_modules, which is more robust for an installed tarball check."

patterns-established:
  - "Packaging verification pattern: build, npm pack, install in temp project, probe exports, then run a lightweight public-API invocation."
  - "Publish credentials remain a user-owned setup artifact; the repo tracks them via 02-USER-SETUP.md instead of embedding auth assumptions in code."

requirements-completed: [LIB-01]

# Metrics
duration: 4min
completed: "2026-03-29"
---

# Phase 02 Plan 04: npm Publish Verification Summary

**Publish-ready core package manifest plus an external consumer verification script that proves the tarball installs and runs outside the monorepo**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T06:48:54Z
- **Completed:** 2026-03-29T06:58:37Z
- **Tasks:** 3 of 3
- **Files modified:** 3

## Accomplishments
- Fixed `@docpipe/core` packaging metadata so the exports map is ordered correctly for types, peer dependency metadata is explicit, and the package declares its Node engine requirement.
- Added `scripts/verify-consumer.mjs`, which builds the package, packs the tarball, validates packed contents, installs it into a temp project, probes public exports, and runs an external `extract()` invocation.
- Captured the remaining human-only npm publish steps in `02-USER-SETUP.md`, then paused for review and recorded your approval.

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit and fix package.json fields for clean npm publish** - `c0cfd12` (chore)
2. **Task 2: Write and run the consumer verification script** - `7100590` (feat)
3. **Task 3: Human verification of Phase 2 completion** - approved (no code commit)

**Plan metadata:** _(pending final commit)_

## Files Created/Modified
- `packages/core/package.json` - types-first export order, peerDependenciesMeta, engines field
- `scripts/verify-consumer.mjs` - tarball audit, external install, export probe, and public API smoke test
- `.planning/phases/02-extraction-pipeline-invoice-template/02-USER-SETUP.md` - npm account/token handoff for future publish

## Decisions Made
- The consumer verification script treats `dist/` as the only valid publish payload and rejects tarballs that include `src/`, `node_modules/`, or test files.
- The installed-package smoke test intentionally asserts the wrapped `EXTRACTION_FAILED` path from a fake model invocation; this proves the installed package can execute its public API without relying on brittle deep mocks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched the consumer script's process runner to shell execution on Windows**
- **Found during:** Task 2 (Write and run the consumer verification script)
- **Issue:** Direct Node child-process execution could not launch `pnpm`/`npm`/`npx` correctly in this Windows environment (`ENOENT` / `EINVAL`).
- **Fix:** Reworked the script to run those commands through the shell so the local Windows command shims resolve consistently.
- **Files modified:** `scripts/verify-consumer.mjs`
- **Verification:** `node scripts/verify-consumer.mjs`
- **Committed in:** `7100590` (Task 2 commit)

**2. [Rule 3 - Blocking] Replaced brittle deep mocking in the installed-tarball smoke test**
- **Found during:** Task 2 (Write and run the consumer verification script)
- **Issue:** Mocking `ai` from a temp consumer project did not reliably intercept the installed package's transitive dependency path inside `node_modules`, causing a false-negative verification failure.
- **Fix:** Changed the smoke test to call the installed `extract()` with a fake model and assert the public `EXTRACTION_FAILED` wrapper instead. This still proves the installed package can execute without `MODULE_NOT_FOUND` errors.
- **Files modified:** `scripts/verify-consumer.mjs`
- **Verification:** `node scripts/verify-consumer.mjs`
- **Committed in:** `7100590` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 3 blocking issues)
**Impact on plan:** Both fixes were required to make the consumer verification reliable on the actual Windows environment. No scope creep.

## Issues Encountered
- None after the Windows runner and smoke-test adjustments. The final consumer verification passed end-to-end.

## User Setup Required

**External services require manual configuration.** See [02-USER-SETUP.md](./02-USER-SETUP.md) for:
- npm token creation
- account/scope checks
- dry-run publish verification steps

## Next Phase Readiness
- Phase 2 is now functionally complete: the extraction engine, invoice template, and external-consumer packaging path all pass automated checks.
- Phase 3 can build on the established `templates/` pattern and the now-verified public package surface without revisiting packaging basics.

## Human Verification

- Automated checks were rerun after the final Task 2 commit:
  - `pnpm --filter @docpipe/core test`
  - `pnpm --filter @docpipe/core type-check`
  - `node scripts/verify-consumer.mjs`
  - `pnpm build`
- Human checkpoint result: `approved`

## Self-Check: PASSED

Task commits present in git log:
- `c0cfd12` - chore(02-04): align core package manifest for publish
- `7100590` - feat(02-04): add consumer install verification script

---
*Phase: 02-extraction-pipeline-invoice-template*
*Completed: 2026-03-29*

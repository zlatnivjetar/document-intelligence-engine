---
phase: 06-cli
plan: "01"
subsystem: cli
tags: [cli, commander, typescript, csv, tsdown]
requires:
  - phase: 03-core-completeness
    provides: shared extract() API, Anthropic provider factory, and built-in invoice/receipt/W-2 schemas
  - phase: 05-web-app-results-export
    provides: top-level field,value,confidence export contract reused for CLI CSV output
provides:
  - docpipe extract command with built-in template execution
  - local PDF, PNG, and JPEG signature validation for CLI inputs
  - pipe-safe JSON and CSV stdout formatting for extraction results
affects: [phase-06-cli, cli-custom-schemas, consumer-verification]
tech-stack:
  added: [commander, tsdown]
  patterns:
    [
      thin CLI wrapper around @docpipe/core with injectable stdout and stderr,
      built CLI output mirrors the web export contract for top-level CSV rows,
      package bin and tsdown output stay aligned on dist/index.js,
    ]
key-files:
  created:
    [
      packages/cli/src/document-input.ts,
      packages/cli/src/output.ts,
      packages/cli/src/templates.ts,
      packages/cli/src/cli.ts,
      packages/cli/tsdown.config.ts,
    ]
  modified:
    [
      packages/cli/package.json,
      packages/cli/src/index.ts,
      packages/cli/src/document-input.test.ts,
      packages/cli/src/output.test.ts,
      packages/cli/src/cli.test.ts,
    ]
key-decisions:
  - "The CLI stays a thin wrapper over @docpipe/core and owns only argument parsing, local file loading, and stdout formatting."
  - "CSV output reuses the web app's top-level field,value,confidence contract so CLI and browser exports stay aligned."
  - "Commander output is injected through explicit stdout and stderr writers so success payloads remain pipe-safe and testable."
patterns-established:
  - "CLI command pattern: expose runCli(argv, io) for unit-testable command behavior and bootstrap it from a minimal shebang entrypoint."
  - "CLI packaging pattern: drive bin output through tsdown.config.ts so package.json bin and emitted artifact stay locked to dist/index.js."
requirements-completed: [CLI-01, CLI-03, CLI-04]
duration: 16 min
completed: 2026-03-30
---

# Phase 06 Plan 01: CLI Baseline Summary

**Commander-backed `docpipe extract` for built-in templates with local file validation, pipe-safe JSON/CSV stdout, and a real `dist/index.js` executable**  

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-30T08:33:25+02:00
- **Completed:** 2026-03-30T08:49:25+02:00
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Added CLI helpers for local file loading, signature validation, built-in template metadata, and top-level JSON/CSV output formatting.
- Replaced the package stub with a real Commander `extract` command that calls `createAnthropicProvider()` and `extract()` through injected stdout/stderr writers.
- Aligned the CLI build with `dist/index.js`, added focused CLI tests, and verified the built artifact exposes `docpipe extract --help`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build local file-input, template, and output helpers for the CLI baseline** - `1fd3503` (feat)
2. **Task 2: Replace the stub CLI with a Commander extract command and align the built bin artifact** - `7f7a980` (feat)

**Plan metadata:** recorded in the final docs commit for summary and planning-state updates

## Files Created/Modified

- `packages/cli/src/document-input.ts` - loads local files, infers supported MIME types, and enforces PDF/PNG/JPEG signature checks.
- `packages/cli/src/output.ts` - formats extraction results as pipe-safe JSON or `field,value,confidence` CSV rows.
- `packages/cli/src/templates.ts` - exposes the built-in invoice, receipt, and W-2 schema registry from `@docpipe/core`.
- `packages/cli/src/cli.ts` - implements the Commander `extract` command with injected IO, key lookup, and extraction error handling.
- `packages/cli/src/index.ts` - bootstraps `runCli()` from the published bin entrypoint.
- `packages/cli/tsdown.config.ts` - forces the built executable to emit `dist/index.js`.
- `packages/cli/src/document-input.test.ts` - verifies supported signatures and local validation failures.
- `packages/cli/src/output.test.ts` - verifies exact JSON newline behavior and CSV quoting/header behavior.
- `packages/cli/src/cli.test.ts` - verifies template mapping, csv output, key precedence, error handling, and help text.
- `packages/cli/package.json` - points build/dev scripts at the tsdown config that emits the executable bin target.

## Decisions Made

- Kept the CLI thin and delegated all extraction logic to `@docpipe/core` so the CLI remains a consumer, not a second extraction path.
- Reused the Phase 05 CSV contract exactly so CLI output can be piped or compared consistently with the browser export behavior.
- Routed all runtime output through injected IO writers instead of `console.*` to guarantee clean stdout streams during success paths.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- PowerShell execution policy blocked the `pnpm.ps1` shim, so verification commands were rerun through `pnpm.cmd`.
- The sandbox blocked Vitest process spawning with `spawn EPERM`, so the focused CLI suite was rerun unsandboxed to get a real verification result.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 2 can now add `--schema <path>` on top of a working built-in template command instead of starting from a stub.
- The packaged CLI already builds and exposes the correct executable path, so consumer verification can focus on schema loading and install-time behavior.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/06-cli/06-01-SUMMARY.md`
- Task commit `1fd3503` exists in git history
- Task commit `7f7a980` exists in git history

---
*Phase: 06-cli*
*Completed: 2026-03-30*

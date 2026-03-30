---
phase: 06-cli
verified: 2026-03-30T09:04:30+02:00
status: passed
score: 4/4 must-haves verified
---

# Phase 06: CLI Verification Report

**Phase Goal:** Developers can use `docpipe extract` from the terminal to extract structured data from a local file and pipe the result into other tools.
**Verified:** 2026-03-30T09:04:30+02:00
**Status:** passed
**Re-verification:** No

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `docpipe extract invoice.pdf --template invoice --key ...` prints valid JSON to stdout and exits 0 on success. | VERIFIED | `packages/cli/src/cli.ts` wires built-in templates through `createAnthropicProvider()` and `extract()`, then writes only `formatExtractionOutput(result, format)` to stdout. `packages/cli/src/cli.test.ts` verifies invoice template mapping and clean stdout behavior. |
| 2 | `docpipe extract receipt.jpg --schema ./my-schema.ts --format csv` accepts a local custom schema and emits CSV through the same output path. | VERIFIED | `packages/cli/src/custom-schema.ts` loads `.ts` and `.mjs` schema modules through `createJiti(import.meta.url, { interopDefault: true })` and validates `z.object({...})` exports. `packages/cli/src/cli.ts` routes `--schema` through that loader and reuses `formatExtractionOutput()`. `packages/cli/src/cli.test.ts` verifies `--schema` plus `--format csv`, and `scripts/verify-cli-consumer.mjs` proves the installed binary can run the schema path before any network call. |
| 3 | CLI output is pipe-safe: success payloads go to stdout only, failures go to stderr only, and failures exit non-zero. | VERIFIED | `packages/cli/src/output.ts` emits only JSON or `field,value,confidence` CSV rows. `packages/cli/src/cli.ts` writes missing-key, local validation, and extraction failures to stderr via injected IO writers, never `console.*`. Focused CLI tests cover missing-key, invalid API key, unsupported file type, and mutual exclusivity errors. |
| 4 | `docpipe extract --help` documents template and schema flags, output formats, and `ANTHROPIC_API_KEY`, and the packaged binary works outside the monorepo. | VERIFIED | `packages/cli/dist/index.js` exists from the `tsdown` build configured in `packages/cli/tsdown.config.ts`. `node packages/cli/dist/index.js extract --help` prints `--template`, `--schema`, `--format`, `--key`, and `ANTHROPIC_API_KEY`. `scripts/verify-cli-consumer.mjs` packs the core and CLI tarballs, installs them into a temp consumer project, runs `npx docpipe extract --help`, and verifies the pre-network missing-key path. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/cli/src/cli.ts` | Commander-backed extract command runner with injectable stdout/stderr behavior | VERIFIED | Defines `runCli(argv, io)`, supports `--template`, `--schema`, `--format`, and `--key`, and routes success/error output cleanly. |
| `packages/cli/src/document-input.ts` | Node file reader plus PDF/PNG/JPEG MIME inference and signature validation | VERIFIED | Maps `.pdf`, `.png`, `.jpg`, and `.jpeg` to supported MIME types and enforces signature checks before extraction. |
| `packages/cli/src/output.ts` | JSON and CSV stdout formatters for `ExtractionResult` payloads | VERIFIED | Returns `JSON.stringify(result.data, null, 2) + '\n'` for JSON and top-level quoted `field,value,confidence` rows for CSV. |
| `packages/cli/src/custom-schema.ts` | Local module loader for default or named Zod object schema exports, including `.ts` files | VERIFIED | Loads schema modules through `jiti`, validates export shape, and returns `CustomSchema` metadata for the shared core extractor. |
| `packages/cli/tsdown.config.ts` | CLI build config that emits the executable path referenced by package.json bin | VERIFIED | Configures `outExtensions` so the published bin target resolves to `dist/index.js`. |
| `scripts/verify-cli-consumer.mjs` | External pack/install smoke test for the CLI binary, help text, and pre-network validation path | VERIFIED | Packs both tarballs, audits the CLI tarball contents, installs into a temp project, and runs the shipped `docpipe` binary outside the monorepo. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `packages/cli/src/cli.ts` | `@docpipe/core` | `createAnthropicProvider()` and `extract()` | WIRED | The CLI remains a thin consumer of the shared core extraction surface. |
| `packages/cli/src/cli.ts` | `packages/cli/src/output.ts` | `formatExtractionOutput(result, format)` | WIRED | Both built-in template and custom-schema runs share the same output formatter path. |
| `packages/cli/src/cli.ts` | `packages/cli/src/custom-schema.ts` | `loadCustomSchema(schemaPath)` | WIRED | `--schema` resolves through the local loader before calling `extract()`. |
| `packages/cli/package.json` | `packages/cli/tsdown.config.ts` | `dist/index.js` build/bin alignment | WIRED | The package bin and build output both target `dist/index.js`. |
| `scripts/verify-cli-consumer.mjs` | packed core and CLI tarballs | `npm pack` + temp install + `npx docpipe` | WIRED | Verified by `gsd-tools verify key-links` and the successful consumer install run in this session. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Focused CLI helper and command tests | `pnpm.cmd --filter @docpipe/cli exec vitest run src/document-input.test.ts src/output.test.ts src/cli.test.ts` | Passed earlier in this session | PASS |
| Focused custom-schema and CLI integration tests | `pnpm.cmd --filter @docpipe/cli exec vitest run src/custom-schema.test.ts src/cli.test.ts` | 13 tests passed | PASS |
| CLI build emits executable bin target | `pnpm.cmd --filter @docpipe/cli build` | Passed; emitted `packages/cli/dist/index.js` | PASS |
| Built CLI help output | `node packages/cli/dist/index.js extract --help` | Printed `--template`, `--schema`, `--format`, `--key`, and `ANTHROPIC_API_KEY` guidance | PASS |
| Packed consumer install | `node scripts/verify-cli-consumer.mjs` | Passed end-to-end outside the monorepo | PASS |
| Core regression suite | `pnpm.cmd --filter @docpipe/core test` | 82 tests passed | PASS |
| Web regression type-check | `pnpm.cmd --filter web type-check` | Passed | PASS |
| Web regression production build | `pnpm.cmd --filter web build` | Passed; emitted `/` and `/api/pdf-inspect` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `CLI-01` | `06-01-PLAN.md` | Single-file extraction with a built-in template | SATISFIED | `runCli()` accepts `extract <file> --template <name>` and maps built-in templates through `@docpipe/core`. |
| `CLI-02` | `06-02-PLAN.md` | Custom schema support with `--schema <path>` | SATISFIED | `loadCustomSchema()` accepts `.ts` and `.mjs` modules and `runCli()` routes `--schema` through the shared extraction path. |
| `CLI-03` | `06-01-PLAN.md`, `06-02-PLAN.md` | Output formats JSON (default) and CSV | SATISFIED | `formatExtractionOutput()` supports both formats and the CLI tests verify CSV output for both template and custom-schema flows. |
| `CLI-04` | `06-01-PLAN.md`, `06-02-PLAN.md` | Stdout output for piping into other tools | SATISFIED | Success writes only formatted payloads to stdout; errors remain on stderr with non-zero exit codes. |

No orphaned Phase 06 requirement IDs were found. The roadmap and requirements files both account for `CLI-01`, `CLI-02`, `CLI-03`, and `CLI-04`.

### Human Verification Required

None. The phase goal is fully covered by automated CLI, packaging, and regression checks.

### Gaps Summary

No gaps found. Phase 06 goal is fully achieved.

---

_Verified: 2026-03-30T09:04:30+02:00_
_Verifier: Codex_

# Phase 1: Monorepo + Types + Provider - Context

**Gathered:** 2026-03-28 (discuss mode — no discussion needed, all decisions from stack research)
**Status:** Ready for planning

<domain>
## Phase Boundary

Monorepo scaffold (Turborepo + pnpm), core TypeScript types/interfaces locked, and the Anthropic provider implements the `LLMProvider` abstraction. Every downstream phase builds on this. Phase ends when `turbo build` passes cleanly, core types are importable by both web and CLI packages, and `AnthropicProvider` compiles with no `any` types in the public interface.

Creating posts/extraction logic is Phase 2. This phase is infrastructure only.
</domain>

<decisions>
## Implementation Decisions

### Workspace layout
- **D-01:** Workspace shape: `apps/web` (Next.js), `packages/core` (extraction engine + types), `packages/cli` (CLI tool)
- **D-02:** Package manager: pnpm 10.x with `pnpm-workspace.yaml` defining `apps/*` and `packages/*`
- **D-03:** Monorepo orchestrator: Turborepo 2.8.x — `turbo.json` pipeline with `build` depending on `^build` (topological order ensures core builds before consumers)
- **D-04:** Package names: `@docpipe/core`, web app package, `@docpipe/cli` (scoped, `publishConfig: { access: "public" }` on core and CLI)

### TypeScript setup
- **D-05:** TypeScript 5.8+, strict mode enforced across all packages
- **D-06:** Shared `tsconfig.base.json` at root; each package extends it
- **D-07:** `tsdown` for bundling `packages/core` and `packages/cli` — dual ESM + CJS output with isolated declarations (required by tsdown, enforced by TS 5.5+)
- **D-08:** No `any` types in the public interface of `packages/core` — this is a success criterion

### Provider abstraction
- **D-09:** Vercel AI SDK (`ai` 6.x) provides the `LanguageModelV1` interface — this IS the `LLMProvider` abstraction. No custom interface needed.
- **D-10:** Caller pre-configures the provider and passes a `LanguageModelV1` instance: `extract(input, schema, model: LanguageModelV1)`. BYOK is handled by the caller: `createAnthropic({ apiKey })('claude-sonnet-4-6')`
- **D-11:** `AnthropicProvider` = using `@ai-sdk/anthropic` 3.0.64 as the Claude adapter. This is the default implementation shipped in Phase 1.
- **D-12:** Swapping providers (e.g., OpenAI) requires only dropping in a different AI SDK adapter — no changes to `packages/core`

### Core types (locked in Phase 1)
- **D-13:** `ExtractionInput` accepts either `Buffer` or base64 string for the document: `{ document: Buffer | string, mimeType: 'application/pdf' | 'image/png' | 'image/jpeg' }`. Web app sends base64, CLI sends Buffer — both work.
- **D-14:** `ExtractionResult<T>` shape: `{ data: T, confidence: Record<string, number>, overallConfidence: number }` — parallel confidence map (not nested per-field). Clean separation of data from metadata.
- **D-15:** `ExtractionError` is a discriminated union with `code` field: `INVALID_API_KEY | RATE_LIMITED | UNSUPPORTED_FILE_TYPE | EXTRACTION_FAILED | VALIDATION_FAILED`. Includes `message: string` and `retryable: boolean`.

### Test setup
- **D-16:** `vitest` 3.x across all packages — zero-config TypeScript + ESM, native monorepo workspace support

### Claude's Discretion
- Exact `tsconfig.json` options beyond strict mode (e.g., `moduleResolution`, `target`)
- Whether to use TypeScript project references vs pnpm workspace resolution
- Internal helper types not exposed in the public API
- `ExtractionResult` generic constraint details (e.g., `T extends z.ZodTypeAny` vs `T extends object`)
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack decisions
- `CLAUDE.md` §Technology Stack — Full stack table with versions, rationale, and compatibility notes. All version numbers and library choices come from here.
- `CLAUDE.md` §What NOT to Use — Explicitly banned libraries (pdf-parse, tsup, axios, sharp in API routes, LangChain).
- `CLAUDE.md` §Vercel Free Tier Constraints — Timeout and bundle size limits that affect architecture decisions.

### Phase requirements
- `.planning/REQUIREMENTS.md` §LIB-02, EXTRACT-06 — The two requirements this phase covers.
- `.planning/ROADMAP.md` §Phase 1 — Success criteria (4 items) this phase must satisfy.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — green-field project. No existing code.

### Established Patterns
- None yet — this phase establishes the patterns.

### Integration Points
- `packages/core` → consumed by `apps/web` and `packages/cli` via pnpm workspace reference (`"@docpipe/core": "workspace:*"`)
- `apps/web` → Next.js 16.1 with App Router; imports core via workspace ref
- `packages/cli` → commander 13.x entry point; imports core via workspace ref
</code_context>

<specifics>
## Specific Ideas

- User wants Phase 1 to be broken into a **multi-step implementation plan** — planner should create fine-grained tasks, not a single monolithic "set up monorepo" task.
- The project brief (`docpipe-project-brief.md`) uses `packages/web` but the CLAUDE.md stack research says `apps/web` — use `apps/web` per stack research (standard Turborepo convention for apps).
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 01-monorepo-types-provider*
*Context gathered: 2026-03-28*

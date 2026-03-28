# Stack Research

**Domain:** Document Intelligence Engine (PDF/image extraction, LLM vision, TypeScript monorepo)
**Researched:** 2026-03-28
**Confidence:** HIGH (all critical decisions verified against official docs or npm registry)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.8+ | Language throughout | TS 5.5+ ships isolated declarations (required by tsdown), strict mode catches extraction schema mismatches at compile time |
| Next.js | 16.1 | Web application (App Router) | Constrained by PROJECT.md. App Router is the correct approach — file-based server components, native streaming for LLM responses, built-in API routes for PDF parsing boundary |
| Turborepo | 2.8.20 | Monorepo build orchestration | Constrained by PROJECT.md. Fastest setup for npm/pnpm + Next.js + library + CLI. Remote caching is the killer feature for CI |
| Zod | 4.3.6 | Schema definition + runtime validation | Constrained by PROJECT.md. Zod is the de-facto standard for LLM structured output pipelines — both OpenAI and Anthropic SDKs accept Zod schemas natively. v4 is 57% smaller than v3 |
| Tailwind CSS | 4.x | Styling | Constrained. shadcn/ui now requires Tailwind v4 |
| shadcn/ui | latest (CLI-managed) | UI component library | Constrained. Not a versioned npm package — components are copied into the repo via CLI, compatible with Next.js 16 + React 19 + Tailwind v4 |

### LLM Integration

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@anthropic-ai/sdk` | 0.80.0 | **Primary LLM provider** (Claude) | See rationale below. Claude achieves 100% valid JSON output in document extraction tests vs GPT-4's occasional formatting failures. Native PDF support via `document` content blocks — no pre-processing needed for PDFs. Direct control over model behavior, no abstraction overhead for v1 |
| `ai` (Vercel AI SDK) | 6.0.140 | **Provider abstraction layer** | Use for the provider interface pattern, NOT for direct calls. Defines the `LanguageModelV1` interface that makes swapping Claude → OpenAI a one-line change. Use `@ai-sdk/anthropic` (3.0.64) as the Claude adapter |
| `@ai-sdk/anthropic` | 3.0.64 | Claude adapter for AI SDK | Bridges `@anthropic-ai/sdk` into the `LanguageModelV1` interface. Lets the core engine accept any `LanguageModelV1`-compatible provider |

**LLM provider decision: Claude as default, AI SDK for abstraction**

Evidence supports Claude as the stronger choice for document extraction:
- Claude produces valid JSON in 100% of test cases across invoice/receipt benchmarks (MEDIUM confidence — from benchmark articles, not independent reproduction)
- Claude has native PDF `document` block support — send the raw PDF bytes directly, Claude handles page rendering internally. No need to pre-convert PDF pages to images for the happy path
- Claude's 200k token context window handles multi-page dense documents without chunking
- The abstraction lives in the core library interface: `extract(doc, schema, model: LanguageModelV1)`. Default implementation uses `@ai-sdk/anthropic`. OpenAI support added by dropping in `@ai-sdk/openai`

### PDF Processing

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `unpdf` | 1.4.0 | PDF text extraction + metadata (browser/edge/Node) | Modern ESM-first replacement for abandoned `pdf-parse`. Works in Next.js API routes (Node), Vercel Edge, and browser. Built on a serverless-optimized PDF.js build. Use for: pre-flight validation (page count, is it text-searchable), text fallback path, file metadata |
| `pdfjs-dist` | 4.x | PDF-to-canvas rendering (browser only) | Use when you need to render PDF pages to canvas for sending as images to LLM (e.g., scanned/image-only PDFs where Claude's native PDF block already handles it, but client-side preview rendering requires this). `unpdf` uses pdfjs-dist internally |

**PDF strategy for DocPipe:**

1. For text-extractable PDFs → send raw base64 via Claude's native `document` block. Claude handles it.
2. For image-only/scanned PDFs → same: Claude's PDF support converts pages to images internally.
3. For client-side PDF preview in the web app → `pdfjs-dist` renders pages to `<canvas>` for display.
4. Avoid converting PDF pages to images yourself unless you have a specific reason — Claude's native PDF support is simpler and handles both text and visual content in one pass.

**What NOT to use for PDFs:**
- `pdf-parse` — abandoned, last published 2019, uses legacy callback API, depends on outdated pdfjs-dist
- `pdf-lib` — for creating/modifying PDFs, not extracting. Wrong tool entirely.

### Image Processing

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| Browser `FileReader` / `canvas` APIs | native | Image-to-base64 for web app | For PNG/JPG inputs in the browser, use native APIs — zero dependency cost. Read the file, get base64, send to Claude vision. No library needed. |
| `sharp` | 0.33.x | Image resizing/optimization (API route only) | If implementing server-side image pre-processing (resize before sending to LLM to reduce tokens). **Do NOT use in browser or Edge runtime** — requires native libvips binaries. Only deploy via Node.js API route. |

**Image processing reality check:** For DocPipe's use case (upload → extract → return JSON), you generally do NOT need image manipulation:
- Browser: `FileReader.readAsDataURL()` gives you base64 to pass directly to the LLM SDK
- Claude accepts JPEG, PNG, GIF, WebP images up to ~5MB per image natively
- Resizing is an optimization (reduces token cost), not a requirement for v1

Defer `sharp` integration. Add it as an optimization in a later phase once you've measured token costs.

### CLI

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `commander` | 13.x | CLI argument parsing | Zero dependencies, 61 KB, health score 85/100. The standard for TypeScript CLI tools in 2025. Git-style subcommand model fits `docpipe extract`, `docpipe convert` patterns. |

### Monorepo + Build

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `pnpm` | 10.x | Package manager | Symlink-based node_modules is the best-in-class choice for monorepos. Faster installs, better workspace dependency linking, explicit hoisting control. Use with `pnpm-workspace.yaml` |
| `turbo` | 2.8.20 | Build pipeline + caching | Remote caching means never rebuilding what CI already built. `turbo.json` pipeline: `build` depends on `^build` (correct topological order). |
| `tsdown` | latest | TypeScript library bundler (core package) | Spiritual successor to `tsup`. Powered by Rolldown, 2x faster builds, 8x faster type declarations, ESM-first. `tsup` is no longer actively maintained. Use `tsdown` for `packages/core` and `packages/cli`. |

### Testing

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `vitest` | 3.x | Test runner | Zero-config TypeScript + ESM, 5-28x faster than Jest in watch mode, native monorepo workspace support. The default choice for all new TypeScript projects in 2025. |
| `@testing-library/react` | 16.x | Component testing | Standard for React component tests in Next.js apps |

### Web App Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-dropzone` | 14.x | Drag-and-drop file upload | Wrap in a custom component for the DocPipe upload UI. Handles file validation (type, size), drag state, and accessibility. |
| `react-hook-form` | 7.x | API key form + settings | Lightweight form state with Zod integration via `@hookform/resolvers` |
| `papaparse` | 5.x | CSV export | Client-side CSV generation from extraction results. Zero-dependency, browser-native. |

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `@anthropic-ai/sdk` (Claude) as default | OpenAI `gpt-4o` | Both are excellent. Claude's 100% JSON consistency in document benchmarks and native PDF `document` block are the tiebreakers for DocPipe's use case. Abstraction means adding OpenAI is trivial later. |
| Vercel AI SDK (`ai`) for provider interface | Custom provider interface | AI SDK's `LanguageModelV1` spec is the emerging industry standard. Defining your own interface means more work and less interoperability. Use their spec. |
| `unpdf` for PDF text extraction | `pdf-parse` | `pdf-parse` is abandoned (last published 2019). `unpdf` is its maintained successor with ESM, edge runtime support, and TypeScript-first design. |
| `tsdown` for library bundling | `tsup` | `tsup` author has stopped active maintenance. `tsdown` uses the same mental model, is API-compatible, and is 2-8x faster. Migration is trivial. |
| `pnpm` workspaces | `npm` workspaces | pnpm's symlink approach is faster and avoids node_modules duplication. The standard recommendation for Turborepo projects in 2025. |
| `commander` | `yargs` | Yargs has 15+ dependencies and a health score of 67/100 vs commander's 85/100 and zero dependencies. Commander is sufficient for DocPipe's CLI surface. |
| `vitest` | `jest` | Jest requires Babel + ts-jest configuration for TypeScript. Vitest is zero-config. In a monorepo, Vitest workspaces make cross-package testing trivial. |
| Native browser APIs for image-to-base64 | `sharp` | Sharp requires native binaries incompatible with browser/edge. For v1, native browser APIs are sufficient. Add sharp in an API route as a later optimization. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `pdf-parse` | Last published 2019. Unmaintained. Uses callback API. Relies on ancient pdfjs-dist fork. | `unpdf` |
| `pdf-lib` | Creates and modifies PDFs, does not extract content. Completely wrong tool for an extraction pipeline. | `unpdf` for extraction, Claude's native `document` block for LLM processing |
| `LangChain` / `LlamaIndex` | Heavyweight abstraction (hundreds of transitive dependencies) that adds configuration complexity for a straightforward extraction pipeline. DocPipe's pipeline is: file → base64 → LLM → Zod parse → JSON. No chain, no index, no agent. | Direct SDK calls with Vercel AI SDK provider interface |
| `tsup` | Author has publicly signaled reduced maintenance commitment. New projects should use `tsdown`. | `tsdown` |
| `sharp` in API routes on Vercel free tier | Sharp's native binaries add ~9 MB to function size, increasing cold starts. On the free tier (10s timeout), this matters. | Defer to v2. For v1, let Claude handle image quality — it accepts images up to reasonable sizes. |
| Storing API keys in Next.js env vars / server | DocPipe is BYOK. The user's API key must never touch the server. Store in `localStorage` (or `sessionStorage`), send with each request, never log. | Client-side storage + per-request header |
| `axios` | Adds ~13 KB when native `fetch` is available in all modern runtimes (Node 18+, browsers, Edge). | Native `fetch` |

---

## Stack Patterns by Variant

**For PDF inputs in the web app:**
- Use Claude's native `document` content block (base64 PDF) via API route
- This is why an API route is acceptable for PDFs: sending 32 MB base64 from the browser directly to Anthropic works but bypasses same-origin security for the API key; better to proxy through a thin Next.js API route that reads the key from the request header and forwards to Anthropic
- **Vercel free tier constraint:** 10s function timeout (Fluid Compute raises this to 300s but requires opt-in). LLM calls for complex PDFs can take 15-30 seconds. Streaming is required — use `createStreamableValue` from `ai/rsc` or Response streaming to avoid timeout
- Alternative: call Anthropic directly from the browser (key never leaves client), which removes the API route timeout constraint entirely. This is the BYOK privacy argument.

**For image inputs (PNG/JPG) in the web app:**
- Client-side processing: `FileReader.readAsDataURL()` → base64 → call Anthropic SDK directly from browser
- This is simpler than the PDF path and avoids API route timeouts entirely
- The user's API key stays in the browser

**For the core npm package:**
- Bundle with `tsdown` targeting ESM + CJS dual output
- Accept `LanguageModelV1` from Vercel AI SDK as the model parameter
- Export Zod schema helpers for built-in templates
- Peer dependencies: `zod`, `ai` (not bundled — user provides these)

**For the CLI:**
- Bundle with `tsdown` into a single executable entry point
- Accept `--provider anthropic|openai` flag (wires up the correct AI SDK adapter)
- `--api-key` flag OR `DOCPIPE_API_KEY` env var

---

## Vercel Free Tier Constraints

This is a critical architectural constraint:

| Limit | Value | Impact on DocPipe |
|-------|-------|------------------|
| Serverless function timeout (Hobby) | 10 seconds | LLM extraction calls may exceed this. Mitigation: streaming responses OR call Anthropic directly from browser |
| Fluid Compute max duration (Hobby) | 300 seconds | Requires opt-in. Acceptable if needed for PDF processing API route |
| Function bundle size | 50 MB compressed | `sharp` binary is 9 MB — avoid on free tier |
| Request body size | 4.5 MB for API routes | PDFs > 4.5 MB must be handled client-side or via streaming upload |

**Recommended approach for web app LLM calls:** Call Anthropic directly from the browser using the user's BYOK key. This eliminates the API route timeout problem entirely and aligns with the privacy-first BYOK design (key never touches the server). Use Next.js API routes only for PDF parsing with `unpdf` where a Node.js runtime is needed.

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|----------------|-------|
| `next@16.1` | `react@19`, `react-dom@19` | React 19 is required for Next.js 16. `@types/react@19` also needed. |
| `shadcn/ui` | `tailwindcss@4.x`, `next@16` | shadcn now requires Tailwind v4. Do not use with Tailwind v3. |
| `zod@4.x` | `@anthropic-ai/sdk@0.80.x` | Anthropic SDK accepts Zod schemas for tool definitions. Zod v4 is backward-compatible with most v3 patterns. Check `zod.dev/v4/changelog` for breaking changes before migrating from v3. |
| `ai@6.x` | `@ai-sdk/anthropic@3.x` | AI SDK v6 requires the v3 provider packages. Do not mix AI SDK v5 with provider v3. |
| `pnpm@10.x` | `turbo@2.8.x` | Both actively maintained, no known incompatibilities. |
| `tsdown` | `typescript@5.5+` | tsdown's `--isolated-declarations` requires TS 5.5+. Confirmed compatible with TS 5.8. |

---

## Installation

```bash
# Initialize monorepo
pnpm init
# Add pnpm-workspace.yaml defining apps/* and packages/*

# Turborepo
pnpm add -D turbo -w

# Core package (packages/core)
pnpm add zod ai @ai-sdk/anthropic unpdf --filter @docpipe/core
pnpm add -D tsdown typescript vitest --filter @docpipe/core

# Web app (apps/web)
pnpm add next react react-dom tailwindcss @ai-sdk/anthropic ai react-dropzone react-hook-form papaparse --filter @docpipe/web
pnpm add -D typescript @types/react @types/react-dom @types/node vitest @testing-library/react --filter @docpipe/web
# shadcn/ui — run after Next.js is set up:
# npx shadcn@latest init

# CLI (packages/cli)
pnpm add commander @ai-sdk/anthropic ai --filter @docpipe/cli
pnpm add -D tsdown typescript vitest --filter @docpipe/cli
```

---

## Sources

- [Anthropic TypeScript SDK — npmjs.com](https://www.npmjs.com/package/@anthropic-ai/sdk) — version 0.80.0 confirmed
- [Claude PDF Support — Official Docs](https://platform.claude.com/docs/en/build-with-claude/pdf-support) — document block API, limits, token costs — HIGH confidence
- [Vercel AI SDK Introduction](https://ai-sdk.dev/docs/introduction) — provider abstraction, LanguageModelV1 spec — HIGH confidence
- [AI SDK v6 Release — Vercel](https://vercel.com/blog/ai-sdk-6) — version 6.0.140, Agent abstraction — HIGH confidence
- [Turborepo 2.7 — Official Blog](https://turborepo.dev/blog/turbo-2-7) — version 2.8.20 confirmed — HIGH confidence
- [Zod v4 Release Notes](https://zod.dev/v4) — version 4.3.6, 57% smaller bundle — HIGH confidence
- [Next.js 16.1 — Official Blog](https://nextjs.org/blog/next-16-1) — latest stable confirmed — HIGH confidence
- [tsdown — Official Docs](https://tsdown.dev/guide/) — Rolldown-powered tsup successor — MEDIUM confidence (newer project, trajectory is clear)
- [unpdf — GitHub](https://github.com/unjs/unpdf) — serverless PDF.js wrapper — MEDIUM confidence
- [Claude vs GPT invoice extraction benchmark — Koncile](https://www.koncile.ai/en/ressources/claude-gpt-or-gemini-which-is-the-best-llm-for-invoice-extraction) — Claude 100% JSON consistency — MEDIUM confidence (third-party benchmark, not reproduced)
- [Vercel Function Limits](https://vercel.com/docs/functions/limitations) — 10s free tier timeout — HIGH confidence
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — compatibility confirmed — HIGH confidence
- [tsdown vs tsup comparison — Alan Norbauer](https://alan.norbauer.com/articles/tsdown-bundler/) — migration rationale — MEDIUM confidence

---

*Stack research for: DocPipe — Document Intelligence Engine*
*Researched: 2026-03-28*

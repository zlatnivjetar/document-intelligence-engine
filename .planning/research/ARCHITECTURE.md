# Architecture Research

**Domain:** Document intelligence engine — TypeScript monorepo with core library, web app, CLI
**Researched:** 2026-03-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Consumer Layer                               │
│  ┌──────────────────────┐       ┌──────────────────────┐        │
│  │   packages/web       │       │   packages/cli       │        │
│  │  Next.js App Router  │       │   Node.js CLI        │        │
│  │  (thin wrapper)      │       │   (thin wrapper)     │        │
│  └──────────┬───────────┘       └──────────┬───────────┘        │
└─────────────┼─────────────────────────────-┼────────────────────┘
              │ import @docpipe/core          │ import @docpipe/core
┌─────────────┼───────────────────────────── ┼────────────────────┐
│             ▼                              ▼                     │
│                      packages/core                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Public API (index.ts)                    │   │
│  │  extract() · ExtractionSchema · ExtractionResult         │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │                  Extraction Pipeline                      │   │
│  │                                                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │  Ingest │→ │Preproc- │→ │  LLM     │→ │ Validate │   │   │
│  │  │ (Stage 1)│  │ess     │  │ Extract  │  │ & Score  │   │   │
│  │  │         │  │(Stage 2)│  │(Stage 3) │  │(Stage 4) │   │   │
│  │  └─────────┘  └─────────┘  └──────────┘  └──────────┘   │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │              Provider Abstraction Layer                   │   │
│  │  ┌────────────────┐   ┌────────────────┐                 │   │
│  │  │ AnthropicProv. │   │  OpenAIProv.   │  ← future       │   │
│  │  └────────────────┘   └────────────────┘                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Template Registry                        │   │
│  │  invoice · receipt · contract  (built-in Zod schemas)    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `packages/core` | All extraction logic, provider abstraction, templates | Pure TypeScript, no framework deps |
| `packages/web` | UI shell, file handling, results display, BYOK key management | Next.js App Router + shadcn/ui |
| `packages/cli` | Arg parsing, file I/O, format output | Commander.js or yargs, imports core |
| Extraction Pipeline | Orchestrate the four stages in order, handle retries | Async function chain with Result types |
| Provider Abstraction | Normalize LLM API differences behind one interface | Interface + adapter classes |
| Template Registry | Map template names to Zod schemas + prompts | Simple object map, extensible |
| Validator | Run Zod `.safeParse()`, accumulate field-level confidence | Pure function, no side effects |

## Recommended Project Structure

```
docpipe/
├── apps/                         # (not used — PROJECT.md calls them packages/)
├── packages/
│   ├── core/                     # @docpipe/core — the npm package
│   │   ├── src/
│   │   │   ├── index.ts          # public API surface (re-exports only)
│   │   │   ├── extract.ts        # main extract() entry point
│   │   │   ├── pipeline/
│   │   │   │   ├── ingest.ts     # Stage 1: validate & normalize input
│   │   │   │   ├── preprocess.ts # Stage 2: PDF→images, resize, normalize
│   │   │   │   ├── llm.ts        # Stage 3: send to provider, get raw response
│   │   │   │   └── validate.ts   # Stage 4: Zod parse, confidence scoring, retry
│   │   │   ├── providers/
│   │   │   │   ├── types.ts      # LLMProvider interface
│   │   │   │   ├── anthropic.ts  # AnthropicProvider (first implementation)
│   │   │   │   └── index.ts      # createProvider() factory
│   │   │   ├── templates/
│   │   │   │   ├── index.ts      # template registry + getTemplate()
│   │   │   │   ├── invoice.ts    # Zod schema + system prompt
│   │   │   │   └── receipt.ts
│   │   │   └── types.ts          # ExtractionInput, ExtractionResult, etc.
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                      # Next.js web app
│   │   ├── app/
│   │   │   ├── page.tsx          # main extraction UI
│   │   │   ├── api/
│   │   │   │   └── parse-pdf/    # API route for server-side PDF parsing only
│   │   │   │       └── route.ts
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── DropZone.tsx
│   │   │   ├── SchemaSelector.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   └── ApiKeyInput.tsx
│   │   └── package.json
│   │
│   └── cli/                      # CLI tool
│       ├── src/
│       │   ├── index.ts          # Commander entry point
│       │   └── format.ts         # JSON/CSV output formatters
│       └── package.json
│
├── turbo.json
├── package.json                  # workspace root
└── tsconfig.base.json
```

### Structure Rationale

- **`packages/core/src/index.ts` exports only:** Consumers import from `@docpipe/core`, never from internal paths. This lets you refactor internals without breaking consumers.
- **`pipeline/` as four discrete files:** Each stage is independently testable. Stage 2 (preprocess) has different browser vs. Node behavior — isolation makes this explicit.
- **`providers/types.ts` defines the interface first:** The Anthropic adapter implements the interface. Adding OpenAI is writing one new file, not modifying existing code.
- **`templates/` as a registry pattern:** `getTemplate('invoice')` returns `{ schema, systemPrompt }`. New templates are one file + one registry entry.
- **Web `api/parse-pdf/` scoped tightly:** The only server route in the web app is PDF-to-image conversion, which cannot run client-side with current browser APIs. All LLM calls stay client-side (BYOK).

## Architectural Patterns

### Pattern 1: Linear Pipeline with Result Propagation

**What:** The `extract()` function calls four stages sequentially. Each stage returns a `Result<T, ExtractionError>` discriminated union. On failure, the pipeline short-circuits and returns the error with the stage that failed.

**When to use:** Any multi-step process where later steps depend on earlier ones and partial execution needs clear reporting.

**Trade-offs:** More verbose than throwing exceptions, but every caller knows exactly what can fail and where.

**Example:**
```typescript
// packages/core/src/extract.ts
export async function extract(input: ExtractionInput): Promise<ExtractionResult> {
  const ingested = await ingest(input);
  if (!ingested.ok) return { success: false, error: ingested.error, stage: 'ingest' };

  const images = await preprocess(ingested.value);
  if (!images.ok) return { success: false, error: images.error, stage: 'preprocess' };

  const raw = await callLLM(images.value, input.provider, input.schema);
  if (!raw.ok) return { success: false, error: raw.error, stage: 'llm' };

  const validated = await validateAndScore(raw.value, input.schema);
  if (!validated.ok && input.retryOnFailure) {
    // retry once with error feedback in prompt
    const retried = await callLLM(images.value, input.provider, input.schema, raw.value);
    return validateAndScore(retried.value, input.schema);
  }
  return validated;
}
```

### Pattern 2: Provider Interface + Adapter

**What:** Define a minimal `LLMProvider` interface that all adapters must implement. The pipeline only knows the interface. Callers pass a concrete provider instance at call time.

**When to use:** Any system that needs to swap a dependency (LLM provider, storage backend) without changing business logic.

**Trade-offs:** Adds one level of indirection. Worth it here because BYOK means the caller always constructs the provider — there's no global singleton.

**Example:**
```typescript
// packages/core/src/providers/types.ts
export interface LLMProvider {
  readonly name: string;
  extractStructured(params: {
    images: Base64Image[];
    schema: ZodSchema;
    systemPrompt: string;
    apiKey: string;
  }): Promise<unknown>;  // returns raw JSON — validation happens in Stage 4
}

// packages/core/src/providers/anthropic.ts
export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  async extractStructured(params) {
    // maps params to Claude Messages API format
  }
}
```

### Pattern 3: Schema + Prompt Co-location (Template Pattern)

**What:** Each template is a self-contained object: `{ name, schema: ZodSchema, systemPrompt: string, exampleOutput? }`. The schema drives both the LLM prompt (JSON Schema serialized into the prompt) and the Zod validation in Stage 4.

**When to use:** Any domain where the output shape and the instructions for generating that output are tightly coupled.

**Trade-offs:** System prompt is duplicated in the bundle (minor). The alternative — storing prompts separately — creates drift between schema and prompt.

**Example:**
```typescript
// packages/core/src/templates/invoice.ts
export const invoiceTemplate: Template = {
  name: 'invoice',
  systemPrompt: `Extract invoice data as JSON matching this schema exactly: ...`,
  schema: z.object({
    invoiceNumber: z.string(),
    date: z.string(),
    vendor: z.string(),
    lineItems: z.array(z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
    })),
    totalAmount: z.number(),
  }),
};
```

### Pattern 4: Confidence Scores as Schema Wrapper

**What:** Rather than asking the LLM to generate confidence numbers (unreliable), wrap every schema field in an object with `value` + `confidence: 'high' | 'medium' | 'low'`. The LLM assigns categorical confidence; Stage 4 validates that confidence values are within the allowed enum.

**When to use:** Document extraction where fields may be absent or ambiguous (handwritten text, partial scans).

**Trade-offs:** Doubles the output token count. Categorical confidence is less precise than numeric but more honest — LLMs cannot produce calibrated numeric probabilities.

**Example:**
```typescript
const fieldWithConfidence = <T extends z.ZodTypeAny>(fieldSchema: T) =>
  z.object({
    value: fieldSchema,
    confidence: z.enum(['high', 'medium', 'low']),
  });

// Usage in template schema:
z.object({
  invoiceNumber: fieldWithConfidence(z.string()),
  totalAmount: fieldWithConfidence(z.number()),
})
```

## Data Flow

### Core Extraction Flow (Web App)

```
[User drops PDF/image in browser]
        │
        ▼
[DropZone component — reads File object]
        │
        │  PDF? ──────────────────────────────────────────────────┐
        │  Image? ─────────────────────────────────────────┐      │
        │                                                   │      │
        │                                                   ▼      ▼
        │                                          [Client-side] [API Route]
        │                                          canvas/WebGL   /api/parse-pdf
        │                                          image resize   (pdf-to-images)
        │                                                   │      │
        │                                                   └──────┘
        ▼                                                          │
[ApiKeyInput — reads key from localStorage]                        │
        │                                                          │
        ▼                                                          ▼
[SchemaSelector — returns Template or custom Zod schema]    [Base64 image array]
        │                                                          │
        └──────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                  [@docpipe/core extract()] — runs client-side in browser
                                      │
                          ┌───────────┴────────────┐
                          ▼                        ▼
                  [Stage 3: LLM call]        [Error: return stage info]
                  (fetch to Anthropic API
                   directly from browser,
                   using user's API key)
                          │
                          ▼
                  [Stage 4: Zod validation + confidence scoring]
                          │
                     pass? │ fail?
                           │ ──────▶ [retry once with error context in prompt]
                           │
                           ▼
                  [ExtractionResult with field-level confidence]
                           │
                           ▼
                  [ResultsTable component renders]
                           │
                           ▼
                  [Export: JSON / CSV / clipboard]
```

### Core Extraction Flow (CLI)

```
[User: docpipe extract invoice.pdf --template invoice --key $ANTHROPIC_KEY]
        │
        ▼
[Commander parses args, reads file from disk as Buffer]
        │
        ▼
[@docpipe/core extract()] — runs in Node.js process
        │
  [Stage 2 uses Node.js PDF libs — no browser canvas needed]
        │
        ▼
[ExtractionResult]
        │
        ▼
[format.ts converts to JSON or CSV]
        │
        ▼
[stdout or --output file]
```

### Key Data Flows

1. **API key flow:** Key enters via `ApiKeyInput` → stored in `localStorage` → read on each `extract()` call → sent directly in browser fetch to LLM API. Never touches a DocPipe server.
2. **Schema flow:** Template registry or user-supplied Zod schema → serialized to JSON Schema in system prompt → LLM output validated against same Zod schema → output typed by Zod's inferred type.
3. **Error flow:** Any stage failure → `{ success: false, stage, error }` → caller decides whether to retry (Stage 4 validation failure) or surface to UI (all others).
4. **PDF flow (web):** File → Next.js API route → pdf.js renders pages to canvas → `canvas.toDataURL('image/png')` → base64 PNG array → returned to client → passed into `extract()`.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Solo / portfolio | Current design — no server state, BYOK, Vercel free tier handles static + minimal API routes |
| 100-1k users | No changes needed; all LLM load is borne by users' own API keys. Only concern is PDF parsing route latency on Vercel serverless cold starts |
| 1k-100k users | Add server-side LLM proxy if offering managed API keys; PDF parsing scales naturally (stateless route) |
| 100k+ users | Extract PDF parsing to dedicated service; add queue for large documents; consider streaming extraction results via SSE |

### Scaling Priorities

1. **First bottleneck:** Vercel serverless cold start on the PDF parse route (~300-500ms). Fix: increase function memory or move to edge runtime with smaller pdf.js bundle.
2. **Second bottleneck:** LLM latency for large (multi-page) documents. Fix: parallelize per-page LLM calls, stream results back to UI progressively.

## Anti-Patterns

### Anti-Pattern 1: Leaking Pipeline Internals Through the Public API

**What people do:** Export `IngestResult`, `PreprocessResult`, `LLMRawResponse` etc. from `index.ts` so callers can handle each stage themselves.

**Why it's wrong:** This turns the public API into an implementation detail. Every internal refactor becomes a semver-major breaking change. Callers write fragile code that reaches into pipeline internals.

**Do this instead:** Export only `extract()`, `ExtractionInput`, `ExtractionResult`, `LLMProvider` (interface), `Template`, and the built-in templates. Keep all stage types in `pipeline/` and do not re-export them.

### Anti-Pattern 2: Storing API Keys in Core State

**What people do:** Pass the API key once when creating a provider instance (`new AnthropicProvider(apiKey)`) and store it on `this.apiKey`.

**Why it's wrong:** In the web app, the key lives in localStorage and the user might change it mid-session. A provider that stores the key internally requires re-instantiation on every key change, coupling the UI lifecycle to the provider lifecycle.

**Do this instead:** Pass `apiKey` as a call-time parameter to `extractStructured()`. The provider is stateless. The caller always controls which key is used for which call.

### Anti-Pattern 3: Running PDF Parsing Inside Core

**What people do:** Import `pdf-parse` or `pdfjs-dist` directly inside `packages/core` to handle PDF input.

**Why it's wrong:** `pdfjs-dist` has a browser build and a Node build with very different APIs and bundle sizes. Pulling it into core forces all consumers (CLI and web) to deal with this complexity. The CLI doesn't need a canvas polyfill; the web app doesn't need Node native bindings.

**Do this instead:** Core accepts `Base64Image[]` as its canonical input. Each consumer is responsible for PDF-to-images conversion using the right tool for its environment (pdf.js in browser, pdf-to-img or canvas on Node). The API route in the web app handles this boundary.

### Anti-Pattern 4: Prompt and Schema Out of Sync

**What people do:** Define the Zod schema in one file, write the system prompt in another, and update them independently over time.

**Why it's wrong:** The LLM is instructed by the prompt, but the output is validated by the schema. When they drift, validation failures spike with no obvious cause. The schema becomes "aspirational" rather than authoritative.

**Do this instead:** Co-locate schema and system prompt in each template file. The system prompt should be generated from the schema (serialize to JSON Schema, embed in prompt) or at minimum reviewed every time the schema changes.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Anthropic API | Direct fetch from browser (BYOK) or Node via `@anthropic-ai/sdk` | Version-pin the SDK; API breaking changes are rare but costly |
| Vercel (deployment) | Zero-config for Next.js; one route (`/api/parse-pdf`) needs `runtime: 'nodejs'` not edge (canvas dependency) | Free tier: 12s function timeout — large PDFs must be warned about |
| pdf.js (browser) | Load via `pdfjs-dist` in web API route, render pages to canvas | Pin version; pdf.js has had breaking major releases |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `web` → `core` | Direct TypeScript import (`@docpipe/core`) | Turborepo workspace reference; no HTTP, no serialization |
| `cli` → `core` | Direct TypeScript import (`@docpipe/core`) | Same — core is a library, not a service |
| Web component → LLM API | `fetch()` directly from browser Client Component | No proxy; key never touches Next.js server except as transient header |
| Web component → PDF parse route | `fetch('/api/parse-pdf', { body: formData })` | Only boundary crossing HTTP inside the app; returns `{ images: string[] }` |
| Pipeline stages | Function calls with typed Result returns | No events, no shared mutable state |

## Build Order for Implementation

The dependency graph mandates this order:

1. **`packages/core` types and interfaces** — `ExtractionInput`, `ExtractionResult`, `LLMProvider` interface, `Template` type. No implementation yet. This unblocks parallel work on provider and pipeline.

2. **Provider implementation** (`providers/anthropic.ts`) — implements `LLMProvider`, isolated and testable in Node without a full pipeline.

3. **Template definitions** (`templates/invoice.ts`, `templates/receipt.ts`) — pure data (schema + prompt), no external deps. Can be authored alongside provider.

4. **Pipeline stages 2-4** (preprocess, llm, validate) — in this order; each depends on the previous stage's output type. Stage 2 is the hardest (environment-dependent PDF handling); stages 3 and 4 are straightforward once types exist.

5. **Stage 1 + `extract()` orchestrator** — wires stages together, handles retry logic. Build last in core so all stage types are known.

6. **`packages/web`** — consumes `@docpipe/core`. Build after core is functional end-to-end. PDF API route can be built in parallel with core once the `Base64Image[]` interface is locked.

7. **`packages/cli`** — consumes `@docpipe/core`. Lowest-risk, build last. Node-side PDF handling goes here, not in core.

## Sources

- [Vercel AI SDK — Foundations: Providers and Models](https://ai-sdk.dev/docs/foundations/providers-and-models)
- [Vercel AI SDK — Writing a Custom Provider](https://ai-sdk.dev/providers/community-providers/custom-providers)
- [AI SDK 6 Release Notes](https://vercel.com/blog/ai-sdk-6)
- [Turborepo — Structuring a Repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
- [LLMs for Structured Data Extraction from PDFs — Unstract](https://unstract.com/blog/comparing-approaches-for-using-llms-for-structured-data-extraction-from-pdfs/)
- [Confidence Signals — Sensible Blog](https://www.sensible.so/blog/confidence-signals)
- [Building Confidence in LLM Outputs — Alkymi](https://www.alkymi.io/data-science-room/building-confidence-in-llm-outputs)
- [Inferablehq — Zod structured output with retry](https://github.com/inferablehq/ollama-structured-outputs)
- [Pipeline Pattern in TypeScript — DEV Community](https://dev.to/wallacefreitas/the-pipeline-pattern-streamlining-data-processing-in-software-architecture-44hn)
- [Building a PDF Ingestion Pipeline with TypeScript — DEV Community](https://dev.to/steravy/building-a-pdf-ingestion-pipeline-with-typescript-wasp-and-ai-ocr-1lpp)
- [PDF.js — PDF to image in browser](https://usefulangle.com/post/24/pdf-to-jpeg-png-with-pdfjs)
- [Azure SDK TypeScript Design Guidelines](https://azure.github.io/azure-sdk/typescript_design.html)

---
*Architecture research for: DocPipe — document intelligence engine*
*Researched: 2026-03-28*

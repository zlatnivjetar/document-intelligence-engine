# Feature Research

**Domain:** Document intelligence / structured data extraction from unstructured documents
**Researched:** 2026-03-28
**Confidence:** MEDIUM-HIGH (commercial product features verified via multiple sources; open-source ecosystem findings HIGH via direct repo inspection)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| PDF and image input (PNG, JPG) | Every competitor accepts these formats; they're the universal document formats | LOW | PDF parsing may need server-side help (pdf-parse, pdfjs-dist); images go direct to vision API |
| Structured JSON output | All extraction tools return structured data, not raw OCR text | LOW | Core of DocPipe's value; Zod schema drives the shape |
| Per-field confidence scores | Industry standard — every serious tool (Textract, Document AI, Nanonets, Rossum) scores each extracted field | MEDIUM | Must accompany every extracted value, not just overall document confidence |
| Schema-driven extraction (define what you want) | Modern IDP tools (Extend, LandingAI, Google Document AI Custom Extractor) all moved to schema-first approach; template-only systems feel rigid | MEDIUM | Zod as the schema language is differentiating; field names, types, and descriptions matter for LLM prompt quality |
| Built-in templates for common document types | Invoice and receipt templates expected by any tool marketing itself as document extraction | LOW-MEDIUM | Invoice fields: vendor name, invoice number, date, line items, subtotal, tax, total. Receipt fields: merchant, date, items, total |
| Export as JSON | Standard output format for any developer-facing tool | LOW | Trivially implemented once extraction works |
| Export as CSV | Expected by non-developer users who want to paste data into spreadsheets | LOW | Flat CSV for single-record docs; line items as separate rows |
| Drag-and-drop upload UI | Standard document upload UX since 2020 | LOW | Drop zone with visual feedback, file type validation, size limit indication |
| API key input (BYOK model) | Any tool that uses an LLM provider and targets developers has moved to BYOK; users distrust "we hold your key" for sensitive documents | LOW | Store in localStorage/sessionStorage only; never transmit to server |
| Live extraction preview | Users expect to see results immediately after upload — polling UX is not acceptable | MEDIUM | Show spinner during extraction; display results in-page without page reload |
| Results table with field-level confidence indicators | Visual confidence display (color coding, icons, percentage) is standard in Docsumo, Rossum, Nanonets UIs | MEDIUM | Low-confidence fields should be visually distinct (amber/red) vs high-confidence (green) |
| Error states and failure messages | Users need to know when extraction fails and why (bad API key, unparseable document, model refused) | LOW | Clear error copy, not stack traces |
| Copy to clipboard | One-click copy of JSON output is expected in any developer tool | LOW | Single button, instant feedback (toast/checkmark) |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Zod schema as the extraction contract | No other open-source tool uses Zod for schema-driven LLM extraction — bridges TypeScript type safety with LLM output validation | MEDIUM | Schemas are TypeScript-native, auto-infer return types, provide runtime validation. Schema description fields become LLM prompt hints |
| Schema validation + automatic retry | When LLM output fails Zod validation, retry automatically (configurable max retries) with error fed back to model | MEDIUM | Competitors handle this with proprietary retry logic; DocPipe makes it explicit and user-controlled |
| Open-source core npm package | Commercial tools (Mindee, Nanonets, Textract) lock you into their infrastructure. No open-source TypeScript-first library exists that does schema-driven vision extraction with confidence scores | HIGH | This is the portfolio differentiator — a real, publishable library |
| Provider abstraction layer | Single provider in v1 but clean interface means community can add providers (Gemini, Mistral, local models) | MEDIUM | Interface-first design: `ExtractionProvider { extract(document, schema): Promise<ExtractionResult> }` |
| Privacy-first client-side processing | Document never touches DocPipe's servers — goes browser → user's LLM API directly. Strong selling point for legal, medical, financial docs | LOW-MEDIUM | Positioning + architecture choice, not heavy engineering. Client-side PDF-to-image conversion needed |
| Field-level validation with Zod refinements | Users can add custom validation (e.g., "invoice total must be >= 0") that runs on top of schema type checking | MEDIUM | Competitor tools validate format (is this a date?); Zod refinements validate business rules too |
| CLI with stdin/stdout piping | Developer-first CLI that integrates into shell pipelines (`cat invoice.pdf \| docpipe extract --template invoice > data.json`) | MEDIUM | No commercial tool offers a local CLI — they're all cloud APIs. Demonstrates library design quality |
| Monorepo as living documentation | Web app, CLI, and library all in one repo — any developer can read the web app code to understand the library | LOW | Architecture choice that reads as intentional for portfolio purposes |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Server-side document storage | "Let me re-process this later" / "Show me my history" | Requires auth, database, storage bucket, GDPR compliance, retention policies, deletion workflows — all out of scope. Introduces server costs. Fundamentally conflicts with privacy-first positioning | Client-side: browser localStorage for recent results; tell users to save their JSON output |
| OAuth / user accounts | "Remember my API key" / "Share results with team" | Auth system complexity, session management, email verification flows — weeks of work that don't demonstrate document extraction skill. Not needed for BYOK model | API key in localStorage is sufficient; users manage their own key |
| Batch processing (multiple documents) | "Process all my invoices at once" | Adds substantial complexity: progress tracking per file, partial failure handling, consolidated export, queue management, rate limiting. Masks the single-doc UX quality | Ship v1 batch-free, let users script the CLI with shell loops if needed; web batch is v2 |
| Human-in-the-loop review queue | "Flag low-confidence fields for my team" | Full review workflow requires auth, assignment, commenting, audit trail — a product category of its own (Rossum's entire value prop). Overkill for a BYOK extraction tool | Surface confidence scores visually; let users decide whether to act on low-confidence results |
| Training / fine-tuning on user data | "Improve accuracy by learning from corrections" | Requires model training infrastructure, labeled data pipeline, version management — this is Nanonets' core product. LLM-based approach doesn't need retraining; prompt engineering does the job | Better prompts, better schema descriptions, template-specific prompt tuning |
| Real-time webhooks / push notifications | "Notify my system when extraction completes" | Async server infrastructure, webhook delivery guarantees, retry on failure — adds a backend layer for a tool that works client-side | Synchronous API with promise-based response is sufficient at v1 scale |
| Multi-language UI | "Our team uses French/German/Japanese" | i18n adds surface area to every UI component, ongoing maintenance, translation tooling. Extraction itself is language-agnostic (LLM handles multilingual docs) | English-only UI; extraction supports any document language the underlying model supports |
| Document classification (auto-detect type) | "I shouldn't have to tell it what kind of document this is" | Auto-classification requires a separate ML step or LLM call before extraction; adds latency, cost, and a new failure mode. Accuracy at v1 scale is unreliable | Require template selection — it's a one-click UX step, not a burden; keeps the pipeline simple and debuggable |

---

## Feature Dependencies

```
[Document Input]
    └──requires──> [PDF-to-image conversion] (before vision API call)
                       └──requires──> [pdfjs or similar] (browser or server)

[Schema-driven extraction]
    └──requires──> [Zod schema definition]
                       └──requires──> [Template system OR custom schema input]

[Confidence scores]
    └──requires──> [LLM extraction output parsing]
                       └──enhances──> [Results table display]
                       └──enhances──> [Field-level confidence indicators]

[Schema validation + retry]
    └──requires──> [Schema-driven extraction]
    └──requires──> [LLM provider abstraction]

[Export as CSV]
    └──requires──> [Structured JSON output]

[CLI]
    └──requires──> [Core npm library] (CLI is a thin wrapper over core)

[Web app results display]
    └──requires──> [Core extraction engine]
    └──requires──> [Structured JSON output]
    └──enhances──> [Copy to clipboard]
    └──enhances──> [Export as JSON]
    └──enhances──> [Export as CSV]

[Provider abstraction]
    └──requires──> [Single provider working end-to-end] (prove the interface first)
    └──enables──> [Future provider additions] (v2+)
```

### Dependency Notes

- **PDF-to-image conversion requires a decision on client vs. server boundary:** `pdfjs-dist` runs in-browser but is large (~3MB). `pdf-parse` is server-side only. The decision here affects the entire architecture. Recommend: try client-side first with pdfjs-dist; fall back to Next.js API route if needed.
- **Schema validation + retry requires the provider abstraction to be clean:** Retry logic lives in the core engine and calls the provider interface again — the provider must be stateless per-call.
- **CSV export requires knowing the document structure:** Flat key-value docs (receipts, most invoices) map cleanly to CSV. Line items need a separate rows strategy. Design this into the export layer, not as an afterthought.
- **CLI requires core library to be a clean npm package first:** Do not build the CLI until the library API is stable; otherwise CLI becomes a maintenance burden when the API changes.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed for "someone can upload an invoice, get structured JSON/CSV back."

- [ ] PDF + PNG + JPG input via drag-and-drop
- [ ] Invoice template (10 fields: vendor name, vendor address, invoice number, invoice date, due date, line items array, subtotal, tax amount, tax rate, total amount)
- [ ] Receipt template (7 fields: merchant name, merchant address, transaction date, line items array, subtotal, tax, total)
- [ ] One additional template (W-2 form OR bank statement — W-2 is more universally recognizable for portfolio demo purposes)
- [ ] Schema-driven extraction via Zod with automatic retry on validation failure (max 2 retries)
- [ ] Per-field confidence scores (0-1 scale) returned with every extraction
- [ ] Results table with confidence color coding (green >= 0.85, amber 0.60-0.84, red < 0.60)
- [ ] Export as JSON (download file)
- [ ] Export as CSV (download file)
- [ ] Copy JSON to clipboard
- [ ] BYOK: API key input stored in localStorage, never sent to DocPipe server
- [ ] Core library publishable as `docpipe-core` npm package with documented API
- [ ] CLI: `docpipe extract <file> --template <name> --key <api-key>` producing JSON to stdout
- [ ] Error states: bad API key, unsupported file type, extraction failure, validation failure after retries

### Add After Validation (v1.x)

Features to add once core is working and the library is public.

- [ ] Custom Zod schema input in web app (schema editor or JSON schema upload) — trigger: users ask "can I extract custom fields?"
- [ ] Third template (whichever of W-2/bank statement wasn't shipped in v1) — trigger: easy addition once template system is proven
- [ ] CLI: `--schema <file>` flag for custom Zod schema from file — trigger: developer feedback
- [ ] Extraction history in localStorage (last 5 results) — trigger: users ask "can I see my previous results?"

### Future Consideration (v2+)

Features to defer until after the portfolio goal is achieved.

- [ ] Batch processing — defer: adds queue/progress complexity, conflicts with privacy-first single-doc flow
- [ ] Second LLM provider (Gemini or OpenAI depending on v1 choice) — defer: prove the abstraction works, then add a provider to demonstrate it
- [ ] Human-in-the-loop review annotation — defer: separate product category
- [ ] Webhook / async delivery mode — defer: not needed for BYOK client-side model
- [ ] OAuth and user accounts — defer: BYOK eliminates the need

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| PDF + image input | HIGH | MEDIUM (PDF conversion non-trivial) | P1 |
| Invoice template | HIGH | MEDIUM | P1 |
| Receipt template | HIGH | LOW (simpler than invoice) | P1 |
| Schema-driven extraction with Zod | HIGH | MEDIUM | P1 |
| Per-field confidence scores | HIGH | MEDIUM | P1 |
| Validation + retry loop | HIGH | LOW-MEDIUM | P1 |
| Results table with confidence indicators | HIGH | MEDIUM | P1 |
| Export JSON + CSV | HIGH | LOW | P1 |
| Copy to clipboard | MEDIUM | LOW | P1 |
| BYOK API key storage | HIGH | LOW | P1 |
| Core npm package (publishable) | HIGH (portfolio) | MEDIUM (API design) | P1 |
| CLI basic extraction | MEDIUM | LOW (thin wrapper) | P1 |
| Third template (W-2 or bank statement) | MEDIUM | LOW | P2 |
| Custom schema in web app | MEDIUM | MEDIUM | P2 |
| CLI custom schema flag | MEDIUM | LOW | P2 |
| Extraction history (localStorage) | LOW | LOW | P2 |
| Second LLM provider | MEDIUM | MEDIUM | P3 |
| Batch processing | LOW (v1) | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Nanonets / Docsumo / Rossum (SaaS) | AWS Textract / Google Document AI (Cloud APIs) | DocPipe (Our Approach) |
|---------|--------------------------------------|------------------------------------------------|------------------------|
| Document input | Web upload, API, email | API call with file/URL | Web drag-drop + CLI + npm library |
| Extraction engine | Proprietary ML models + LLM | Proprietary ML models + OCR | Vision LLM (BYOK) with Zod validation |
| Output format | JSON, CSV, webhooks, ERP integrations | JSON with bounding boxes + confidence | JSON with per-field confidence scores |
| Confidence scoring | Per-field, 0-1 scale | Per-field, 0-1 scale | Per-field, 0-1 scale (matched) |
| Schema / template system | GUI-based template builder, 25-300+ pretrained models | Pretrained processors + Custom Document Extractor | Zod schemas (code-first) + 3 built-in templates |
| Custom extraction fields | Yes (GUI drag-zone or prompt) | Yes (Custom Document Extractor) | Yes (custom Zod schema) |
| Retry / validation | Internal, opaque | Internal, opaque | Explicit Zod validation + configurable retry |
| Export | JSON, CSV, Excel, webhooks, ERP push | JSON (raw), integrates with S3/Lambda | JSON download, CSV download, clipboard |
| Privacy | Documents processed on vendor servers | Documents sent to AWS/Google | Documents never leave user's browser (client-side first) |
| Pricing | SaaS subscription ($500-$3000+/month) | Pay-per-page ($0.0015-$0.065/page) | Free (BYOK — user pays their own LLM costs) |
| Self-hosting | No | No (cloud-locked) | Yes (npm package, run anywhere) |
| Human review workflow | Yes (core product feature) | Via A2I / Document AI Workbench | Not in v1 (anti-feature) |
| Batch processing | Yes | Yes (async mode) | Not in v1 (deferred) |
| CLI tool | No | No | Yes (functional v1) |
| Open source | No | No | Yes (core library + web app) |
| TypeScript-native types | No (REST API, any types) | Partial (SDK typings) | Yes (Zod schema infers TypeScript types) |

---

## Sources

- [Top 8 Document Extraction Tools in 2026](https://parsio.io/blog/top-document-extraction-tools/) — feature breakdown across 8 commercial tools
- [AWS Textract vs Google Document AI: OCR Comparison 2026](https://www.braincuber.com/blog/aws-textract-vs-google-document-ai-ocr-comparison) — cloud API features and accuracy benchmarks
- [Google Document AI vs. AWS Textract (Mixpeek)](https://mixpeek.com/comparisons/google-document-ai-vs-aws-textract) — detailed feature comparison including confidence scoring
- [Best Confidence Scoring Systems January 2026 | Extend](https://www.extend.ai/resources/best-confidence-scoring-systems-document-processing) — confidence scoring best practices and threshold recommendations
- [Extraction Schema Best Practices | LandingAI](https://landing.ai/developers/extraction-schema-best-practices-get-clean-structured-data-from-your-documents) — schema design for document intelligence
- [Best Vision Language Models for Document Data Extraction | Nanonets](https://nanonets.com/blog/vision-language-model-vlm-for-data-extraction/) — VLM capabilities, pitfalls (hallucination, prompt sensitivity), must-have features
- [No-Template Document Extraction with Custom Schema Support | Unstract](https://unstract.com/blog/ai-document-processing-no-manual-templates-custom-schema-support/) — custom schema-driven extraction patterns
- [How to Automate Invoice Data Extraction with AI | Cradl AI](https://www.cradl.ai/posts/invoice-data-extraction-with-ai) — invoice field standards, confidence thresholds, STP rates
- [Structured Outputs: Schema-Validated Data Extraction from LLMs | Michael Brenndoerfer](https://mbrenndoerfer.com/writing/structured-outputs-schema-validated-data-extraction-language-models) — Zod + LLM validation patterns
- [Best Document Processing APIs in 2025 | Eden AI](https://www.edenai.co/post/best-document-processing-apis) — API feature comparison across commercial services
- [Best document extraction APIs for developers in 2026 | Lido](https://www.lido.app/blog/best-document-extraction-apis-for-developers) — developer-focused API features, SDK quality, export options
- [Document Processing Platform Guide 2025 | V7 Labs](https://www.v7labs.com/blog/document-processing-platform) — tier-based feature breakdown from raw building blocks to end-to-end platforms
- [llm-document-ocr npm package | GitHub/mercoa-finance](https://github.com/mercoa-finance/llm-document-ocr) — existing open-source TypeScript LLM OCR library (nearest competitor in npm space)

---
*Feature research for: document intelligence / structured data extraction*
*Researched: 2026-03-28*

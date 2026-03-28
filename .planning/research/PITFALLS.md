# Pitfalls Research

**Domain:** Document intelligence engine — LLM-powered structured data extraction from PDFs and images
**Researched:** 2026-03-28
**Confidence:** HIGH (most pitfalls verified across multiple sources; confidence scoring section is MEDIUM due to LLM calibration being an open research problem)

---

## Critical Pitfalls

### Pitfall 1: LLM Self-Reported Confidence Scores Are Uncalibrated

**What goes wrong:**
The extraction engine asks the LLM to return a confidence score alongside each extracted field (e.g., `{"value": "123.45", "confidence": 0.95}`). The scores look reasonable but are systematically overconfident — LLMs "tend to assign consistently high confidence scores, often above 0.9, to their own generated outputs." A hallucinated total amount on an invoice receives 0.92 confidence. Users see a green indicator and trust it. The field is wrong.

**Why it happens:**
LLMs learn to produce what "sounds right." When asked to self-assess, they draw on the same learned pattern-matching that can hallucinate values in the first place. There is no ground-truth signal available to the model at inference time to anchor calibration.

**How to avoid:**
Use confidence as a relative signal, not an absolute one. Design the UI to show confidence as a flag for human review ("verify this field") rather than a trust certificate. Document in the library API that confidence scores are heuristic and may not correlate with accuracy. Consider a secondary validation step: format-check known field types (dates match ISO pattern, amounts are numeric, tax IDs match regex) and downgrade confidence for fields that fail format checks even if the LLM was confident.

**Warning signs:**
- All extracted fields return confidence > 0.85 consistently, even on low-quality scanned documents
- Users report "confident but wrong" results on visually degraded inputs
- Confidence does not vary between clean digital PDFs and blurry scans

**Phase to address:**
Core extraction engine phase. Define the confidence contract in the API before templates are built so downstream consumers are not built on false assumptions. Add explicit documentation: "confidence is heuristic."

---

### Pitfall 2: Hallucinated Values That Are Plausible

**What goes wrong:**
Unlike OCR errors (garbled characters, obvious noise), LLM hallucinations produce plausible-looking values. An invoice total of $1,234.56 becomes $1,243.56. A vendor name "Acme Corp" becomes "Acme Corporation." A date "03/15/2024" becomes "03/14/2024." These pass Zod validation (correct type, correct format) and pass visual inspection unless the user carefully cross-references the original. For portfolio demo purposes this is fatal — a hiring manager uploading their own invoice and finding a wrong number destroys trust immediately.

**Why it happens:**
LLMs are trained to generate plausible completions. When a table cell is partially obscured or a number is ambiguous in a scanned document, the model "fills in" what seems likely rather than returning null or low confidence. The model is satisfying the prompt, not reading the document.

**How to avoid:**
1. Prompt engineering: Instruct the model explicitly — "If you cannot read a value with certainty, return null for that field. Do not guess." Include this in the system prompt.
2. Require the model to cite the source text verbatim for critical numeric fields alongside the extracted value (a "grounding" pattern). This is not always achievable with structured output APIs but serves as a prompt-level guard.
3. For the demo templates (invoice, receipt), target clean digital PDFs as the happy path. Document that low-quality scans reduce reliability. Do not demo with blurry inputs.
4. Test extractions against known-answer documents (a fixture set) during development and catch regressions.

**Warning signs:**
- Numeric fields differ from source by small amounts (transposition, off-by-one)
- Extracted dates cluster around the current date rather than the document date
- Line item counts differ from visible rows in the source document

**Phase to address:**
Extraction engine phase (prompt engineering) and template phase (fixture-based testing with known-answer documents for each template).

---

### Pitfall 3: PDF Parsing Is Not a Single Problem

**What goes wrong:**
"Parse a PDF" means different things for different document types. Digital PDFs (text layer embedded) can be text-extracted cheaply. Scanned PDFs (image-only) need the pages rendered as images and sent to vision APIs. Password-protected PDFs need unlocking. PDFs with complex mixed layouts (text + embedded images + tables spanning columns) fail both approaches partially. Treating "PDF" as a uniform input type leads to a single code path that works for one subtype and silently degrades for others.

**Why it happens:**
Developers test with one PDF type (usually clean digital) during development and discover the fragmentation only when users upload real-world documents: scanned receipts from a phone camera, invoices exported from accounting software, contracts with embedded signatures, etc.

**How to avoid:**
Implement a routing layer: detect whether a PDF has a text layer (check extracted text character count per page); if yes, extract text and pass as context. If no usable text layer, render pages as images and use vision APIs. Document this distinction clearly in the library API. For DocPipe's scope (single document, portfolio demo), explicitly target the two common cases: digital PDFs and image-based PDFs/scanned documents. Test both in fixture sets.

**Warning signs:**
- Extraction works perfectly on test documents but fails on user-uploaded files
- Extracted text from a PDF is an empty string despite the document having visible content
- All PDFs are being sent to the vision endpoint even when they have extractable text (wasteful and expensive for users' API keys)

**Phase to address:**
Core extraction engine phase. The PDF parsing router should be one of the first components built — it determines the entire input pipeline.

---

### Pitfall 4: Client-Side PDF Processing Has Hard Browser Compatibility Limits

**What goes wrong:**
The architecture calls for client-side processing where possible. PDF.js (the standard browser PDF library) can extract text and render pages, but: (1) it only supports basic AcroForm fields with no XFA forms; (2) advanced in-browser LLM inference via WebGPU is not enabled by default in Safari or Firefox and requires manual feature flags; (3) large PDFs or complex layouts block the UI thread; (4) the JavaScript PDF ecosystem is significantly weaker than Python's tooling. Users on Safari (desktop or mobile) with complex PDFs will get degraded or broken results.

**Why it happens:**
Developers build and test in Chrome, which has the most complete WebAPIs. Safari and Firefox gaps are discovered late when users report failures.

**How to avoid:**
For DocPipe: accept that PDF-to-image rendering for vision models cannot be done purely client-side reliably across all browsers today. Use a Next.js API route as the PDF processing server (renders PDF pages to images server-side, returns image data to the client for LLM submission). This is explicitly permitted by the project brief ("API routes are acceptable for things that are hard in-browser"). The LLM call itself can remain client-side with the user's key. Keep the PDF processing in an API route so it can move to a different runtime if needed.

**Warning signs:**
- PDF rendering works in Chrome but produces blank images in Safari
- Large PDFs (>5 pages) freeze the browser tab
- Canvas rendering produces low-DPI images that degrade LLM extraction quality

**Phase to address:**
Web app phase, during the document upload and preprocessing step. Make the architecture decision (client vs. API route for PDF rendering) explicit before building the upload flow.

---

### Pitfall 5: API Key Stored in localStorage Is Exposed to XSS

**What goes wrong:**
The project brief specifies "API key stored in browser only" for the BYOK model. The natural implementation is `localStorage.setItem('apiKey', key)`. Any XSS vulnerability in the application — including injected content from user-uploaded document metadata, a compromised third-party script, or a future dependency — can read `localStorage` and exfiltrate the user's OpenAI or Anthropic key. The key is then usable by attackers for their own API calls at the user's expense.

**Why it happens:**
localStorage is the obvious persistence mechanism. Developers correctly avoid server-side key storage but don't implement defense-in-depth on the client side. The risk feels theoretical for a portfolio project until a dependency vulnerability is reported.

**How to avoid:**
1. Use `sessionStorage` over `localStorage` for the API key — it is cleared when the tab closes, reducing the window of exposure.
2. Never log the key to the console, include it in error messages, or serialize it to any structured storage format alongside other data.
3. Apply a strict Content-Security-Policy header to prevent injected scripts from running.
4. Display a clear warning in the UI: "Your API key is stored only in this browser session. It is never sent to our servers. Clear it when using shared computers."
5. Document the security model clearly in the README — hiring managers and security-conscious developers will look for this.

Note: Anthropic now requires `anthropic-dangerous-direct-browser-access: true` as an explicit header when calling their API directly from browsers. This is intentionally named to signal the risk — use it, but be clear about the tradeoff in documentation.

**Warning signs:**
- API key persists after browser restart (means localStorage was used instead of sessionStorage)
- Key appears in browser devtools Network tab in plain text in non-Authorization headers
- No CSP headers configured on the Next.js app

**Phase to address:**
Web app phase, specifically the API key input component and Next.js security headers configuration. CSP should be configured before any user-facing features are shipped.

---

### Pitfall 6: Schema Validation Passes But Extraction Is Still Wrong (Shape vs. Truth)

**What goes wrong:**
Zod validates that the extracted JSON matches the expected shape: `invoiceTotal` is a number, `issueDate` is a string matching ISO 8601, `lineItems` is an array of objects with the right keys. Zod passes. But `invoiceTotal` is 0 (the LLM returned a default when it couldn't read the value), `issueDate` is today's date (the LLM guessed when the field was blank), and `lineItems` has two entries instead of four (the LLM collapsed rows). Zod cannot validate semantic correctness — only structural correctness.

**Why it happens:**
Schema validation is treated as the reliability guarantee rather than as a type-safety layer. Developers conflate "validates against schema" with "extraction succeeded."

**How to avoid:**
Add a second layer of business rule validation beyond Zod:
- Required fields that return null or empty string should be flagged (not just type-checked)
- Numeric totals that are 0 should be flagged as suspicious (invoices rarely have a $0 total)
- Line item subtotals that do not sum to the total within a tolerance should be flagged
- Dates that are in the future relative to today should be flagged for invoice/receipt templates
These checks produce "warning" flags rather than validation failures — the data is returned with a warning attached. This is the differentiating reliability feature of DocPipe versus naive extraction.

**Warning signs:**
- Zero values appear in numeric fields for poor-quality inputs
- Extracted dates are clustered around today's date
- Line item arrays are shorter than expected based on visual inspection of the document
- Zod passes but users report incorrect data

**Phase to address:**
Template implementation phase. Each template should define its own business rule validators alongside its Zod schema. This is part of what makes a "polished template" versus a bare schema.

---

### Pitfall 7: Retry Logic That Hammers the API

**What goes wrong:**
When the LLM returns malformed JSON or a response that fails Zod validation, the code retries immediately. If the document is genuinely ambiguous or the prompt is flawed, every retry fails, producing three or more API calls in rapid succession. For a BYOK model, this burns the user's API credits on a document that was never going to succeed. At worst, a bug in a template schema causes every extraction to retry three times, tripling API costs for every document.

**Why it happens:**
Retry logic is added as a reliability improvement but implemented without a retry budget or backoff strategy. The assumption is "it'll work eventually" rather than "retries have diminishing returns for deterministic failure modes."

**How to avoid:**
1. Limit retries to 2 (one initial attempt, one retry). Most LLM transient failures resolve in one retry; more rarely help.
2. Before retrying, check whether the failure was a Zod validation error (structural) vs. a JSON parse error (formatting). For Zod failures, modify the retry prompt to include the validation error message so the model can self-correct. For JSON parse errors, retry with an explicit "return only valid JSON" instruction.
3. Expose retry count and failure reason in the result object so the UI can show "Extraction required 2 attempts" as a diagnostic signal.
4. Never retry on HTTP 429 (rate limit) or 401 (auth failure) — these will not resolve with retries.

**Warning signs:**
- API call count in network tab is 3x the number of documents processed
- Rate limit errors appearing despite low document volumes
- Users reporting higher-than-expected API credit consumption

**Phase to address:**
Core extraction engine phase. Retry logic should be designed with the extraction loop, not added as an afterthought.

---

### Pitfall 8: Vercel Free Tier Function Timeout on Large Documents

**What goes wrong:**
The Next.js API route used for PDF processing (or as a proxy for LLM calls) times out on Vercel's free tier. Vercel Hobby limits serverless function duration to 60 seconds. A multi-page PDF requiring several image conversions and a vision LLM call with a large response can easily exceed this. The request fails with a 504 after the user has already waited 45 seconds, with no partial result.

**Why it happens:**
Local development has no timeout. The app works perfectly in `npm run dev` and breaks only on Vercel. The problem is discovered after deployment.

**How to avoid:**
1. For DocPipe's scope (single document, 2-3 page invoices/receipts), most extractions should complete well within 30 seconds. Test on Vercel early — deploy a staging version in the web app phase before the full feature set is built.
2. Move heavy PDF processing to the client side where possible (use PDF.js to extract page images in the browser, send images to LLM client-side with the user's key). This removes the timeout risk entirely for the primary flow.
3. If API routes are needed, set explicit `maxDuration` in the route config and test against the Hobby limit.
4. For the portfolio demo, limit to single-page or two-page documents as the supported use case. Multi-page batch processing is already out of scope for v1.

**Warning signs:**
- Vercel function logs show durations approaching 50-60 seconds
- Users report the spinner running forever then a generic error
- Works fine locally but times out in production

**Phase to address:**
Web app deployment phase. Test on Vercel before declaring the web app feature complete.

---

### Pitfall 9: Monorepo Dependency Isolation Breaks npm Package Consumers

**What goes wrong:**
The `@docpipe/core` package is developed inside a Turborepo monorepo where its dependencies (Zod, the LLM SDK) are hoisted to the root `node_modules`. The package works in the monorepo. It is published to npm. A consumer installs it and gets errors because the package's `package.json` is missing peer dependency declarations, or the bundled output has incorrect import paths, or the TypeScript declarations reference monorepo-internal types not included in the published package.

**Why it happens:**
Monorepo hoisting masks missing `package.json` declarations — the package resolves its dependencies from the root without explicitly declaring them. This works inside the repo but breaks for external consumers who install only the package.

**How to avoid:**
1. Use Turborepo's "Just-in-Time" package strategy for the core library: set `"exports"` and `"types"` fields explicitly in `package.json`.
2. Declare all runtime dependencies explicitly in the package's own `package.json`, not just at the monorepo root.
3. Test the published package by installing it in a separate project outside the monorepo before any release. This is the definitive test.
4. Use Changesets for versioning to avoid accidental breaking changes.
5. Exclude test files, fixture documents, and internal types from the published package using the `"files"` field in `package.json`.

**Warning signs:**
- `Cannot find module 'zod'` errors when installing the package externally
- TypeScript types show `any` for parameters that should be typed
- The published package size includes test fixtures or source maps not needed by consumers

**Phase to address:**
Core library phase. Set up the publish pipeline and do one test publish before building the full feature set.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode one LLM provider without abstraction layer | Ship faster | Every provider addition requires touching extraction core | Never — the abstraction is the whole point for portfolio value |
| Prompt strings inline in extraction function | Simple to write | Cannot test prompts independently, impossible to iterate on templates without code changes | Never — extract prompts to template definitions from day one |
| Skip fixture-based testing for extraction | Faster initial dev | Regressions invisible; no way to verify a prompt change improved or degraded extraction | Only acceptable for initial scaffolding — add fixtures before any template is marked "done" |
| Use `localStorage` for API key | Simpler persistence | Key persists across sessions, XSS window is permanent | Never — use `sessionStorage` |
| Return raw LLM JSON without Zod validation | One fewer layer | Type safety is fiction; consumers get runtime surprises | Never — Zod validation is the library's core promise |
| Skip Vercel deployment until app is "done" | More time to build | Timeout bugs, bundle size issues, and env var problems discovered at the end | Never — deploy to Vercel in the first web app phase iteration |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Anthropic SDK (browser) | Calling `new Anthropic()` without the `dangerouslyAllowBrowser: true` flag | Pass `dangerouslyAllowBrowser: true` and the `anthropic-dangerous-direct-browser-access: true` header; document the security model |
| OpenAI SDK (browser) | Same — browser usage requires `dangerouslyAllowBrowser: true` | Same pattern as Anthropic |
| PDF.js | Importing the library without pointing to the worker file URL | Explicitly configure `pdfjsLib.GlobalWorkerOptions.workerSrc` to the correct worker URL for your bundler |
| PDF.js + Next.js | ESM/CJS conflict in App Router | Use `pdfjs-dist/legacy/build/pdf` or configure the Next.js `transpilePackages` option |
| Zod + LLM structured output | Using deeply nested Zod schemas with `.optional()` everywhere | LLMs handle flat schemas more reliably than deeply nested optional chains; use explicit `z.nullable()` over `.optional()` for fields that may be absent |
| Turborepo + npm publish | Running `npm publish` from the root | Always publish from the package directory; workspace symlinks break publish from root |
| Vercel + API routes | Not setting `export const maxDuration` in route files | Set explicit max duration to avoid silent truncation at the platform default |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sending full multi-page PDF as one vision request | Correct on small docs, fails on large ones; high token cost | Route to page-by-page extraction when page count > 2; merge results | Any PDF over 3 pages with current vision model context limits |
| Converting PDF pages at 72 DPI for vision input | LLM struggles to read small text, numbers misread | Use 150-200 DPI minimum for rasterization; test at 72 vs 150 DPI with real invoice fixtures | Immediately visible on any document with text smaller than 10pt |
| Synchronous PDF processing on the main thread | UI freezes during document preparation | Use Web Workers for PDF.js processing in the browser | Any PDF over 1 MB on mid-range hardware |
| Fetching the PDF.js worker from a CDN at runtime | Works in dev, fails if CDN is down or CSP blocks external scripts | Bundle the worker with the app or serve from the same origin | CDN outage or CSP header deployment |
| Zod parsing inside a hot loop | Negligible at 1 document; accumulates in retry loops | Precompile Zod schemas (call `.parse()` on a cached schema object, not re-defining the schema on every call) | Only matters at scale — acceptable for DocPipe v1 |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging the user's API key in server-side logs (e.g., in API route error handling) | Key persists in Vercel log drain, accessible to anyone with log access | Scrub API keys from all log statements; never include Authorization header values in structured logs |
| Echoing the user's API key in client-side error messages | Key appears in UI, screen recordings, screenshots shared for support | Never include the key in error messages; show "Invalid API key" not the key value |
| No Content-Security-Policy header | XSS can exfiltrate localStorage/sessionStorage API keys | Set `Content-Security-Policy` in `next.config.js` headers; at minimum block `unsafe-inline` scripts |
| Trusting user-supplied filenames without sanitization | Path traversal or XSS via crafted filename displayed in the UI | Sanitize filenames before displaying; use a UUID-based internal reference for processing |
| Embedding the LLM API key in the Next.js server bundle | Key ships to every browser that loads the app | Never use `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` env vars client-side; use `NEXT_PUBLIC_` prefix only for truly public config |
| Forwarding entire user documents to a server-side API route for logging/debugging | Violates privacy-first positioning; document contents stored server-side unexpectedly | API routes should process and discard document data; never persist document content server-side, even in logs |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Generic spinner with no status updates during extraction | Users abandon after 10-15 seconds with no feedback; can't tell if it's working | Show granular steps: "Reading document..." → "Extracting fields..." → "Validating..." with elapsed time |
| Showing all extracted fields as equally confident | Users don't know which fields to verify; the confidence feature has no UX value | Use visual differentiation (color, icon) between high/medium/low confidence fields; make low-confidence fields visually prominent |
| No preview of the uploaded document alongside results | Users cannot visually cross-reference extracted values against source | Show document thumbnail or rendered first page alongside the results table |
| Silent failure on unsupported document types | User uploads a Word doc or HEIC image, gets no response or a cryptic error | Validate file type and size before processing; show specific error: "Supported formats: PDF, PNG, JPG, JPEG" |
| Export button that always succeeds even on partial extraction | User exports a CSV with null values, uses it downstream, discovers errors later | Warn before export if any required fields are null or low-confidence; offer "export anyway" as an explicit choice |
| API key input with no validation feedback | User pastes key with trailing whitespace, gets auth errors that look like a bug | Trim the key on input; test the key with a minimal API call before accepting it; show "API key verified" or "API key invalid" |
| Template selection that obscures what data will be extracted | Non-technical users don't know what "invoice" template extracts | Show a preview of the output fields for each template before the user commits to it |

---

## "Looks Done But Isn't" Checklist

- [ ] **LLM extraction:** Handles the case where a required field is genuinely absent from the document — verify null is returned (not a hallucinated value) and the UI flags it
- [ ] **Zod validation:** Verify schema rejects plausible but wrong types (e.g., a number field receiving a numeric string `"123"` rather than `123`) — LLMs frequently return numbers as strings
- [ ] **Confidence scores:** Verify confidence is lower for a blurry scan than for a clean digital PDF — if they're the same, the signal is not meaningful
- [ ] **Retry logic:** Verify retries do not fire on 401/429 HTTP errors — authenticate these before building retry paths
- [ ] **PDF parsing:** Test with a scanned PDF (image-only, no text layer) — verify the image path is taken and extraction still works, not an empty result
- [ ] **API key:** Verify the key is not present in any server-side logs, not in any error message, and is cleared from sessionStorage when the session ends
- [ ] **npm package:** Install `@docpipe/core` in a fresh project outside the monorepo — verify types resolve, imports work, and no `node_modules` from the monorepo are required
- [ ] **Vercel deployment:** Time a full extraction flow end-to-end on the deployed Vercel app (not localhost) — verify it completes within 45 seconds on a realistic 2-page invoice PDF
- [ ] **Template business rules:** For the invoice template, verify that a known-bad document (wrong totals, future date) triggers warning flags rather than silent confident extraction
- [ ] **Export:** Download the CSV export and open it in Excel — verify numbers are numbers (not text), dates are dates (not strings), and special characters in vendor names do not break CSV parsing

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Confidence scores built as UX-primary feature, then found unreliable | HIGH | Redesign confidence UX from "trust signal" to "review flag"; rewrite documentation; user expectation reset |
| localStorage used for API keys throughout app | MEDIUM | Replace with sessionStorage; add CSP headers; audit all key-reading code; notify users to re-enter keys |
| PDF parsing built as pure client-side, then found Safari-broken | MEDIUM | Extract PDF rendering into API route; update architecture; re-test cross-browser |
| Core library published without proper `package.json` declarations | MEDIUM | Publish a patch release with corrected `exports`, `types`, `dependencies`; deprecate broken version |
| Retry logic discovered to triple API calls | LOW | Cap retries to 2; add retry budget check; deploy hotfix |
| Vercel timeout discovered post-launch | LOW-MEDIUM | Move PDF rendering to client-side (preferred) or upgrade Vercel plan; adjust `maxDuration` for affected routes |
| LLM hallucinations on demo documents discovered by a hiring manager | HIGH | Cannot fully prevent; mitigate by using only clean, high-quality fixture documents for the demo; add explicit "results may contain errors" disclaimer |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Uncalibrated confidence scores | Core extraction engine | Test confidence variance between clean digital PDF and blurry scan — scores should differ |
| Hallucinated plausible values | Core extraction engine (prompt engineering) + Template phase (fixture testing) | Extraction against known-answer fixtures returns correct values >90% of the time on clean inputs |
| PDF parsing type fragmentation | Core extraction engine | Both text-layer PDFs and image-only PDFs route to the correct processing path |
| Client-side browser compatibility | Web app phase (architecture decision) | App works on Safari 17+ and Firefox 120+ for the primary upload-and-extract flow |
| API key XSS exposure | Web app phase (key input component + CSP) | Key not present in any log, error message, or localStorage after session close |
| Schema validates shape but not semantics | Template implementation phase | Known-bad test documents trigger warning flags; known-good documents pass cleanly |
| Retry logic hammers API | Core extraction engine | Network tab shows max 2 calls per extraction; 429/401 errors do not trigger retries |
| Vercel function timeout | Web app deployment (deploy early) | Full extraction completes in <45s on Vercel Hobby for a 2-page invoice |
| Monorepo breaks npm consumers | Core library phase (publish pipeline) | `@docpipe/core` installs and works in a standalone project with no monorepo artifacts |

---

## Sources

- [Document Data Extraction in 2026: LLMs vs OCRs — Vellum AI](https://www.vellum.ai/blog/document-data-extraction-llms-vs-ocrs)
- [LLMs for Structured Data Extraction from PDFs — Unstract](https://unstract.com/blog/comparing-approaches-for-using-llms-for-structured-data-extraction-from-pdfs/)
- [Understanding LLM AI Hallucinations in Data Extraction — Veryfi](https://www.veryfi.com/data/ai-hallucinations/)
- [5 Methods for Calibrating LLM Confidence Scores — Latitude](https://latitude.so/blog/5-methods-for-calibrating-llm-confidence-scores)
- [Confidence Scores in LLMs — Infrrd](https://www.infrrd.ai/blog/confidence-scores-in-llms)
- [Parsing PDFs with AI: Zero-Trust Client-Only Parser — Working Software](https://www.workingsoftware.dev/parsing-pdf-with-ai-zero-trust-client-only/)
- [Complete Guide to PDF.js — Nutrient](https://www.nutrient.io/blog/complete-guide-to-pdfjs/)
- [Claude's API now supports CORS requests — Simon Willison](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/)
- [When Not to Use Local Storage — Medium / Meenu Matharu](https://meenumatharu.medium.com/when-not-to-use-local-storage-risks-examples-and-secure-alternatives-de541fed56d2)
- [Securing Web Storage: LocalStorage Best Practices — DEV Community](https://dev.to/rigalpatel001/securing-web-storage-localstorage-and-sessionstorage-best-practices-f00)
- [Pitfalls When Adding Turborepo to Your Project — DEV Community](https://dev.to/_gdelgado/pitfalls-when-adding-turborepo-to-your-project-4cel)
- [Vercel Functions Limits — Vercel Docs](https://vercel.com/docs/functions/limitations)
- [Implementing Structured Outputs for Any LLM — Inferable](https://www.inferable.ai/blog/posts/llm-json-parser-structured-output)
- [Build an Intelligent Document Processing System with Confidence Scores — Medium / Ferry Djaja](https://djajafer.medium.com/build-an-intelligent-document-processing-with-confidence-scores-with-gpt-4o-ff93083e4ce5)
- [UX Best Practices for File Uploader — Uploadcare](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [Mastering Document Upload AI Chat Tools: 5 Critical Mistakes — Pidoca](https://pidoca.com/blog/mastering-document-upload-ai-chat-tools-avoid-these-5-critical-mistakes/)
- [Interpret and Improve Confidence Scores — Microsoft Azure AI Docs](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept/accuracy-confidence)

---
*Pitfalls research for: document intelligence engine (LLM vision extraction)*
*Researched: 2026-03-28*

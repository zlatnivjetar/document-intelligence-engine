---
phase: 04
slug: web-app-core-flow
status: approved
shadcn_initialized: false
preset: new-york
created: 2026-03-29
---

# Phase 04 - UI Design Contract

> Visual and interaction contract for the first user-facing DocPipe web flow.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | new-york |
| Component library | radix |
| Icon library | lucide-react |
| Font | Space Grotesk (display + headings) and Source Sans 3 (body) |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing |
| lg | 24px | Form group spacing |
| xl | 32px | Card and page grid gaps |
| 2xl | 48px | Section padding |
| 3xl | 64px | Desktop page framing |

Exceptions: none

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.6 |
| Label | 13px | 600 | 1.4 |
| Heading | 28px | 600 | 1.15 |
| Display | 48px | 700 | 1.0 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F4EFE6` | App background, page field |
| Secondary (30%) | `#D9CCB8` | Cards, panels, dropzone surface |
| Accent (10%) | `#C8643B` | Primary CTA, active drag state, focus ring |
| Destructive | `#B42318` | Invalid file and failed extraction states |

Accent reserved for: Extract button, selected template pill, active drag outline, progress pulse, and focused API key field.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Extract document |
| Empty state heading | Drop a document to start |
| Empty state body | Add a PDF, PNG, or JPG, paste your Anthropic key for this session, then choose a template. |
| Error state | That file is not supported. Use PDF, PNG, or JPG and try again. |
| Destructive confirmation | Clear API key: Remove the session-only key from this browser tab? |

---

## Interaction Contract

- Keep the whole Phase 4 experience on one page. No wizard, no route transitions.
- The upload area is the dominant visual object above the fold on desktop and first in order on mobile.
- The API key field is explicit about session-only storage and never hidden behind a settings page.
- Template selection stays simple in Phase 4: invoice, receipt, and W-2 only.
- Results appear in-page in a plain structured JSON card with overall confidence and no export actions yet.
- Unsupported file types must fail before extraction starts and the error must render inline next to the upload area.
- Loading state uses one clear progress message: "Extracting with your key..." and disables the CTA.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | button, card, input, label, select, separator, badge | not required |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-03-29

---
phase: 04-web-app-core-flow
plan: "02"
subsystem: ui
tags: [nextjs, tailwindcss, shadcn, radix-ui, react]
requires:
  - phase: 01-monorepo-types-provider
    provides: Next.js App Router scaffold, workspace TypeScript settings, and web build scripts
  - phase: 03-core-completeness
    provides: Thin web-consumer boundary and the shared DocPipe package contract
provides:
  - Tailwind v4 PostCSS wiring inside apps/web
  - shadcn-compatible new-york primitives for button, card, input, label, and select
  - Static DocPipe single-page shell with upload, API key, template, CTA, and result preview zones
affects: [04-03, 05-results-and-export, web-ui]
tech-stack:
  added: [tailwindcss, "@tailwindcss/postcss", shadcn-ui-config, radix-ui, lucide-react, class-variance-authority, tailwind-merge]
  patterns: [token-driven Tailwind v4 theming, shadcn-style local primitives, static server-rendered app shell]
key-files:
  created:
    - apps/web/postcss.config.mjs
    - apps/web/components.json
    - apps/web/src/app/globals.css
    - apps/web/src/components/ui/button.tsx
    - apps/web/src/components/ui/card.tsx
    - apps/web/src/components/ui/input.tsx
    - apps/web/src/components/ui/label.tsx
    - apps/web/src/components/ui/select.tsx
    - apps/web/src/lib/utils.ts
  modified:
    - apps/web/package.json
    - apps/web/src/app/layout.tsx
    - apps/web/src/app/page.tsx
key-decisions:
  - "Bound the approved UI contract to CSS custom properties in globals.css and exposed the font variables through Tailwind v4 @theme inline."
  - "Kept the page shell itself as a static server component while rendering client-capable shadcn-style primitives from local wrappers."
  - "Used explicit exported component annotations on forwardRef/cva primitives so the web app still compiles under isolatedDeclarations."
patterns-established:
  - "Warm paper palette tokens in globals.css drive cards, controls, and the page backdrop."
  - "Reusable UI primitives live under apps/web/src/components/ui and share cn()-based composition."
requirements-completed: [INPUT-04, WEB-08]
duration: 3 min
completed: 2026-03-29
---

# Phase 04 Plan 02: DocPipe Shell Foundation Summary

**Tailwind v4 theming, shadcn-style web primitives, and a static DocPipe single-page shell for upload, BYOK entry, template selection, and preview**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-29T12:36:48+02:00
- **Completed:** 2026-03-29T12:39:40+02:00
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Wired `apps/web` to Tailwind CSS v4 with the required PostCSS adapter and shadcn new-york configuration.
- Added reusable local UI primitives and the shared `cn()` helper expected by shadcn-style components.
- Replaced the default page with a polished static DocPipe shell that reserves visible upload, API key, template, CTA, and result preview surfaces.

## Task Commits

Each task was committed atomically:

1. **Task 1: Bootstrap Tailwind v4 + shadcn-compatible UI foundations in apps/web** - `54e3119` (`feat`)
2. **Task 2: Build the static single-page DocPipe shell from the Phase 4 UI contract** - `18a6896` (`feat`)

## Files Created/Modified

- `apps/web/package.json` - Added Tailwind v4, Radix, lucide, and shadcn helper dependencies.
- `apps/web/postcss.config.mjs` - Registered the Tailwind v4 PostCSS plugin.
- `apps/web/components.json` - Declared the shadcn new-york preset and aliases for the web app.
- `apps/web/src/app/layout.tsx` - Loaded Space Grotesk and Source Sans 3 and exposed them as CSS variables.
- `apps/web/src/app/globals.css` - Added the approved color tokens, font mapping, and global shell styling.
- `apps/web/src/app/page.tsx` - Built the static one-page DocPipe workspace shell.
- `apps/web/src/components/ui/button.tsx` - Added a shadcn-style button primitive with DocPipe variants.
- `apps/web/src/components/ui/card.tsx` - Added card layout primitives for the shell sections.
- `apps/web/src/components/ui/input.tsx` - Added the shared text/password input primitive.
- `apps/web/src/components/ui/label.tsx` - Added the shared Radix label wrapper.
- `apps/web/src/components/ui/select.tsx` - Added the shared Radix select primitive for template selection.
- `apps/web/src/lib/utils.ts` - Added the shared `cn()` helper used by the UI primitives.

## Decisions Made

- Used CSS variables for the UI-SPEC colors and radii so future plans can reuse the contract without duplicating literal values.
- Kept all Phase 4 shell surfaces on a single route and avoided `use client` in the page file itself.
- Used explicit exported component types on UI primitives to preserve compatibility with the repo's `isolatedDeclarations` TypeScript setting.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added explicit exported types for UI primitives**
- **Found during:** Task 1 (Bootstrap Tailwind v4 + shadcn-compatible UI foundations in apps/web)
- **Issue:** `pnpm --filter web type-check` failed because exported `forwardRef` components and `cva` helpers in the new primitives lacked explicit annotations under `isolatedDeclarations`.
- **Fix:** Added explicit exported component and helper types to the button, input, label, and select primitives.
- **Files modified:** `apps/web/src/components/ui/button.tsx`, `apps/web/src/components/ui/input.tsx`, `apps/web/src/components/ui/label.tsx`, `apps/web/src/components/ui/select.tsx`
- **Verification:** `pnpm --filter web type-check`
- **Committed in:** `54e3119`

---

**Total deviations:** 1 auto-fixed (Rule 3: 1)
**Impact on plan:** The fix was required for the repo's existing TypeScript contract and did not expand scope beyond the planned UI foundation work.

## Issues Encountered

- Local verification used `pnpm install --lockfile=false` because this parallel executor does not own `pnpm-lock.yaml`; dependency resolution succeeded without changing the shared lockfile.
- `STATE.md` already had concurrent execution changes and still points at plan 1 of 4, so shared planning-state updates were intentionally left to the coordinating executor for safe reconciliation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The web app now has stable visual surfaces for the upload area, session-only API key entry, template selection, extraction CTA, and JSON preview. Phase 04-03 can wire interactive state and extraction behavior onto these primitives without reworking layout or styling.

## Self-Check: PASSED

- Verified `.planning/phases/04-web-app-core-flow/04-02-SUMMARY.md` and all 12 planned web files exist on disk.
- Verified task commits `54e3119` and `18a6896` exist in git history.
- Stub scan only matched legitimate UI placeholder attributes and Tailwind placeholder classes; no blocking TODO/FIXME or empty-data stubs were introduced for this plan goal.

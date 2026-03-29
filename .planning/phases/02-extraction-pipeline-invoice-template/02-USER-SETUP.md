# Phase 02: User Setup Required

**Generated:** 2026-03-29
**Phase:** 02-extraction-pipeline-invoice-template
**Status:** Incomplete

Complete these items when you are ready to publish `@docpipe/core` to npm. The package audit and consumer verification are already automated; these remaining items require access to your npm account.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `NPM_TOKEN` | npmjs.com -> Avatar -> Access Tokens -> Generate New Token (Automation) | CI secret store or local shell env |

## Account Setup

- [ ] **Create npm account**
  - URL: https://www.npmjs.com/signup
  - Skip if: You already have an npm account that can publish the `@docpipe` scope

## Dashboard Configuration

- [ ] **Generate an Automation token**
  - Location: npmjs.com -> Avatar -> Access Tokens -> Generate New Token
  - Token type: Automation
  - Notes: Store it immediately; npm only shows the raw token once

- [ ] **Confirm package ownership / scope access**
  - Location: npmjs.com -> `@docpipe/core` package settings (after first publish) or your organization scope settings
  - Notes: Make sure the publishing account can publish scoped public packages

## Verification

After completing setup, verify with:

```bash
# Local package verification
node scripts/verify-consumer.mjs

# Publish surface verification (no upload)
cd packages/core
npm publish --dry-run
```

Expected results:
- `node scripts/verify-consumer.mjs` prints `CONSUMER TEST PASSED`
- `npm publish --dry-run` completes without missing-file or auth-shape errors

---

**Once all items complete:** Mark status as "Complete" at top of file.

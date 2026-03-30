import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCustomSchema } from './custom-schema.js';

const fixturesDir = resolve(
  process.cwd(),
  'test',
  'fixtures',
  'custom-schema',
);

describe('loadCustomSchema', () => {
  it('loads a TypeScript default export schema', async () => {
    const schemaPath = resolve(fixturesDir, 'default-schema.ts');
    const result = await loadCustomSchema(schemaPath);

    expect(result.schemaName).toBe('CustomSchema');
    expect(result.schemaDescription).toBe(
      'User-provided schema loaded from default-schema.ts.',
    );
    expect(result.schema.safeParse({ merchantName: 'Shop', total: 42 }).success).toBe(
      true,
    );
  });

  it('loads a named schema export from an ESM module', async () => {
    const schemaPath = resolve(fixturesDir, 'named-schema.mjs');
    const result = await loadCustomSchema(schemaPath);

    expect(result.schema.safeParse({ invoiceNumber: 'INV-1', total: 42 }).success).toBe(
      true,
    );
  });

  it('rejects non-object schema exports with the exact error message', async () => {
    const schemaPath = resolve(fixturesDir, 'invalid-schema.mjs');

    await expect(loadCustomSchema(schemaPath)).rejects.toThrow(
      'Custom schema must be a top-level z.object({...}) value.',
    );
  });

  it('rejects missing files with the exact error message', async () => {
    const schemaPath = resolve(fixturesDir, 'missing-schema.ts');

    await expect(loadCustomSchema(schemaPath)).rejects.toThrow(
      `Custom schema file not found: ${schemaPath}`,
    );
  });
});

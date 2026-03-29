#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const coreDir = join(repoRoot, 'packages', 'core');

function run(command, args, cwd = repoRoot) {
  console.log(`$ ${command} ${args.join(' ')}`);
  const shellCommand = [command, ...args.map((arg) => `"${arg.replaceAll('"', '\\"')}"`)].join(' ');

  return execSync(shellCommand, {
    cwd,
    encoding: 'utf8',
    shell: true,
    stdio: 'pipe',
  });
}

let tempDir;
let tarballPath;

try {
  run('pnpm', ['--filter', '@docpipe/core', 'build']);

  const packOutput = run('npm', ['pack', '--json'], coreDir);
  const [{ filename, files }] = JSON.parse(packOutput);
  tarballPath = join(coreDir, filename);

  if (!files.some((entry) => entry.path.startsWith('dist/'))) {
    throw new Error('Packed tarball is missing dist/ contents.');
  }

  const disallowedFiles = files
    .map((entry) => entry.path)
    .filter(
      (file) =>
        file.startsWith('src/') ||
        file.startsWith('node_modules/') ||
        file.includes('.test.'),
    );

  if (disallowedFiles.length > 0) {
    throw new Error(
      `Packed tarball contains disallowed files: ${disallowedFiles.join(', ')}`,
    );
  }

  console.log(`Packed: ${tarballPath}`);

  tempDir = mkdtempSync(join(tmpdir(), 'docpipe-consumer-test-'));
  console.log(`Consumer dir: ${tempDir}`);

  writeFileSync(
    join(tempDir, 'package.json'),
    JSON.stringify(
      {
        name: 'docpipe-consumer-test',
        version: '1.0.0',
        private: true,
        type: 'module',
      },
      null,
      2,
    ),
  );

  run(
    'npm',
    [
      'install',
      tarballPath,
      'ai@^6',
      'zod@^4',
      'vitest@^3',
      '--no-save',
    ],
    tempDir,
  );

  writeFileSync(
    join(tempDir, 'probe.mjs'),
    `import { extract, createAnthropicProvider, invoiceSchema } from '@docpipe/core';

if (typeof extract !== 'function') {
  throw new Error('extract is not a function');
}

if (typeof createAnthropicProvider !== 'function') {
  throw new Error('createAnthropicProvider is not a function');
}

if (typeof invoiceSchema?.safeParse !== 'function') {
  throw new Error('invoiceSchema is not a Zod schema');
}

const fields = Object.keys(invoiceSchema.shape);
console.log('Exports verified: extract, createAnthropicProvider, invoiceSchema');
console.log('invoiceSchema fields:', fields.join(', '));
`,
  );

  writeFileSync(
    join(tempDir, 'consumer.test.mjs'),
    `import { describe, expect, it } from 'vitest';
const { extract, createAnthropicProvider, invoiceSchema } = await import('@docpipe/core');

describe('consumer install verification', () => {
  it('imports the public API and invokes extract() without missing-module errors', async () => {
    await expect(
      extract({
        input: {
          document: 'ZmFrZQ==',
          mimeType: 'image/png',
        },
        schema: invoiceSchema,
        model: {},
      }),
    ).rejects.toMatchObject({
      code: 'EXTRACTION_FAILED',
      retryable: true,
    });
  });

  it('creates an Anthropic provider model shape', () => {
    const model = createAnthropicProvider({
      apiKey: 'sk-ant-test',
      model: 'claude-sonnet-4-6',
    });

    expect(model.provider).toBe('anthropic.messages');
    expect(model.modelId).toBe('claude-sonnet-4-6');
  });
});
`,
  );

  console.log(run('node', ['probe.mjs'], tempDir).trim());
  console.log(run('npx', ['vitest', 'run', 'consumer.test.mjs'], tempDir).trim());
  console.log('CONSUMER TEST PASSED');
} catch (error) {
  console.error('\nCONSUMER TEST FAILED');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exitCode = 1;
} finally {
  if (tarballPath && existsSync(tarballPath)) {
    rmSync(tarballPath, { force: true });
  }

  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

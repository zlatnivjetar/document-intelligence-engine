#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const coreDir = join(repoRoot, 'packages', 'core');
const cliDir = join(repoRoot, 'packages', 'cli');

// Packaging verification flow: npm pack + temp project install + npx docpipe.

function toShellCommand(command, args) {
  return [command, ...args.map((arg) => `"${arg.replaceAll('"', '\\"')}"`)].join(' ');
}

function run(command, args, cwd = repoRoot) {
  const shellCommand = toShellCommand(command, args);

  console.log(`$ ${shellCommand}`);

  return execSync(shellCommand, {
    cwd,
    encoding: 'utf8',
    shell: true,
    stdio: 'pipe',
  });
}

function runResult(command, args, cwd = repoRoot) {
  try {
    return {
      status: 0,
      stdout: run(command, args, cwd),
      stderr: '',
    };
  } catch (error) {
    return {
      status: typeof error.status === 'number' ? error.status : 1,
      stdout: typeof error.stdout === 'string' ? error.stdout : String(error.stdout ?? ''),
      stderr: typeof error.stderr === 'string' ? error.stderr : String(error.stderr ?? ''),
    };
  }
}

function packPackage(packageDir) {
  const packOutput = run('npm', ['pack', '--json'], packageDir);
  const [{ filename, files }] = JSON.parse(packOutput);

  return {
    tarballPath: join(packageDir, filename),
    files,
  };
}

function assertTarballFiles(files, expectedDistFile) {
  const paths = files.map((entry) => entry.path);

  if (!paths.includes(expectedDistFile)) {
    throw new Error(`Packed CLI tarball is missing ${expectedDistFile}.`);
  }

  const disallowedFiles = paths.filter(
    (filePath) =>
      filePath.startsWith('src/') ||
      filePath.startsWith('node_modules/') ||
      filePath.includes('.test.'),
  );

  if (disallowedFiles.length > 0) {
    throw new Error(
      `Packed CLI tarball contains disallowed files: ${disallowedFiles.join(', ')}`,
    );
  }
}

let tempDir;
let coreTarballPath;
let cliTarballPath;

try {
  run('pnpm.cmd', ['--filter', '@docpipe/core', 'build']);
  run('pnpm.cmd', ['--filter', '@docpipe/cli', 'build']);

  const corePack = packPackage(coreDir);
  coreTarballPath = corePack.tarballPath;

  const cliPack = packPackage(cliDir);
  cliTarballPath = cliPack.tarballPath;
  assertTarballFiles(cliPack.files, 'dist/index.js');

  tempDir = mkdtempSync(join(tmpdir(), 'docpipe-cli-consumer-'));
  console.log(`Consumer dir: ${tempDir}`);

  writeFileSync(
    join(tempDir, 'package.json'),
    JSON.stringify(
      {
        name: 'docpipe-cli-consumer-test',
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
    ['install', coreTarballPath, cliTarballPath],
    tempDir,
  );

  const helpOutput = run('npx', ['docpipe', 'extract', '--help'], tempDir);
  if (!helpOutput.includes('--schema <path>')) {
    throw new Error('Installed CLI help is missing --schema <path>.');
  }
  if (!helpOutput.includes('ANTHROPIC_API_KEY')) {
    throw new Error('Installed CLI help is missing ANTHROPIC_API_KEY guidance.');
  }

  writeFileSync(
    join(tempDir, 'schema.ts'),
    `import { z } from 'zod';

export default z.object({ amount: z.number() });
`,
  );

  writeFileSync(
    join(tempDir, 'sample.png'),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
  );

  const extractionResult = runResult(
    'npx',
    ['docpipe', 'extract', './sample.png', '--schema', './schema.ts'],
    tempDir,
  );

  if (extractionResult.status !== 1) {
    throw new Error(`Expected exit code 1 without API key, received ${extractionResult.status}.`);
  }

  if (extractionResult.stdout !== '') {
    throw new Error('Expected empty stdout for the missing-key consumer check.');
  }

  const expectedStderr =
    'Provide an Anthropic API key with --key or ANTHROPIC_API_KEY.\n';
  if (extractionResult.stderr !== expectedStderr) {
    throw new Error(
      `Unexpected stderr for the missing-key consumer check: ${JSON.stringify(extractionResult.stderr)}`,
    );
  }

  console.log('CLI CONSUMER TEST PASSED');
} catch (error) {
  console.error('\nCLI CONSUMER TEST FAILED');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exitCode = 1;
} finally {
  for (const tarballPath of [coreTarballPath, cliTarballPath]) {
    if (tarballPath && existsSync(tarballPath)) {
      rmSync(tarballPath, { force: true });
    }
  }

  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

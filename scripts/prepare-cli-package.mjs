#!/usr/bin/env node

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = resolve(__dirname, '..', 'packages', 'cli', 'package.json');
const backupPath = resolve(__dirname, '..', 'packages', 'cli', '.package-json.prepack-backup');

function readManifest() {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
}

function writeManifest(manifest) {
  writeFileSync(packageJsonPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function runPrepack() {
  if (!existsSync(backupPath)) {
    writeFileSync(backupPath, readFileSync(packageJsonPath));
  }

  const manifest = readManifest();

  if (manifest.dependencies?.['@docpipe/core'] === 'workspace:0.1.0') {
    manifest.dependencies['@docpipe/core'] = '0.1.0';
    writeManifest(manifest);
  }
}

function runPostpack() {
  if (!existsSync(backupPath)) {
    return;
  }

  writeFileSync(packageJsonPath, readFileSync(backupPath));
  unlinkSync(backupPath);
}

const mode = process.argv[2];

if (mode === 'prepack') {
  runPrepack();
} else if (mode === 'postpack') {
  runPostpack();
} else {
  throw new Error('Usage: node scripts/prepare-cli-package.mjs <prepack|postpack>');
}

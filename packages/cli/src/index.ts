#!/usr/bin/env node
import { runCli } from './cli.js';

void runCli(process.argv.slice(2), {
  stdout: process.stdout,
  stderr: process.stderr,
  env: process.env,
  cwd: process.cwd(),
}).then((exitCode) => {
  process.exitCode = exitCode;
});

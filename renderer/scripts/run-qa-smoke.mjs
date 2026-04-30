import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const repoRoot = resolve(__dirname, '..', '..');
const rendererDir = resolve(__dirname, '..');
const artifactDir = join(repoRoot, 'docs', 'agents', 'reports', 'artifacts');
mkdirSync(artifactDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const logPath = join(artifactDir, `qa-smoke-${stamp}.log`);

const run = spawnSync(
  'npx playwright test smoke/qa-smoke.spec.ts --config=playwright.config.ts --reporter=line',
  { cwd: rendererDir, encoding: 'utf8', shell: true },
);

const body = [
  `timestamp: ${new Date().toISOString()}`,
  `cwd: ${rendererDir}`,
  `exit_code: ${run.status ?? 1}`,
  run.error ? `spawn_error: ${String(run.error)}` : '',
  '',
  '--- stdout ---',
  run.stdout ?? '',
  '',
  '--- stderr ---',
  run.stderr ?? '',
  '',
].join('\n');

writeFileSync(logPath, body, 'utf8');

console.log(`QA smoke log: ${logPath}`);
if (run.stdout) process.stdout.write(run.stdout);
if (run.stderr) process.stderr.write(run.stderr);

process.exit(run.status ?? 1);

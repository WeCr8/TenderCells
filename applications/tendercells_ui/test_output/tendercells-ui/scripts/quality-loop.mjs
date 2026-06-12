import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const checks = [
  {
    name: 'TypeScript and production bundle',
    command: npm,
    args: ['run', 'build'],
    required: true,
    repair: 'Fix TypeScript errors, broken imports, Vite optimizer problems, or production bundle failures.',
  },
  {
    name: 'Unit tests',
    command: npm,
    args: ['run', 'test', '--', '--run'],
    required: false,
    repair: 'Add or repair Vitest tests for the failing workflow. Placeholder tests should be converted into real assertions.',
  },
  {
    name: 'Fallow codebase analysis',
    command: npm,
    args: ['run', 'fallow'],
    required: false,
    repair: 'Review fallow findings for dead code, duplication, complexity hotspots, or architecture drift before promoting this to a required gate.',
  },
];

const startedAt = new Date();
const results = [];

for (const check of checks) {
  console.log(`\n== ${check.name} ==`);
  const result = spawnSync(check.command, check.args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  const output = `${result.stdout || ''}${result.stderr || ''}${result.error ? `\n${result.error.stack || result.error.message}` : ''}`.trim();
  const passed = result.status === 0;
  results.push({ ...check, passed, status: result.status, output });

  if (output) {
    console.log(output);
  }

  if (!passed && check.required) {
    break;
  }
}

const reportPath = resolve(root, 'docs', 'quality-loop-report.md');
const requiredFailed = results.some((result) => result.required && !result.passed);
const status = requiredFailed ? 'blocked' : 'ready-for-repair-review';

const report = [
  '# TenderCells Quality Loop Report',
  '',
  `Generated: ${startedAt.toISOString()}`,
  `Status: ${status}`,
  '',
  '## Checks',
  '',
  ...results.flatMap((result) => [
    `### ${result.passed ? 'PASS' : result.required ? 'FAIL' : 'WARN'} - ${result.name}`,
    '',
    `Command: \`${[result.command, ...result.args].join(' ')}\``,
    `Required: ${result.required ? 'yes' : 'no'}`,
    '',
    result.output
      ? ['```text', result.output.slice(-6000), '```'].join('\n')
      : 'No output.',
    '',
    result.passed ? '' : `Repair target: ${result.repair}`,
    '',
  ]),
  '## Repair Loop',
  '',
  '1. Fix the first required failure.',
  '2. Run `npm run quality:loop` again.',
  '3. Convert repeated failures into tests or docs.',
  '4. Update the production readiness tracker when the fix changes product behavior.',
  '',
].join('\n');

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, report);

console.log(`\nQuality loop report: ${reportPath}`);
process.exit(requiredFailed ? 1 : 0);

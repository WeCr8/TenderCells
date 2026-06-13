import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const startedAt = new Date();

function commandInvocation(command, commandArgs) {
  if (process.platform !== 'win32' || !command.toLowerCase().endsWith('.cmd')) {
    return { command, args: commandArgs };
  }

  const comspec = process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe';
  return {
    command: comspec,
    args: ['/d', '/s', '/c', quoteCommand([command, ...commandArgs])],
  };
}

function quoteCommand(parts) {
  return parts
    .map((part) => (/[ \t&()^=;!'+,`~[\]{}]/.test(part) ? `"${part.replace(/"/g, '\\"')}"` : part))
    .join(' ');
}

function runStep(name, command, args) {
  console.log(`\n== ${name} ==`);
  const invocation = commandInvocation(command, args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: appRoot,
    encoding: 'utf8',
    shell: false,
    timeout: Number(process.env.ESSENTIAL_LOOP_TIMEOUT_MS || 360000),
  });

  const output = `${result.stdout || ''}${result.stderr || ''}${result.error ? `\n${result.error.message}` : ''}`.trim();
  if (output) console.log(output);
  return { name, command: [command, ...args].join(' '), ok: result.status === 0, status: result.status, output };
}

const steps = [
  runStep('Vitest OS and model contracts', npm, ['run', 'test', '--', '--run']),
];

if (steps.every((step) => step.ok)) {
  steps.push(runStep('Autonomous build, route, service, and seed-demo audit', process.execPath, ['scripts/autonomous-loop.mjs', '--seed-demo']));
}

const failed = steps.find((step) => !step.ok);
const reportPath = resolve(appRoot, 'docs', 'essential-loop-report.md');
const report = [
  '# TenderCells Essential Loop Report',
  '',
  `Generated: ${startedAt.toISOString()}`,
  `Status: ${failed ? 'blocked' : 'ready'}`,
  '',
  '## Steps',
  '',
  ...steps.flatMap((step) => [
    `### ${step.ok ? 'PASS' : 'FAIL'} - ${step.name}`,
    '',
    `Command: \`${step.command}\``,
    '',
    step.output ? ['```text', step.output.slice(-5000), '```'].join('\n') : 'No output.',
    '',
  ]),
  '## Meaning',
  '',
  failed
    ? 'The platform is not ready for autonomous or community testing. Fix the first failed step and rerun `npm run essential:loop`.'
    : 'The platform passed required tests and the seed-demo autonomous OS audit. Non-blocking Fallow warnings remain backlog signals.',
  '',
].join('\n');

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, report, 'utf8');
console.log(`\nEssential loop report: ${reportPath}`);
process.exit(failed ? 1 : 0);

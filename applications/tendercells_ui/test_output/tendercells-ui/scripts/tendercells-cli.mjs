#!/usr/bin/env node
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const command = args.find((arg) => !arg.startsWith('-')) || 'help';
const flags = new Set(args.filter((arg) => arg.startsWith('-')));
const isWin = process.platform === 'win32';

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  gold: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

const TASKS = {
  dev: { cmd: 'npm', args: ['run', 'dev'], desc: 'Start Vite on the normal local app port.' },
  build: { cmd: 'npm', args: ['run', 'build'], desc: 'Run TypeScript and production bundle build.' },
  check: { cmd: 'npm', args: ['run', 'essential:loop'], desc: 'Run required build, contracts, routes, and service checks.' },
  loop: { cmd: 'npm', args: ['run', 'platform:loop'], desc: 'Run essential loop plus desktop Playwright smoke.' },
  quality: { cmd: 'npm', args: ['run', 'quality:loop'], desc: 'Run optional quality analysis such as Fallow.' },
  fallow: { cmd: 'npm', args: ['run', 'fallow'], desc: 'Run dead-code and duplication scan.' },
  smoke: { cmd: 'npm', args: ['run', 'ui:smoke:desktop'], desc: 'Run desktop Playwright browser smoke tests.' },
  demo: { cmd: 'npm', args: ['run', 'ui:demo'], desc: 'Run the product demo workflow headlessly.' },
  'demo:watch': { cmd: 'npm', args: ['run', 'ui:demo:headed'], desc: 'Open a visible browser and drive the demo workflow.' },
  'llm:warmup': { cmd: 'npm', args: ['run', 'llm:warmup'], desc: 'Warm local Ollama/OpenClaw coding models.' },
  'llm:review': { cmd: 'npm', args: ['run', 'llm:review'], desc: 'Ask the local model for a code review pass.' },
  'llm:repair': { cmd: 'npm', args: ['run', 'llm:repair-apply'], desc: 'Let the local model attempt a bounded repair patch.' },
};

function color(text, code) {
  return flags.has('--plain') ? text : `${code}${text}${C.reset}`;
}

function banner() {
  if (flags.has('--no-banner')) return;
  const art = String.raw`
        🌾       🌾        🌾
            ╭─────────╮
       ╭────┤  ▣   ▣  ├────╮
       │    │    ▲    │    │
       │    │  ╭─┴─╮  │    │
  ═════╧════╧══╧═══╧══╧════╧═════
        T E N D E R   C E L L S
     field-ready animal care OS CLI
`;
  process.stdout.write(color(art, C.green));
}

function help() {
  banner();
  console.log(color('Usage', C.bold));
  console.log('  npm run tc -- <command>');
  console.log('  npx --no-install tendercells <command>');
  console.log('  node scripts/tendercells-cli.mjs <command>\n');
  console.log(color('Commands', C.bold));
  for (const [name, task] of Object.entries(TASKS)) {
    console.log(`  ${color(name.padEnd(12), C.cyan)} ${task.desc}`);
  }
  console.log(`  ${color('status'.padEnd(12), C.cyan)} Show local TenderCells service URLs to check.`);
  console.log(`  ${color('help'.padEnd(12), C.cyan)} Show this help screen.\n`);
  console.log(color('Flags', C.bold));
  console.log('  --no-banner   Skip the barn splash.');
  console.log('  --plain       Disable terminal colors.\n');
}

function status() {
  banner();
  console.log(color('Local service map', C.bold));
  [
    ['App', 'http://localhost:5173'],
    ['Express/API health', 'http://localhost:4000/health'],
    ['OpenClaw gateway', 'http://localhost:8089/health'],
    ['Open WebUI', 'http://localhost:18789'],
    ['Ollama tags', 'http://localhost:11434/api/tags'],
  ].forEach(([label, url]) => console.log(`  ${color(label.padEnd(20), C.gold)} ${url}`));
  console.log(`\nRun ${color('npm run tc -- loop', C.cyan)} for the full local verification loop.`);
}

function run(taskName) {
  const task = TASKS[taskName];
  if (!task) {
    banner();
    console.error(color(`Unknown TenderCells command: ${taskName}`, C.red));
    console.error(`Run ${color('npm run tc -- help', C.cyan)} to see available commands.`);
    process.exit(1);
  }

  banner();
  console.log(`${color('Running', C.bold)} ${color(taskName, C.cyan)} ${color(`→ ${task.desc}`, C.dim)}`);
  const child = spawn(isWin ? `${task.cmd}.cmd` : task.cmd, task.args, {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR || '1' },
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(color(`TenderCells task stopped by ${signal}`, C.red));
      process.exit(1);
    }
    process.exit(code ?? 1);
  });
}

if (command === 'help' || command === '--help' || command === '-h') {
  help();
} else if (command === 'status') {
  status();
} else {
  run(command);
}

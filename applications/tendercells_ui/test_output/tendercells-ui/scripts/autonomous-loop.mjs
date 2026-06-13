import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const startedAt = new Date();
const args = process.argv.slice(2);
const iterations = Math.max(1, Math.min(5, Number(argValue('iterations', '1')) || 1));
const seedDemo = hasFlag('seed-demo');
const repairEnabled = process.env.LOCAL_LLM_REPAIR === '1' || hasFlag('repair-notes');
const autoRepairEnabled = hasFlag('auto-repair') || process.env.LOCAL_LLM_AUTO_REPAIR === '1';
const repairFiles = argList('repair-file');
const repairGoal = argValue('repair-goal', 'Fix the first failing TenderCells build or smoke check with the smallest safe code patch.');
const routeBase = argValue('base-url', process.env.TENDERCELLS_DEV_URL || 'http://localhost:5173');
const productRoutes = [
  '/chicken-tender',
  '/roaming-roost',
  '/duck-dock',
  '/goat-guardian',
  '/bunny-burrow',
  '/turkey-tower',
  '/predator-monitor',
  '/rail-system-modules',
  '/tender-cells-cloud',
  '/pigeon-palace',
];
const osRoutes = [
  '/',
  '/dashboard',
  '/products',
  '/layout',
  '/schedules',
  '/specs',
  '/analytics',
  '/diagnostics',
  '/birds',
  '/ai',
  '/setup',
  '/chicken-eye',
  '/settings',
  '/account',
];

function argValue(name, fallback = undefined) {
  const flag = `--${name}`;
  const index = args.indexOf(flag);
  return index === -1 ? fallback : args[index + 1] ?? fallback;
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function argList(name) {
  const flag = `--${name}`;
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === flag && args[i + 1]) values.push(args[i + 1]);
  }
  return values;
}

function runCommand(name, command, commandArgs, required = true) {
  console.log(`\n== ${name} ==`);
  const invocation = commandInvocation(command, commandArgs);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: appRoot,
    encoding: 'utf8',
    shell: false,
    timeout: Number(process.env.AUTONOMOUS_LOOP_COMMAND_TIMEOUT_MS || 240000),
  });
  const output = `${result.stdout || ''}${result.stderr || ''}${result.error ? `\n${result.error.message}` : ''}`.trim();
  if (output) console.log(output);
  return {
    kind: 'command',
    name,
    required,
    ok: result.status === 0,
    status: result.status,
    output,
  };
}

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

async function probeUrl(name, url, required = true) {
  console.log(`\n== ${name} ==`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.AUTONOMOUS_LOOP_HTTP_TIMEOUT_MS || 7000));
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
    });
    const text = await response.text();
    const ok = response.ok;
    console.log(`${response.status} ${response.statusText} ${url}`);
    return {
      kind: 'http',
      name,
      required,
      ok,
      status: response.status,
      output: text.slice(0, 700),
      url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(message);
    return { kind: 'http', name, required, ok: false, status: null, output: message, url };
  } finally {
    clearTimeout(timer);
  }
}

function checkSourceMarker(name, file, markers, required = true) {
  const path = resolve(appRoot, file);
  const exists = existsSync(path);
  const text = exists ? readFileSync(path, 'utf8') : '';
  const missing = markers.filter((marker) => !text.includes(marker));
  const ok = exists && missing.length === 0;
  console.log(`\n== ${name} ==`);
  console.log(ok ? `OK ${file}` : `Missing ${missing.join(', ') || file}`);
  return {
    kind: 'source',
    name,
    required,
    ok,
    status: ok ? 0 : 1,
    output: ok ? `${file} has ${markers.join(', ')}` : `Missing markers: ${missing.join(', ')}`,
    file,
  };
}

function runTenderCellsOsAudit() {
  const checks = [
    ['Product route map', 'src/routes/AppRoutes.tsx', productRoutes],
    ['Product registration catalog', 'src/components/products/ProductRegistrationModal.tsx', [
      'chicken-tender',
      'roaming-roost',
      'duck-dock',
      'goat-guardian',
      'bunny-burrow',
      'turkey-tower',
      'predator-monitor',
      'rail-system',
      'door-system',
      'waterer',
      'feeder',
      'custom_product',
    ]],
    ['Product registry CRUD surface', 'src/pages/ProductsPage.tsx', [
      'registerProduct',
      'updateProduct',
      'deleteProduct',
      'connectProduct',
      'custom_product_name',
      'product_family',
    ]],
    ['Dynamic side menu sections', 'src/components/navigation/SideMenu.tsx', [
      'PRODUCT_ITEMS',
      'chicken-tender',
      'roaming-roost',
      'duck-dock',
      'predator-monitor',
      'Products',
      'Property Layout',
    ]],
    ['Product section device CRUD panels', 'src/components/navigation/ProductSectionPanel.tsx', [
      'deviceTypes',
      'defaultDevices',
      'Add Device',
      'Delete device',
      'doors',
      'water',
      'route',
    ]],
    ['Property editor simulation contract', 'src/pages/PropertyLayoutBuilder.tsx', [
      'property',
      'obstacle',
      'hardware',
      'Simulate Route',
      'savePropertyLayout',
    ]],
    ['Shared property layout store', 'src/components/property/propertyLayoutStore.ts', [
      'PROPERTY_LAYOUT_STORAGE_KEY',
      'PRODUCT_DIMENSIONS',
      'OBSTACLE_DEFAULT_SHAPES',
      'deviceId',
      'productId',
    ]],
    ['2D and 3D viewport contract', 'src/components/viewport/Viewport3D.tsx', [
      'viewMode',
      'cameraPreset',
      'controlMode',
      'GLTFLoader',
      'registered products',
      'product_family',
    ]],
    ['Camera and ChickenEye views', 'src/pages/ChickenTenderDashboard.tsx', [
      'cameraViewEnabled',
      'Show Cameras',
      'CameraGrid',
      'Viewport3D',
    ]],
    ['Telemetry and controls', 'src/hooks/useTelemetry.ts', [
      '/api/mqtt',
      'telemetry',
      'pollIntervalMs',
    ]],
    ['Hardware controls', 'src/hooks/useHardwareControl.ts', [
      '/api/mqtt',
      'door',
      'feed',
      'water',
      'stop',
    ]],
    ['NVIDIA simulation docs', 'docs/nvidia-robotics-simulation.md', [
      'Isaac Sim',
      'property_scene_url',
      'nvidia_isaac_robot_asset',
      'tc/{device_id}/cmd',
      'telemetry',
    ]],
    ['FarmBot-inspired homestead OS docs', 'docs/farmbot-inspired-homestead-os.md', [
      'Firmware',
      'TenderCells OS',
      'Web app',
      'API server',
      'Message broker',
      'Developer SDKs',
      'Offline',
      'Simulation',
    ]],
    ['Third-party attribution', 'docs/third-party-attribution.md', [
      'FarmBot',
      'Code Reuse Policy',
      'https://farm.bot/',
      'https://github.com/FarmBot',
      'https://licensing.farm.bot/',
    ]],
    ['Mobile packaging docs', 'docs/mobile-packaging.md', [
      'iOS',
      'Android',
      'SHA',
    ]],
    ['Production readiness tracker', 'docs/production-readiness.md', [
      'Product registry governance',
      'Property CRUD',
      'NVIDIA robotics simulation',
      'Hardware kit docs',
    ]],
  ];

  return checks.map(([name, file, markers]) => checkSourceMarker(`OS audit: ${name}`, file, markers, true));
}

async function runRepairNotes(results) {
  const failed = results.filter((result) => !result.ok);
  if (!repairEnabled || failed.length === 0) {
    return repairEnabled ? 'No failures; local LLM repair notes not needed.' : 'Set `LOCAL_LLM_REPAIR=1` or pass `--repair-notes` to ask Ollama for repair order after failures.';
  }

  const summary = failed
    .map((result) => [
      `Check: ${result.name}`,
      `Required: ${result.required ? 'yes' : 'no'}`,
      `Kind: ${result.kind}`,
      result.url ? `URL: ${result.url}` : '',
      result.file ? `File: ${result.file}` : '',
      'Output:',
      String(result.output || '').slice(-1800),
    ].filter(Boolean).join('\n'))
    .join('\n\n');

  const result = spawnSync(
    process.execPath,
    [
      'scripts/local-llm.mjs',
      'prompt',
      '--model',
      process.env.OLLAMA_CODER_MODEL || 'qwen2.5-coder:7b',
      '--text',
      `TenderCells autonomous loop found failures. Give concise repair order, likely files, and verification commands.\n\n${summary}`,
    ],
    {
      cwd: appRoot,
      encoding: 'utf8',
      shell: false,
      timeout: Number(process.env.LOCAL_LLM_TIMEOUT_MS || 240000),
    }
  );

  return `${result.stdout || ''}${result.stderr || ''}${result.error ? `\n${result.error.message}` : ''}`.trim();
}

function runAutoRepair(results) {
  const failed = results.filter((result) => !result.ok && result.required);
  if (!autoRepairEnabled || failed.length === 0) return null;
  if (repairFiles.length === 0) {
    return {
      ok: false,
      output: 'Auto repair requested, but no --repair-file values were provided. Refusing to let the local model edit an unbounded file set.',
    };
  }

  const failedSummary = failed
    .map((result) => [
      `Check: ${result.name}`,
      `Kind: ${result.kind}`,
      'Output:',
      String(result.output || '').slice(-2200),
    ].join('\n'))
    .join('\n\n');

  console.log('\n== Local LLM auto repair ==');
  const result = spawnSync(
    process.execPath,
    [
      'scripts/local-llm.mjs',
      'repair-apply',
      '--goal',
      `${repairGoal}\n\nFailure summary:\n${failedSummary}`,
      '--verify',
      'npm.cmd run build',
      ...repairFiles.flatMap((file) => ['--file', file]),
    ],
    {
      cwd: appRoot,
      encoding: 'utf8',
      shell: false,
      timeout: Number(process.env.LOCAL_LLM_TIMEOUT_MS || 240000),
    }
  );

  const output = `${result.stdout || ''}${result.stderr || ''}${result.error ? `\n${result.error.message}` : ''}`.trim();
  if (output) console.log(output);
  return { ok: result.status === 0, output };
}

async function runIteration(iteration) {
  console.log(`\n######## TenderCells autonomous loop ${iteration}/${iterations} ########`);
  const results = [];

  results.push(runCommand('Production build', npm, ['run', 'build'], true));
  if (!results.at(-1).ok) return results;

  results.push(runCommand('Fallow codebase analysis', npm, ['run', 'fallow'], false));
  for (const route of osRoutes) {
    results.push(await probeUrl(`App route ${route}`, `${routeBase}${route}`, false));
  }
  for (const route of productRoutes) {
    results.push(await probeUrl(`Product route ${route}`, `${routeBase}${route}`, false));
  }
  results.push(...runTenderCellsOsAudit());
  results.push(await probeUrl('Express API health on 4000', 'http://localhost:4000/health', false));
  results.push(await probeUrl('OpenClaw gateway health', 'http://localhost:8089/health', false));
  results.push(await probeUrl('Open WebUI health', 'http://localhost:18789', false));
  results.push(await probeUrl('Ollama model registry', 'http://localhost:11434/api/tags', false));

  if (seedDemo) {
    results.push(checkSourceMarker('Demo environment orchestrator', 'src/services/demo/demoEnvironment.ts', [
      'seedDemoEnvironment',
      'verifyDemoEnvironment',
      'resetDemoEnvironment',
      'DEMO_DEVICES',
    ]));
    results.push(checkSourceMarker('Products seed contract', 'src/services/productsService.ts', [
      'seedFirstGarageCoop',
      'seedDemoProducts',
      'FIRST_COOP_DEVICE_ID',
    ]));
    results.push(checkSourceMarker('Property layout device placement', 'src/components/property/propertyLayoutStore.ts', [
      'deviceId',
      'productId',
      'PROPERTY_LAYOUT_STORAGE_KEY',
    ]));
  }

  return results;
}

const allResults = [];
for (let iteration = 1; iteration <= iterations; iteration += 1) {
  const results = await runIteration(iteration);
  allResults.push(...results.map((result) => ({ ...result, iteration })));
  const requiredFailed = results.some((result) => result.required && !result.ok);
  if (requiredFailed) {
    const repair = runAutoRepair(results);
    if (repair) {
      allResults.push({
        kind: 'local-llm-repair',
        name: 'Local LLM auto repair',
        required: true,
        ok: repair.ok,
        status: repair.ok ? 0 : 1,
        output: repair.output,
        iteration,
      });
      if (repair.ok && iteration < iterations) continue;
    }
    break;
  }
}

const repairNotes = await runRepairNotes(allResults);
const requiredFailed = allResults.some((result) => result.required && !result.ok);
const warnings = allResults.filter((result) => !result.ok && !result.required).length;
const status = requiredFailed ? 'blocked' : warnings > 0 ? 'ready-with-warnings' : 'ready';
const reportPath = resolve(appRoot, 'docs', 'autonomous-loop-report.md');

const report = [
  '# TenderCells Autonomous Loop Report',
  '',
  `Generated: ${startedAt.toISOString()}`,
  `Status: ${status}`,
  `Iterations: ${iterations}`,
  `Route base: ${routeBase}`,
  `Seed demo checks: ${seedDemo ? 'yes' : 'no'}`,
  `Auto repair: ${autoRepairEnabled ? 'yes' : 'no'}`,
  `Auto repair files: ${repairFiles.length > 0 ? repairFiles.join(', ') : 'none'}`,
  '',
  '## Checks',
  '',
  ...allResults.flatMap((result) => [
    `### ${result.ok ? 'PASS' : result.required ? 'FAIL' : 'WARN'} - ${result.name}`,
    '',
    `Iteration: ${result.iteration}`,
    `Kind: ${result.kind}`,
    `Required: ${result.required ? 'yes' : 'no'}`,
    result.url ? `URL: ${result.url}` : '',
    result.file ? `File: ${result.file}` : '',
    '',
    result.output ? ['```text', String(result.output).slice(-4000), '```'].join('\n') : 'No output.',
    '',
  ]),
  '## Local LLM / OpenClaw Notes',
  '',
  'OpenClaw gateway is probed as a local autonomous service. Direct Ollama is used for repair notes because it currently exposes a reliable local API for code-review tasks.',
  '',
  repairNotes || 'No repair notes generated.',
  '',
  '## Next Loop',
  '',
  '1. Fix the first required failure.',
  '2. Restart or repair any warned local services needed for browser testing.',
  '3. Re-run `npm run autonomous:loop -- --seed-demo --repair-notes`.',
  '4. Add Playwright browser seeding once the route probes are stable.',
  '',
].filter((line) => line !== undefined).join('\n');

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, report, 'utf8');
console.log(`\nAutonomous loop report: ${reportPath}`);
process.exit(requiredFailed ? 1 : 0);

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = resolve(process.cwd(), '../../../..');
const appRoot = process.cwd();
const docsDir = resolve(appRoot, 'docs/local-llm');
const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
const defaultCoderModel = process.env.OLLAMA_CODER_MODEL || 'qwen2.5-coder:7b';
const defaultDocsModel = process.env.OLLAMA_DOCS_MODEL || 'llama3.2:latest';
const timeoutMs = Number(process.env.LOCAL_LLM_TIMEOUT_MS || 240000);
const maxChars = Number(process.env.LOCAL_LLM_MAX_CHARS || 22000);
const numPredict = Number(process.env.LOCAL_LLM_NUM_PREDICT || 1200);

const [, , command = 'help', ...args] = process.argv;

function argValue(name, fallback = undefined) {
  const flag = `--${name}`;
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

function argList(name) {
  const flag = `--${name}`;
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === flag && args[i + 1]) values.push(args[i + 1]);
  }
  return values;
}

function trailingArgText() {
  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      i += 1;
      continue;
    }
    positional.push(arg);
  }
  return positional.join(' ');
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

async function ensureDocsDir() {
  await mkdir(docsDir, { recursive: true });
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function truncate(text, limit = maxChars) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n\n[truncated ${text.length - limit} chars]`;
}

async function ollamaGenerate({ model, prompt, reportName }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let responseText = '';
  let aborted = false;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature: 0.2,
          num_ctx: 32768,
          num_predict: numPredict,
        },
        keep_alive: process.env.OLLAMA_KEEP_ALIVE || '30m',
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama returned ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line);
        if (event.response) {
          process.stdout.write(event.response);
          responseText += event.response;
        }
        if (event.error) throw new Error(event.error);
      }
    }

    if (buffer.trim()) {
      const event = JSON.parse(buffer);
      if (event.response) {
        process.stdout.write(event.response);
        responseText += event.response;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError' && responseText) {
      aborted = true;
      console.warn('\n\nLocal LLM timed out; saving partial response.');
    } else {
      throw error;
    }
  } finally {
    clearTimeout(timer);
  }

  await ensureDocsDir();
  const reportPath = resolve(docsDir, `${timestampSlug()}-${reportName}.md`);
  await writeFile(
    reportPath,
    `# Local LLM Report\n\n- Model: \`${model}\`\n- Command: \`${command}\`\n- Generated: ${new Date().toISOString()}\n- Partial: ${aborted ? 'yes' : 'no'}\n\n${responseText}\n`,
    'utf8'
  );
  console.log(`\n\nSaved report: ${relative(repoRoot, reportPath)}`);
  return responseText;
}

async function readTargetFiles(files) {
  const chunks = [];
  for (const file of files) {
    const path = resolve(appRoot, file);
    const text = await readFile(path, 'utf8');
    chunks.push(`--- ${file} ---\n${truncate(text)}`);
  }
  return chunks.join('\n\n');
}

function runCommand(cmd, cmdArgs, cwd = appRoot) {
  return new Promise((resolvePromise) => {
    const invocation = commandInvocation(cmd, cmdArgs);
    const child = spawn(invocation.command, invocation.args, { cwd, shell: false });
    let output = '';
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(text);
    });
    child.on('close', (code) => resolvePromise({ code, output }));
  });
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

function parseCommandLine(commandLine) {
  const parts = [];
  const pattern = /"([^"]*)"|'([^']*)'|[^\s]+/g;
  let match;
  while ((match = pattern.exec(commandLine)) !== null) {
    parts.push(match[1] ?? match[2] ?? match[0]);
  }
  return parts;
}

function extractUnifiedDiff(text) {
  const fenceMatch = text.match(/```(?:diff|patch)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : text;
  const diffStart = candidate.search(/(^|\n)(diff --git|---\s+\S+)/);
  if (diffStart === -1) return '';
  return candidate.slice(diffStart).trim();
}

function normalizeUnifiedDiff(diff) {
  return diff
    .split(/\r?\n/)
    .map((line) => {
      if (line.startsWith('--- ') || line.startsWith('+++ ')) {
        return line.replace(/\s+---\s*$/, '').replace(/\s+\+\+\s*$/, '');
      }
      return line;
    })
    .join('\n')
    .trim();
}

async function savePatch(responseText, label = 'task') {
  const diff = normalizeUnifiedDiff(extractUnifiedDiff(responseText));
  if (!diff) return null;
  const patchDir = resolve(docsDir, 'patches');
  await mkdir(patchDir, { recursive: true });
  const patchPath = resolve(patchDir, `${timestampSlug()}-${label}.patch`);
  await writeFile(patchPath, `${diff}\n`, 'utf8');
  return patchPath;
}

async function warmup() {
  const model = argValue('model', defaultCoderModel);
  await ollamaGenerate({
    model,
    reportName: 'warmup',
    prompt: 'Reply with exactly one short sentence confirming you are ready for TenderCells local code review.',
  });
}

async function promptCommand() {
  const model = argValue('model', defaultDocsModel);
  const prompt = argValue('text') || trailingArgText();
  if (!prompt.trim()) {
    throw new Error('Provide a prompt with --text "..." or trailing text.');
  }
  await ollamaGenerate({ model, prompt, reportName: 'prompt' });
}

async function review() {
  const model = argValue('model', defaultCoderModel);
  const files = argList('file');
  if (files.length === 0) {
    throw new Error('Provide at least one --file path relative to the app root.');
  }
  const focus = argValue('focus', 'bugs, runtime risks, missing tests, and small repair suggestions');
  const fileContext = await readTargetFiles(files);
  const prompt = `You are reviewing TenderCells app code. Focus on ${focus}.

Return:
1. Critical runtime risks
2. Small concrete fixes
3. Tests or manual checks

Do not rewrite whole files. Be concise and specific.

${fileContext}`;

  await ollamaGenerate({ model, prompt, reportName: 'review' });
}

async function repairNotes() {
  const model = argValue('model', defaultCoderModel);
  const shouldBuild = hasFlag('build');
  let buildOutput = argValue('log', '');

  if (shouldBuild) {
    const result = await runCommand('npm.cmd', ['run', 'build']);
    buildOutput = result.output;
  }

  const files = argList('file');
  const fileContext = files.length > 0 ? await readTargetFiles(files) : '';
  const prompt = `TenderCells repair notes request.

Build or error output:
${truncate(buildOutput || 'No build log provided.', 12000)}

Relevant source:
${fileContext || 'No source files provided.'}

Return likely root cause, safest fix order, and verification checklist.`;

  await ollamaGenerate({ model, prompt, reportName: 'repair-notes' });
}

async function task() {
  const model = argValue('model', defaultCoderModel);
  const files = argList('file');
  const goal = argValue('goal') || argValue('text') || trailingArgText();
  const mode = argValue('mode', 'diff');
  const shouldApply = hasFlag('apply');

  if (!goal.trim()) {
    throw new Error('Provide a coding goal with --goal "..."');
  }
  if (files.length === 0) {
    throw new Error('Provide at least one --file path relative to the app root.');
  }

  const fileContext = await readTargetFiles(files);
  const prompt = mode === 'plan'
    ? `You are a local coding assistant for TenderCells. Make a concrete patch plan only.

Goal:
${goal}

Allowed files:
${files.join('\n')}

Return:
1. Files to edit
2. Exact changes
3. Verification commands

Source:
${fileContext}`
    : `You are a local coding assistant for TenderCells. Produce a small, reviewable unified diff.

Goal:
${goal}

Rules:
- Only edit the allowed files listed below.
- Return only a unified diff/patch. No markdown prose.
- Use paths relative to the app root, for example --- src/components/Foo.tsx and +++ src/components/Foo.tsx.
- Keep the change minimal.
- Keep the patch under 80 changed lines.
- Do not invent new dependencies.
- Preserve existing style.
- If the task is too large, return a tiny patch that adds one useful helper or testable improvement.

Allowed files:
${files.join('\n')}

Source:
${fileContext}`;

  const responseText = await ollamaGenerate({ model, prompt, reportName: `task-${mode}` });

  if (mode === 'plan') return;

  const patchPath = await savePatch(responseText, 'task');
  if (!patchPath) {
    console.log('\nNo unified diff detected in model output. Treat the saved report as notes.');
    return;
  }

  console.log(`Patch candidate: ${relative(repoRoot, patchPath)}`);

  const check = await runCommand('git', ['apply', '--check', patchPath], appRoot);
  if (check.code !== 0) {
    console.log('\nPatch did not pass git apply --check. Leaving it saved for manual review.');
    return;
  }

  console.log('Patch passes git apply --check.');
  if (shouldApply) {
    const apply = await runCommand('git', ['apply', patchPath], appRoot);
    if (apply.code !== 0) {
      throw new Error('Patch passed check but failed to apply.');
    }
    console.log('Patch applied. Run the build before committing.');
  } else {
    console.log('Run again with --apply to apply this patch after review.');
  }
}

async function repairApply() {
  const model = argValue('model', defaultCoderModel);
  const files = argList('file');
  const goal = argValue('goal') || argValue('text') || trailingArgText();
  const verify = argValue('verify', 'npm.cmd run build');

  if (!goal.trim()) {
    throw new Error('Provide a repair goal with --goal "..."');
  }
  if (files.length === 0) {
    throw new Error('Provide at least one --file path relative to the app root.');
  }

  const before = await runCommand('git', ['diff', '--', ...files], appRoot);
  const patchPath = await taskWithArgs({
    model,
    files,
    goal: `${goal}\n\nThis is an autonomous repair attempt. Make the smallest patch that can pass verification.`,
    shouldApply: true,
  });

  const verification = parseCommandLine(verify);
  const verifyResult = await runCommand(verification[0], verification.slice(1), appRoot);
  if (verifyResult.code === 0) {
    console.log('Autonomous repair applied and verification passed.');
    return;
  }

  console.log('Verification failed after autonomous repair; reverting only the local model patch for the allowed files.');
  await runCommand('git', ['apply', '--reverse', patchPath], appRoot);
  console.log(before.output ? 'Saved pre-repair diff in command output above for manual review.' : 'No pre-existing diff was detected for the target files.');
  throw new Error('Autonomous repair verification failed.');
}

async function taskWithArgs({ model, files, goal, shouldApply }) {
  const fileContext = await readTargetFiles(files);
  const prompt = `You are a local coding assistant for TenderCells. Produce a small, reviewable unified diff.

Goal:
${goal}

Rules:
- Only edit the allowed files listed below.
- Return only a unified diff/patch. No markdown prose.
- Use paths relative to the app root, for example --- src/components/Foo.tsx and +++ src/components/Foo.tsx.
- Keep the change minimal.
- Keep the patch under 80 changed lines.
- Do not invent new dependencies.
- Preserve existing style.
- If the task is too large, return a tiny patch that fixes the first concrete issue.

Allowed files:
${files.join('\n')}

Source:
${fileContext}`;

  const responseText = await ollamaGenerate({ model, prompt, reportName: 'repair-apply' });
  const patchPath = await savePatch(responseText, 'repair-apply');
  if (!patchPath) {
    throw new Error('No unified diff detected in local model output.');
  }

  console.log(`Patch candidate: ${relative(repoRoot, patchPath)}`);
  const check = await runCommand('git', ['apply', '--check', patchPath], appRoot);
  if (check.code !== 0) {
    throw new Error('Local model patch did not pass git apply --check.');
  }
  console.log('Patch passes git apply --check.');

  if (shouldApply) {
    const apply = await runCommand('git', ['apply', patchPath], appRoot);
    if (apply.code !== 0) throw new Error('Patch passed check but failed to apply.');
    console.log('Patch applied.');
  }

  return patchPath;
}

async function help() {
  console.log(`TenderCells local LLM helper

Commands:
  npm run llm:warmup
  npm run llm:prompt -- --text "Summarize next docs tasks"
  npm run llm:review -- --file src/components/viewport/Viewport3D.tsx --focus "2D/3D runtime controls"
  npm run llm:repair-notes -- --build --file src/components/viewport/Viewport3D.tsx
  npm run llm:task -- --goal "Add accessible labels to viewport mode controls" --file src/components/viewport/Viewport3D.tsx
  npm run llm:task -- --apply --goal "..." --file src/components/foo.tsx
  npm run llm:repair-apply -- --goal "Fix the first build error" --file src/components/foo.tsx --verify "npm.cmd run build"

Environment:
  OLLAMA_URL=${ollamaUrl}
  OLLAMA_CODER_MODEL=${defaultCoderModel}
  OLLAMA_DOCS_MODEL=${defaultDocsModel}
  LOCAL_LLM_TIMEOUT_MS=${timeoutMs}
  LOCAL_LLM_NUM_PREDICT=${numPredict}
`);
}

const commands = { warmup, prompt: promptCommand, review, 'repair-notes': repairNotes, task, 'repair-apply': repairApply, help };

try {
  await (commands[command] || help)();
} catch (error) {
  console.error(`\nLocal LLM helper failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

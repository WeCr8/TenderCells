# Local LLM Workflow

TenderCells can use the local Ollama/Open WebUI stack as a bounded engineering assistant.

## Commands

```bash
npm run llm:warmup
npm run llm:review -- --file src/components/viewport/Viewport3D.tsx --focus "2D and 3D viewport runtime controls"
npm run llm:repair-notes -- --build --file src/components/viewport/Viewport3D.tsx
npm run llm:prompt -- --text "Draft next product documentation tasks"
npm run llm:task -- --goal "Add accessible labels to viewport mode controls" --file src/components/viewport/Viewport3D.tsx
npm run llm:repair-apply -- --goal "Fix the first build error" --file src/components/viewport/Viewport3D.tsx --verify "npm.cmd run build"
npm run autonomous:loop -- --seed-demo
$env:LOCAL_LLM_REPAIR='1'; npm run autonomous:loop -- --seed-demo --repair-notes
$env:LOCAL_LLM_AUTO_REPAIR='1'; npm run autonomous:loop -- --iterations 2 --repair-file src/components/viewport/Viewport3D.tsx
```

Reports are written to `docs/local-llm/`.
Patch candidates are written to `docs/local-llm/patches/`.
Autonomous loop reports are written to `docs/autonomous-loop-report.md`.

## Model Defaults

- Code: `qwen2.5-coder:7b`
- Docs/planning: `llama3.2:latest`
- Ollama URL: `http://localhost:11434`

Override with:

```bash
$env:OLLAMA_CODER_MODEL='llama3:8b'; npm run llm:review -- --file src/App.tsx
$env:LOCAL_LLM_TIMEOUT_MS='300000'; npm run llm:repair-notes -- --build
```

## Rules

- Give the local model one or two files at a time.
- Ask for root causes and small fixes, not whole-file rewrites.
- Treat reports as review notes; humans still apply patches.
- Use `npm run llm:task` for real coding tasks. It asks for a unified diff and runs `git apply --check`.
- Add `--apply` only after reviewing the saved patch candidate.
- Use `npm run llm:repair-apply` when a local model should actually apply a bounded repair and verify it.
- `llm:repair-apply` reverses the model patch if verification fails, leaving unrelated work alone.
- Run the build after every repair.

## Autonomous Loop

`npm run autonomous:loop` is a bounded health and repair runner. It builds the app, probes the local dev routes on `http://localhost:5173`, checks the Express API on `:4000`, checks OpenClaw, Open WebUI, and Ollama, then writes a report.

Use `--seed-demo` to verify that the demo environment source contracts still exist:

- `seedDemoEnvironment`, `verifyDemoEnvironment`, and `resetDemoEnvironment`
- the first garage coop product seed for `ct_001`
- property layout item links for `deviceId` and `productId`

Use `LOCAL_LLM_REPAIR=1` or `--repair-notes` when you want Ollama to summarize failures into a repair order. Use `LOCAL_LLM_AUTO_REPAIR=1` or `--auto-repair` when you want it to generate, apply, and verify a patch after a required failure. Auto-repair requires explicit file allowlisting:

```bash
npm run autonomous:loop -- --iterations 2 --seed-demo --repair-notes
npm run autonomous:loop -- --iterations 2 --auto-repair --repair-file src/components/viewport/Viewport3D.tsx
```

OpenClaw is checked through its gateway health endpoint. Direct Ollama remains the primary code-review path until OpenClaw's container-side Ollama endpoint is configured to reach the running Ollama service.

## Local-First Repair Policy

TenderCells should prefer local models for ordinary repair work:

1. Run build, smoke, or route checks.
2. If a required check fails, allowlist the smallest likely file set.
3. Run `llm:repair-apply` or `autonomous:loop --auto-repair`.
4. Let the local model generate and apply a patch.
5. Verify with `npm.cmd run build` or the relevant command.
6. If verification fails, the script reverses only the model patch.
7. Escalate to a paid/cloud model only after local models fail, the task spans too many files, or safety-critical robotics logic needs stronger review.

For robotics and hardware code, local auto-repair should stay limited to simulation, UI, schema, test, docs, and adapter-layer changes until a human reviews physical motion, E-stop, limit-switch, motor-current, door/latch, and animal-safety behavior.

import { App } from '@modelcontextprotocol/ext-apps/app-with-deps';

interface BuilderStep {
  id?: string;
  type?: string;
  action?: string;
  instruction?: string;
  details?: string[];
  look_for?: string;
  watch_out?: string;
  safety?: string[];
  checkpoint?: boolean;
  source_refs?: string[];
  parts?: Array<{ asset_id: string; qty: number; note?: string }>;
  image?: { step_asset?: string; base_asset?: string; view?: string };
  concept?: { title: string; text: string };
  stage?: string;
}

interface StageSummary { id: string | null; title: string | null; stepIds: string[] }
interface BuilderResult {
  kind: 'mission' | 'project';
  id: string;
  title: string;
  milestone?: string | null;
  phase?: string | null;
  depth?: string;
  sourceFile?: string;
  sourceDocs?: string[];
  source_refs?: string[];
  concept?: boolean;
  conceptNote?: string | null;
  estimatedMinutes?: number | null;
  parts?: Array<{ asset_id: string; qty: number; note?: string }>;
  stages?: StageSummary[];
  step?: BuilderStep;
  stepNumber?: number;
  totalSteps?: number;
  previousStepId?: string | null;
  nextStepId?: string | null;
}

const root = document.getElementById('root')!;
const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);
const app = new App({ name: 'tendercells-builder-card', version: '0.4.0' });
let current: BuilderResult | undefined;
let errorMessage: string | undefined;
let busy = false;

function readResult(value: unknown): BuilderResult {
  if (typeof value !== 'object' || value === null) throw new Error('Builder tool returned no structured content.');
  const data = value as Partial<BuilderResult>;
  if ((data.kind !== 'mission' && data.kind !== 'project') || typeof data.id !== 'string' || typeof data.title !== 'string') {
    throw new Error('Builder tool returned an unexpected result shape.');
  }
  return data as BuilderResult;
}

function list(items: string[] | undefined, emptyText: string) {
  return items?.length
    ? `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
    : `<p class="muted">${esc(emptyText)}</p>`;
}

function render(data = current) {
  if (!data) {
    root.innerHTML = `<p class="muted">Loading Builder content…</p>${errorMessage ? `<p class="error">${esc(errorMessage)}</p>` : ''}`;
    return;
  }

  const step = data.step;
  const concept = data.concept
    ? `<aside class="warning"><strong>CONCEPT ONLY</strong><p>${esc(data.conceptNote ?? 'This preview is not verified for construction.')}</p><p>Do not use concept art as an authoritative wiring or pinout source. Follow verified project documentation.</p></aside>`
    : '';
  const safety = step
    ? `<section class="section"><h3>Safety gates</h3>${list(step.safety, 'No safety gates are listed for this step. Follow the complete source instructions.')}</section>`
    : '';
  const checkpoint = step?.checkpoint
    ? `<aside class="checkpoint"><strong>Checkpoint — stop here</strong><p>Verify this step before moving on.</p></aside>`
    : '';
  const stageSummary = data.stages?.length
    ? `<section class="section"><h3>Stages</h3><ul>${data.stages.map((stage) => `<li>${esc(stage.title ?? stage.id ?? 'Stage')} · ${stage.stepIds.length} steps</li>`).join('')}</ul></section>`
    : '';
  const parts = data.parts?.length
    ? `<section class="section"><h3>Parts</h3><ul>${data.parts.map((part) => `<li><code>${esc(part.asset_id)}</code> × ${esc(part.qty)}${part.note ? ` — ${esc(part.note)}` : ''}</li>`).join('')}</ul></section>`
    : '';
  const sourceRefs = [
    ...(data.sourceFile ? [`Builder source: ${data.sourceFile}`] : []),
    ...(data.sourceDocs ?? []).map((source) => `Project source: ${source}`),
    ...(step?.source_refs ?? []).map((source) => `Step source: ${source}`),
  ];
  const stepBody = step
    ? `<article class="step">
        <div class="step-heading"><span class="pill">${esc(step.type ?? 'step')}</span>${step.stage ? `<span class="muted">${esc(step.stage)}</span>` : ''}<span class="progress">Step ${esc(data.stepNumber ?? 1)} of ${esc(data.totalSteps ?? 1)}</span></div>
        <label class="depth">Learner depth
          <select id="depth" ${busy ? 'disabled' : ''}>
            ${(['young', 'beginner', 'advanced', 'teacher'] as const).map((depth) => `<option value="${depth}" ${data.depth === depth ? 'selected' : ''}>${depth}</option>`).join('')}
          </select>
        </label>
        <h2>${esc(step.action ?? 'Builder step')}: ${esc(step.id)}</h2>
        <p class="instruction">${esc(step.instruction)}</p>
        ${step.concept ? `<aside class="warning"><strong>${esc(step.concept.title)}</strong><p>${esc(step.concept.text)}</p></aside>` : ''}
        ${checkpoint}${safety}
        ${step.details?.length ? `<section class="section"><h3>Do this</h3><ol>${step.details.map((detail) => `<li>${esc(detail)}</li>`).join('')}</ol></section>` : ''}
        ${step.look_for ? `<p class="expected"><strong>Look for:</strong> ${esc(step.look_for)}</p>` : ''}
        ${step.watch_out ? `<p class="caution"><strong>Watch out:</strong> ${esc(step.watch_out)}</p>` : ''}
        ${step.image?.step_asset ? `<p class="muted asset">Step image: <code>${esc(step.image.step_asset)}</code></p>` : ''}
        ${step.parts?.length ? `<section class="section"><h3>Step parts</h3><ul>${step.parts.map((part) => `<li><code>${esc(part.asset_id)}</code> × ${esc(part.qty)}${part.note ? ` — ${esc(part.note)}` : ''}</li>`).join('')}</ul></section>` : ''}
      </article>`
    : `<p class="muted">Choose a step with get_builder_step to read its instructions and safety gates.</p>`;
  const navigation = step && data.stepNumber !== undefined
    ? `<nav aria-label="Builder step navigation">
        <button type="button" data-step="${esc(data.previousStepId)}" ${!data.previousStepId || busy ? 'disabled' : ''}>Previous step</button>
        <button type="button" data-step="${esc(data.nextStepId)}" ${!data.nextStepId || busy ? 'disabled' : ''}>Next step</button>
      </nav>`
    : '';
  root.innerHTML = `
    <header><div><p class="eyebrow">Tender Cells · ${data.kind === 'mission' ? 'Mission' : 'Builder project'}</p><h1>${esc(data.title)}</h1><p class="muted">${esc(data.phase ?? '')}${data.milestone ? ` · ${esc(data.milestone)}` : ''}</p></div></header>
    ${concept}${stepBody}${stageSummary}${parts}
    ${navigation}
    ${sourceRefs.length ? `<details class="references" open><summary>Source references</summary><ul>${sourceRefs.map((source) => `<li><code>${esc(source)}</code></li>`).join('')}</ul></details>` : ''}
    ${errorMessage ? `<p class="error" role="alert">${esc(errorMessage)}</p>` : ''}
    <p class="muted foot">Read-only learning content. This card cannot control hardware.</p>`;
  for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-step]')) {
    button.addEventListener('click', () => { void navigate(button.dataset.step); });
  }
  root.querySelector<HTMLSelectElement>('#depth')?.addEventListener('change', (event) => {
    const selected = (event.currentTarget as HTMLSelectElement).value;
    if (step?.id) void navigate(step.id, selected);
  });
}

async function navigate(stepId: string | undefined, depth = current?.depth ?? 'beginner') {
  if (!current || !stepId || busy) return;
  busy = true;
  errorMessage = undefined;
  render();
  const isMission = current.kind === 'mission';
  const toolName = isMission ? 'get_mission' : 'get_builder_step';
  const idName = isMission ? 'missionId' : 'projectId';
  try {
    const response = await app.callServerTool({
      name: toolName,
      arguments: { [idName]: current.id, stepId, depth },
    });
    if (response.isError) {
      throw new Error(response.content.map((item) => item.type === 'text' ? item.text : '').filter(Boolean).join('\n') || 'Builder navigation failed.');
    }
    current = readResult(response.structuredContent);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  } finally {
    busy = false;
    render();
  }
}

const applyTheme = () => {
  document.documentElement.dataset.theme = app.getHostContext()?.theme === 'light' ? 'light' : 'dark';
};
app.ontoolresult = (payload) => {
  try {
    current = readResult(payload.structuredContent);
    errorMessage = undefined;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }
  render();
};
app.onhostcontextchanged = applyTheme;
render();
void app.connect().then(applyTheme).catch((error: unknown) => {
  errorMessage = `Builder card could not connect: ${error instanceof Error ? error.message : String(error)}`;
  render();
});

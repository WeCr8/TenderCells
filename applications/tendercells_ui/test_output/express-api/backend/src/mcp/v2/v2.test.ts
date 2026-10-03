import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { createTenderCellsMcp } from '../server.js';
import { demoHub } from '../demoHub.js';
import { missionEntries, projectEntries, steps } from './builderContent.js';
import { oneStep } from './builderContent.js';
import type { BuilderEntry } from './contentTypes.js';
import { BUILDER_CARD_URI } from './builderTools.js';
import { V2_TOOLS } from './registerV2.js';

async function connect(mode: 'local' | 'hosted' | 'hosted-demo' = 'local') {
  const server = createTenderCellsMcp({ hub: demoHub(), mode });
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'v2-test', version: '1' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

function structured<T>(result: unknown) {
  assert.ok(typeof result === 'object' && result !== null, 'tool returned an object');
  const content = (result as { structuredContent?: unknown }).structuredContent;
  assert.ok(typeof content === 'object' && content !== null, 'tool returned structured content');
  return content as T;
}

test('v2 customer tools are read-only and available in local and hosted modes', async () => {
  for (const mode of ['local', 'hosted', 'hosted-demo'] as const) {
    const client = await connect(mode);
    const tools = (await client.listTools()).tools;
    const byName = new Map(tools.map((tool) => [tool.name, tool]));
    for (const name of V2_TOOLS) {
      assert.equal(byName.get(name)?.annotations?.readOnlyHint, true, `${mode}: ${name}`);
    }
    if (mode !== 'local') {
      for (const name of ['emergency_stop', 'request_action', 'confirm_action']) {
        assert.equal(byName.has(name), false, `hosted connector must not expose ${name}`);
      }
    }
  }
});

test('mission and project lists are the existing Builder source records', async () => {
  const client = await connect();
  const missionsResult = structured<{ missions: Array<{ id: string; sourceFile: string }> }>(
    await client.callTool({ name: 'list_missions', arguments: {} }),
  );
  const projectsResult = structured<{ projects: Array<{ id: string; sourceFile: string }> }>(
    await client.callTool({ name: 'list_builder_projects', arguments: {} }),
  );

  assert.equal(missionsResult.missions.length, 6);
  assert.deepEqual(missionsResult.missions.map((item) => item.id), missionEntries.map((item) => item.data.id));
  assert.ok(missionsResult.missions.every((item) => item.sourceFile.startsWith('applications/')));
  assert.equal(projectsResult.projects.length, 3);
  assert.deepEqual(projectsResult.projects.map((item) => item.id), projectEntries.map((item) => item.data.id));
  assert.ok(projectsResult.projects.every((item) => item.sourceFile.startsWith('applications/')));
});

test('mission navigation returns one source-backed step and rejects invalid selections', async () => {
  const client = await connect();
  const mission = missionEntries.find((entry) => steps(entry).length > 1)!;
  const first = structured<{
    kind: string; id: string; sourceFile: string; stepNumber: number; totalSteps: number;
    step: { id: string; action?: string; safety?: string[]; checkpoint?: boolean; source_refs?: string[] };
    previousStepId: string | null; nextStepId: string | null;
  }>(await client.callTool({ name: 'get_mission', arguments: { missionId: mission.data.id } }));
  assert.equal(first.kind, 'mission');
  assert.equal(first.id, mission.data.id);
  assert.equal(first.sourceFile, mission.sourceFile);
  assert.equal(first.stepNumber, 1);
  assert.equal(first.totalSteps, steps(mission).length);
  assert.equal(first.step.id, steps(mission)[0].id);
  assert.equal(first.previousStepId, null);
  assert.equal(first.nextStepId, steps(mission)[1].id);
  assert.deepEqual(first.step.safety, steps(mission)[0].safety ?? []);
  assert.deepEqual(first.step.source_refs, steps(mission)[0].source_refs ?? []);

  const next = structured<{ stepNumber: number; step: { id: string }; previousStepId: string | null }>(
    await client.callTool({ name: 'get_mission', arguments: { missionId: mission.data.id, stepId: first.nextStepId } }),
  );
  assert.equal(next.stepNumber, 2);
  assert.equal(next.step.id, steps(mission)[1].id);
  assert.equal(next.previousStepId, first.step.id);
  assert.equal((await client.callTool({ name: 'get_mission', arguments: { missionId: 'missing' } })).isError, true);
  assert.equal((await client.callTool({
    name: 'get_mission',
    arguments: { missionId: mission.data.id, stepId: first.step.id, stepNumber: 1 },
  })).isError, true);
});

test('project metadata preserves references and concept-only status', async () => {
  const client = await connect();
  const source = projectEntries.find((entry) => entry.data.id === 'chicken-tender-door-book')!;
  const project = structured<{
    kind: string; id: string; concept: boolean; conceptNote: string; sourceFile: string;
    sourceDocs: string[]; parts: unknown[]; stages: Array<{ stepIds: string[] }>;
  }>(await client.callTool({ name: 'get_builder_project', arguments: { projectId: source.data.id } }));
  assert.equal(project.kind, 'project');
  assert.equal(project.concept, true);
  assert.equal(project.conceptNote, source.data.concept_note);
  assert.equal(project.sourceFile, source.sourceFile);
  assert.deepEqual(project.sourceDocs, source.data.source_docs);
  assert.deepEqual(project.parts, source.data.parts_list ?? []);
  assert.equal(project.stages.reduce((sum, stage) => sum + stage.stepIds.length, 0), steps(source).length);
});

test('project step preserves safety, checkpoint, sources and learner-layer selection', async () => {
  const client = await connect();
  const project = projectEntries.find((entry) => steps(entry).some((step) => step.checkpoint && step.safety?.length))!;
  const sourceStep = steps(project).find((step) => step.checkpoint && step.safety?.length)!;
  const result = structured<{
    kind: string; id: string; sourceFile: string; depth: string; stepNumber: number;
    step: { id: string; safety?: string[]; checkpoint?: boolean; source_refs?: string[]; image?: unknown };
  }>(await client.callTool({
    name: 'get_builder_step',
    arguments: { projectId: project.data.id, stepId: sourceStep.id, depth: 'teacher' },
  }));
  assert.equal(result.kind, 'project');
  assert.equal(result.id, project.data.id);
  assert.equal(result.sourceFile, project.sourceFile);
  assert.equal(result.depth, 'teacher');
  assert.equal(result.stepNumber, steps(project).findIndex((step) => step.id === sourceStep.id) + 1);
  assert.equal(result.step.id, sourceStep.id);
  assert.deepEqual(result.step.safety, sourceStep.safety);
  assert.equal(result.step.checkpoint, true);
  assert.deepEqual(result.step.source_refs, sourceStep.source_refs ?? []);
  assert.deepEqual(result.step.image, sourceStep.image);
});

test('learner-specific authored wording changes only the instruction, not step identity/action', () => {
  const entry: BuilderEntry = {
    sourceFile: 'applications/test.mission.json',
    data: {
      id: 'mission.depth-test',
      title: 'Depth test',
      steps: [{
        id: 's001',
        action: 'Observe',
        instruction: 'Default instruction',
        instruction_layers: { young: 'Young instruction', teacher: 'Teacher instruction' },
      }],
    },
  };
  const young = oneStep(entry, undefined, 1, 'young', 'mission');
  const teacher = oneStep(entry, undefined, 1, 'teacher', 'mission');
  assert.equal(young.step.id, teacher.step.id);
  assert.equal(young.step.action, teacher.step.action);
  assert.equal(young.step.instruction, 'Young instruction');
  assert.equal(teacher.step.instruction, 'Teacher instruction');
});

test('Builder app tools link to a self-contained card with no hardware action controls', async () => {
  const client = await connect();
  const tools = (await client.listTools()).tools;
  for (const name of ['get_mission', 'get_builder_project', 'get_builder_step']) {
    const tool = tools.find((candidate) => candidate.name === name);
    assert.ok(tool, `${name} exists`);
    assert.equal((tool._meta as { ui?: { resourceUri?: string } }).ui?.resourceUri, BUILDER_CARD_URI);
  }

  const resource = await client.readResource({ uri: BUILDER_CARD_URI });
  const card = resource.contents[0] as { mimeType?: string; text?: string };
  assert.equal(card.mimeType, RESOURCE_MIME_TYPE);
  assert.match(String(card.text), /^<!doctype html>/);
  assert.match(String(card.text), /CONCEPT ONLY/);
  assert.match(String(card.text), /Safety gates/);
  assert.match(String(card.text), /Checkpoint/);
  assert.match(String(card.text), /Learner depth/);
  assert.match(String(card.text), /Previous step/);
  assert.match(String(card.text), /Source references/);
  assert.match(String(card.text), /read-only learning content/i);
  assert.doesNotMatch(String(card.text), /request_action|confirm_action|emergency_stop|set_motor|drive_robot/i);
  assert.doesNotMatch(String(card.text), /<script src=/, 'card has no external scripts');
});

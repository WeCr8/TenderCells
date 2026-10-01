// validate.ts - checks Builder content against the contract (docs/builder/schemas/*.json):
// required fields, step / cue / safety enums, unique step ids, known asset ids, and demo
// bindings that point at real events. Used by tests so broken content never ships.
import type { BuilderItem } from '../types';
import { ASSETS } from './assets';

const STEP_TYPES = new Set(['assembly', 'electronics', 'concept', 'flash', 'test', 'checkpoint', 'safety', 'mission']);
const CUE_TYPES = new Set(['arrow', 'rotate', 'target', 'path', 'correct', 'incorrect', 'measure', 'power_off', 'tool']);
const GATES = new Set(['CHILD_OK', 'SUPERVISION_RECOMMENDED', 'ADULT_REQUIRED', 'POWER_OFF_REQUIRED', 'MOTION_LOCKOUT_REQUIRED']);
const PHASES = new Set(['OBSERVE', 'DECIDE', 'AUTOMATE', 'BUILD', 'CONNECT', 'INVENT']);

/**
 * Problems in one Builder item; empty when valid.
 *
 * @param item     - Mission or project
 * @param scenarios - Known demo event ids (demo.run must be one of them)
 */
export function validateItem(item: BuilderItem, scenarios: Set<string>): string[] {
  const errs: string[] = [];
  if (!item.id || !item.title || !item.milestone) errs.push(`${item.id}: needs id, title and milestone`);
  if (!PHASES.has(item.phase)) errs.push(`${item.id}: bad phase ${item.phase}`);
  if (!item.steps.length) errs.push(`${item.id}: no steps`);
  const ids = new Set<string>();
  for (const s of item.steps) {
    const at = `${item.id} ${s.id}`;
    if (ids.has(s.id)) errs.push(`${at}: duplicate step id`);
    ids.add(s.id);
    if (!STEP_TYPES.has(s.type)) errs.push(`${at}: bad type ${s.type}`);
    if (!s.action || !s.instruction) errs.push(`${at}: needs action and instruction`);
    for (const g of s.safety ?? []) if (!GATES.has(g)) errs.push(`${at}: bad safety gate ${g}`);
    for (const c of s.image?.cues ?? []) if (!CUE_TYPES.has(c.type)) errs.push(`${at}: bad cue ${c.type}`);
    if (s.image?.base_asset && !ASSETS[s.image.base_asset]) errs.push(`${at}: unknown asset ${s.image.base_asset}`);
    if (s.image?.step_asset) errs.push(`${at}: step_asset files are not published yet - use base_asset`);
    for (const p of s.parts ?? []) {
      if (!ASSETS[p.asset_id]) errs.push(`${at}: unknown part ${p.asset_id}`);
      if (!(p.qty >= 1)) errs.push(`${at}: part qty must be ≥ 1`);
    }
    if (s.demo?.run && !scenarios.has(s.demo.run)) errs.push(`${at}: demo.run ${s.demo.run} is not a demo event`);
    if (s.demo && !s.demo.run && !s.demo.open?.startsWith('/')) errs.push(`${at}: demo needs run or an /open path`);
    if (s.instruction_layers && s.instruction_layers.beginner === undefined) errs.push(`${at}: layers need a beginner text`);
  }
  if (!item.steps.some((s) => s.checkpoint)) errs.push(`${item.id}: needs at least one checkpoint`);
  return errs;
}

// modelUrls.test.ts - robot/garden model URL checks and FarmBot server links.
import { describe, expect, it } from 'vitest';
import { modelUrlProblem, describeModelLoadError } from '../../lib/three/gltfLoader';
import { normalizeFarmBotUrl } from '../../components/garden/farmbotLinks';

describe('modelUrlProblem', () => {
  it('accepts GLB/glTF on allowed hosts', () => {
    expect(modelUrlProblem('')).toBeNull();
    expect(modelUrlProblem('https://raw.githubusercontent.com/org/robot/main/robot.glb')).toBeNull();
    expect(modelUrlProblem('https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu%2Frobot.glb?alt=media')).toBeNull();
    expect(modelUrlProblem('/assets/models/coop.gltf')).toBeNull();
  });

  it('flags formats the viewport cannot load', () => {
    expect(modelUrlProblem('assets/devices/my-waterer.usd')).toMatch(/glTF only/);
    expect(modelUrlProblem('https://raw.githubusercontent.com/org/robot/main/robot.fbx')).toMatch(/glTF only/);
  });

  it('flags hosts the site security policy blocks', () => {
    expect(modelUrlProblem('https://example.com/robot.glb')).toMatch(/cannot download models from example\.com/);
  });

  it('rejects non-http schemes', () => {
    expect(modelUrlProblem('javascript:alert(1)//x.glb')).toMatch(/https/);
  });
});

describe('describeModelLoadError', () => {
  it('turns loader errors into actionable text', () => {
    expect(describeModelLoadError(new TypeError('Failed to fetch'))).toMatch(/could not be downloaded/);
    expect(describeModelLoadError(new Error('Unexpected token < in JSON'))).toMatch(/not a valid glTF/);
  });
});

describe('normalizeFarmBotUrl', () => {
  it('defaults to https and trims trailing slashes', () => {
    expect(normalizeFarmBotUrl('my.farm.bot/')).toBe('https://my.farm.bot');
    expect(normalizeFarmBotUrl('http://192.168.1.20:3000')).toBe('http://192.168.1.20:3000');
  });

  it('assumes http for LAN servers typed without a scheme', () => {
    expect(normalizeFarmBotUrl('192.168.1.20:3000')).toBe('http://192.168.1.20:3000');
    expect(normalizeFarmBotUrl('farmbot.local')).toBe('http://farmbot.local');
    expect(normalizeFarmBotUrl('localhost:3000/')).toBe('http://localhost:3000');
  });

  it('rejects empty and non-http(s) addresses', () => {
    expect(normalizeFarmBotUrl('   ')).toBeNull();
    expect(normalizeFarmBotUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeFarmBotUrl('ftp://farm.local')).toBeNull();
  });
});

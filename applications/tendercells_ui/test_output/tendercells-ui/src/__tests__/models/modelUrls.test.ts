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

describe('hfModelUrl (Hugging Face Hub robot models)', () => {
  it('turns file pages, download links and shorthand into resolve URLs', async () => {
    const { hfModelUrl } = await import('../../lib/three/huggingFace');
    expect(hfModelUrl('https://huggingface.co/acme/farm-robots/blob/main/arms/so101.glb').url)
      .toBe('https://huggingface.co/acme/farm-robots/resolve/main/arms/so101.glb');
    expect(hfModelUrl('https://huggingface.co/datasets/acme/yard/resolve/v2/scene.gltf?download=true').url)
      .toBe('https://huggingface.co/datasets/acme/yard/resolve/v2/scene.gltf');
    expect(hfModelUrl('acme/farm-robots/so101 arm.glb')).toEqual({
      url: 'https://huggingface.co/acme/farm-robots/resolve/main/so101%20arm.glb', repo: 'acme/farm-robots', path: 'so101 arm.glb',
    });
    expect(modelUrlProblem(hfModelUrl('acme/farm-robots/so101.glb').url)).toBeNull();
  });

  it('rejects non-glTF files, traversal and other hosts', async () => {
    const { hfModelUrl } = await import('../../lib/three/huggingFace');
    expect(() => hfModelUrl('acme/robots/so101.urdf')).toThrow(/glTF only/);
    expect(() => hfModelUrl('acme/robots/../secrets/x.glb')).toThrow(/not valid/);
    expect(() => hfModelUrl('https://evil.example/acme/robots/blob/main/x.glb')).toThrow(/Hugging Face/);
    expect(() => hfModelUrl('so101.glb')).toThrow(/Hugging Face/);
  });
});

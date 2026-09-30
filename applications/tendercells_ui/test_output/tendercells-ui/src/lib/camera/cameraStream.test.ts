import { describe, expect, it } from 'vitest';
import { cameraTransform, classifyCameraStream } from './cameraStream';

describe('camera stream presentation', () => {
  it('distinguishes secure relay, local-only, and unsafe remote streams', () => {
    expect(classifyCameraStream('https://relay.example/stream/device')).toBe('secure');
    expect(classifyCameraStream('http://dev-c39fq3.local/stream')).toBe('local');
    expect(classifyCameraStream('http://192.168.1.73/stream')).toBe('local');
    expect(classifyCameraStream('http://camera.example/stream')).toBe('insecure-remote');
    expect(classifyCameraStream(undefined)).toBe('unconfigured');
  });

  it('creates deterministic rotation and flip transforms', () => {
    expect(cameraTransform(90, true, false)).toBe('rotate(90deg) scaleX(-1) scaleY(1)');
  });
});

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

  it('labels only genuinely private hosts as local', () => {
    expect(classifyCameraStream('http://10.0.0.7/stream')).toBe('local');
    expect(classifyCameraStream('http://172.20.1.2:8000/stream')).toBe('local');
    expect(classifyCameraStream('http://127.0.0.1:8000/stream')).toBe('local');
    expect(classifyCameraStream('http://localhost:8000/stream')).toBe('local');
    expect(classifyCameraStream('http://[::1]:8000/stream')).toBe('local');
    expect(classifyCameraStream('http://[fe80::1]/stream')).toBe('local');
    expect(classifyCameraStream('http://cam.garden.local/stream')).toBe('local');
    // Prefix look-alikes on public DNS must not be trusted as LAN.
    expect(classifyCameraStream('http://10.attacker.example/stream')).toBe('insecure-remote');
    expect(classifyCameraStream('http://192.168.evil.example/stream')).toBe('insecure-remote');
    expect(classifyCameraStream('http://localhost.evil.example/stream')).toBe('insecure-remote');
    expect(classifyCameraStream('http://cam.localdomain.example/stream')).toBe('insecure-remote');
    expect(classifyCameraStream('http://172.32.0.1/stream')).toBe('insecure-remote');
    expect(classifyCameraStream('http://8.8.8.8/stream')).toBe('insecure-remote');
  });

  it('creates deterministic rotation and flip transforms', () => {
    expect(cameraTransform(90, true, false)).toBe('rotate(90deg) scaleX(-1) scaleY(1)');
  });
});

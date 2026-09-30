import { describe, it, expect } from 'vitest';
import { buildBundleCameraRegistration, type BundleCameraSpec } from './cameraPackage';

const bundle: BundleCameraSpec = {
  productName: 'Chicken Tender Camera',
  model: 'ESP32-S3 Camera + Battery',
  controllerBoard: 'Seeed XIAO ESP32-S3 Sense',
  cameraModule: 'OV2640 / compatible camera',
  firmwareTarget: 'firmware/camera-node',
  enabledCapabilities: ['camera', 'wifi', 'ble', 'battery_power'],
};

describe('buildBundleCameraRegistration', () => {
  it('links the camera to its parent via mounted_on_product_id', () => {
    const result = buildBundleCameraRegistration(bundle, 'parent-123', 'tendercells-kit', ['camera', 'wifi']);
    expect(result.metadata?.mounted_on_product_id).toBe('parent-123');
  });

  it('registers as the camera-kit family, not the parent\'s family', () => {
    const result = buildBundleCameraRegistration(bundle, 'parent-123', 'tendercells-kit', ['camera', 'wifi']);
    expect(result.metadata?.product_family).toBe('camera-kit');
  });

  it('carries the bundle\'s own name/model/board, not the parent\'s', () => {
    const result = buildBundleCameraRegistration(bundle, 'parent-123', 'tendercells-kit', []);
    expect(result.product_name).toBe('Chicken Tender Camera');
    expect(result.model).toBe('ESP32-S3 Camera + Battery');
    expect(result.metadata?.controller_board).toBe('Seeed XIAO ESP32-S3 Sense');
  });

  it('de-duplicates hardware_capabilities across the sense list and the bundle\'s own', () => {
    const result = buildBundleCameraRegistration(bundle, 'parent-123', 'tendercells-kit', ['camera', 'wifi', 'gps']);
    const caps = result.metadata?.hardware_capabilities as string[];
    expect(new Set(caps).size).toBe(caps.length); // no duplicates
    expect(caps).toContain('camera');
    expect(caps).toContain('gps'); // from senseCapabilities
    expect(caps).toContain('battery_power'); // from the bundle's own enabledCapabilities
  });

  it('keeps enabled_capabilities as exactly what the bundle specified (not the full sense superset)', () => {
    const result = buildBundleCameraRegistration(bundle, 'parent-123', 'tendercells-kit', ['camera', 'wifi', 'gps', 'microphone']);
    expect(result.metadata?.enabled_capabilities).toEqual(bundle.enabledCapabilities);
  });

  it('propagates the caller\'s buildSource', () => {
    const result = buildBundleCameraRegistration(bundle, 'parent-123', 'open-source-diy', []);
    expect(result.metadata?.build_source).toBe('open-source-diy');
  });
});

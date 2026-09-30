import { describe, expect, it } from 'vitest';
import { safeDemoNext } from '../../lib/demo/demoNext';

describe('demo ?next= deep links', () => {
  it('opens known OS pages, including sub-paths and simple queries', () => {
    expect(safeDemoNext('/weed-patrol')).toBe('/weed-patrol');
    expect(safeDemoNext('/library/animals/chicken')).toBe('/library/animals/chicken');
    expect(safeDemoNext('/weed-patrol?robot=item-roaming-roost')).toBe('/weed-patrol?robot=item-roaming-roost');
  });

  it('never leaves the app or opens unknown pages', () => {
    for (const bad of [null, '', 'weed-patrol', '//evil.example', 'https://evil.example', '/account', '/../x', '/layout#x', '/javascript:alert(1)']) {
      expect(safeDemoNext(bad), String(bad)).toBeNull();
    }
  });
});

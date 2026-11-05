import { defineConfig } from 'vitest/config';

// Fast unit tests (no Firebase emulator needed). Firestore rules tests stay in vitest.config.ts.
export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});

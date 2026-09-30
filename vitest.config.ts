import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['firestore-tests/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});

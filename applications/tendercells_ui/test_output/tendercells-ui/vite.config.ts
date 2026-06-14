/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFile } from 'fs/promises'

const publicDemoEnv = {
  'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(''),
  'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(''),
  'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(''),
  'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(''),
  'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(''),
  'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(''),
  'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(''),
  'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(''),
}

const muiBoxCreateThemePatch = () => ({
  name: 'mui-box-create-theme-patch',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    const normalizedId = id.replace(/\\/g, '/');

    if (!normalizedId.endsWith('/node_modules/@mui/material/Box/Box.js')) {
      return null;
    }

    return code.replace(
      "import { createTheme } from '../styles';",
      "import createTheme from '../styles/createTheme.js';"
    );
  },
});

const muiBoxOptimizerPatch = {
  name: 'mui-box-optimizer-patch',
  setup(build: any) {
    build.onLoad({ filter: /@mui[\\/]material[\\/]Box[\\/]Box\.js$/ }, async (args: any) => {
      const source = await readFile(args.path, 'utf8');

      return {
        contents: source.replace(
          "import { createTheme } from '../styles';",
          "import createTheme from '../styles/createTheme.js';"
        ),
        loader: 'js',
      };
    });
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'public-demo' ? '/app/' : process.env.VITE_APP_BASE_PATH || '/',
  plugins: [muiBoxCreateThemePatch(), react()],
  envDir: path.resolve(__dirname, '../../../..'),
  define: mode === 'public-demo' ? publicDemoEnv : undefined,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/material/styles',
      '@mui/material/styles/createTheme',
      '@mui/material/styles/ThemeProvider',
      '@mui/system',
      '@emotion/react',
      '@emotion/styled',
      'hoist-non-react-statics',
    ],
    esbuildOptions: {
      plugins: [muiBoxOptimizerPatch],
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // Unit tests run the deterministic sim (localStorage) backend, never a
    // real Firebase. Repo-root .env supplies VITE_FIREBASE_PROJECT_ID, which
    // would route services to live Firestore (flaky, network/permission
    // dependent). Blank it so FIREBASE_ENABLED is false during tests.
    env: { VITE_FIREBASE_PROJECT_ID: '' },
  },
}))

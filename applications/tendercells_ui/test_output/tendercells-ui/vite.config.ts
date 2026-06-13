/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFile } from 'fs/promises'

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
export default defineConfig({
  base: process.env.VITE_APP_BASE_PATH || '/',
  plugins: [muiBoxCreateThemePatch(), react()],
  envDir: path.resolve(__dirname, '../../../..'),
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
    rollupOptions: {
      output: {
        // Split heavy vendors into their own chunks so no single bundle blows
        // the size budget, and so firebase (statically imported by some modules,
        // dynamically by the dual-backend services) lands in one stable chunk.
        manualChunks(rawId) {
          // Rollup ids use OS path separators; normalize to POSIX so these
          // substring checks work on Windows (backslashes) too.
          const id = rawId.replace(/\\/g, '/');
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase';
          if (id.includes('/three/') || id.includes('/@react-three/') || id.includes('/three-stdlib/')) return 'three';
          if (id.includes('/@mui/') || id.includes('/@emotion/')) return 'mui';
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/react-router')) return 'react-vendor';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})

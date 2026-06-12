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
  server: {
    port: 5173,
    strictPort: true,
  },
})


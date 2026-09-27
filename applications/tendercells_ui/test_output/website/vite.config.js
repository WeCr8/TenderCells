import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // Same repo-root .env as the Tender Cells OS, so the /account page signs in
    // against the same Firebase project (VITE_FIREBASE_* keys).
    envDir: path.resolve(__dirname, '../../../..'),
    server: {
        port: 5176,
        strictPort: true,
    },
});

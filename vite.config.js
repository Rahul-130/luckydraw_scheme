import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '');
  return {
    plugins: [react()],
    root: path.resolve(__dirname, 'src'),
    envDir: path.resolve(__dirname),
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
    server: {
      // Use a fixed port for the dev server
      port: 5173,
      proxy: {
        // In development, all /api requests will be forwarded to the backend on port 4000
        // This does not affect the production build, as the proxy is only for the dev server.
        '/api': 'http://localhost:4000',
      },
    },
  };
});

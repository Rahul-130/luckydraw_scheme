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
      port: 5173,
      proxy: {
        '/api': env.VITE_BACKEND_URL, // forward /api requests to Express backend
      },
    },
  };
});

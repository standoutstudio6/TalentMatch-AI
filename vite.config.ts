import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/TalentMatch-AI/', // This must match your GitHub Repository name exactly
  build: {
    outDir: 'dist',
  },
});
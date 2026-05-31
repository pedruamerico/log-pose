import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Renderer build. base './' so the built index.html works when loaded
// from file:// inside the packaged Electron app.
export default defineConfig({
    root: 'src',
    base: './',
    plugins: [react()],
    build: {
        outDir: '../dist',
        emptyOutDir: true
    },
    server: {
        port: 5173,
        strictPort: true
    }
});

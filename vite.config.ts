import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'reader.html',
      output: {
        manualChunks: {
          markdown: ['marked', 'marked-highlight', 'marked-katex-extension', 'dompurify'],
          mermaid: ['mermaid'],
        },
      },
    },
  },
})

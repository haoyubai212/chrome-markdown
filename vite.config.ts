import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        reader: resolve(__dirname, 'reader.html'),
        content: resolve(__dirname, 'src/content.tsx'),
      },
      output: {
        entryFileNames: (chunk) => chunk.name === 'content' ? 'content.js' : 'assets/[name]-[hash].js',
        manualChunks: {
          markdown: ['marked', 'marked-highlight', 'marked-katex-extension', 'dompurify'],
          mermaid: ['mermaid'],
        },
      },
    },
  },
})

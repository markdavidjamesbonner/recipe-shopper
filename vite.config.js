import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// GitHub Pages: serve index.html for unknown paths so the SPA router works
function githubPages404() {
  return {
    name: 'github-pages-404',
    closeBundle() {
      const dist = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')
      const indexPath = join(dist, 'index.html')
      const notFoundPath = join(dist, '404.html')
      if (existsSync(indexPath)) {
        copyFileSync(indexPath, notFoundPath)
        console.log('Copied index.html → 404.html (GitHub Pages SPA fallback)')
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages subpath; must match repo/folder name (recipe-shopper)
  base: mode === 'production' ? '/sandbox/recipe-shopper/' : '/',
  plugins: [vue(), vueDevTools(), githubPages404()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))

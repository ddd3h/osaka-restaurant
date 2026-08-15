import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages はリポジトリ名がパスに入るため base が必要。
// リポジトリ名を変えた場合は VITE_BASE 環境変数で上書きできる。
const base = process.env.VITE_BASE ?? '/osaka-restaurant/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})

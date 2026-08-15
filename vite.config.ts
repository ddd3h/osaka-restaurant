import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'

// GitHub Pages はリポジトリ名がパスに入るため base が必要。
// リポジトリ名を変えた場合は VITE_BASE 環境変数で上書きできる。
const base = process.env.VITE_BASE ?? '/osaka-restaurant/'

// https://vite.dev/config/
export default defineConfig({
  base,
  // 地図のピン（46px角）とカードのサムネ（92px角）は原寸の写真を読む必要がない。
  // imagetools が ?w=... 付きの import をビルド時に縮小する（src/data/photos.ts で使う）。
  plugins: [react(), imagetools()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})

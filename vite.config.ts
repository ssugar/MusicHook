import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const rawBase = process.env.VITE_GH_PAGES_BASE ?? '/MusicHook/'
  const withLeading = rawBase.startsWith('/') ? rawBase : `/${rawBase}`
  const repoBase = withLeading.endsWith('/') ? withLeading : `${withLeading}/`

  return {
    plugins: [react()],
    base: command === 'build' ? repoBase : '/',
  }
})

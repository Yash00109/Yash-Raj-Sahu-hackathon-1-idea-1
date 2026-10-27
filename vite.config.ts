/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Vite's defaults plus local Supabase state (project link, local test credentials, function secrets).
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/supabase/.temp/**', '**/supabase/functions/.env'],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Unit tests never reach a backend, whatever is in a developer's env files.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', VITE_SUPABASE_ANON_KEY: '' },
    restoreMocks: true,
    unstubGlobals: true,
  },
})

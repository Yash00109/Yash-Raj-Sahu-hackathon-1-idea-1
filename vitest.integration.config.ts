import { defineConfig } from 'vitest/config'

// Runs against the local Supabase stack only (see docs/SETUP.md). Never point this at production.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.integration.test.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
})

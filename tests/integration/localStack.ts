import { execSync } from 'node:child_process'

/**
 * Connection details for the LOCAL Supabase stack only. The keys are the stack's
 * built-in development keys, read at runtime and never printed or written to disk.
 */
export interface LocalStack {
  url: string
  anonKey: string
  serviceRoleKey: string
}

export function readLocalStack(): LocalStack {
  const status = JSON.parse(execSync('npx supabase status -o json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString())
  const url: string = status.API_URL
  const { hostname } = new URL(url)
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
    throw new Error('Integration tests only run against a local Supabase stack.')
  }
  const anonKey = status.ANON_KEY ?? status.PUBLISHABLE_KEY
  const serviceRoleKey = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY
  if (!anonKey || !serviceRoleKey) throw new Error('Local stack keys are unavailable; is `supabase start` running?')
  return { url, anonKey, serviceRoleKey }
}

export async function rest(stack: LocalStack, path: string, key: string, init: RequestInit = {}) {
  const response = await fetch(`${stack.url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...init.headers },
  })
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null }
}

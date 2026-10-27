/**
 * Browser configuration. Only public, browser-safe values may live in VITE_ variables:
 * the Supabase project URL and its publishable (or legacy anon) key. Never put a
 * service-role or secret key here; readBackendConfig refuses to use one.
 */
export interface BackendConfig {
  url: string
  publishableKey: string
}

export type ConfigProblem = 'missing' | 'invalid_url' | 'localhost_in_production' | 'secret_key_in_browser'

export type ConfigState = { ok: true; config: BackendConfig } | { ok: false; problem: ConfigProblem }

interface EnvLike {
  PROD?: boolean
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
  VITE_SUPABASE_ANON_KEY?: string
}

function jwtRole(token: string): string | null {
  const payload = token.split('.')[1]
  if (!payload) return null
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const role = (JSON.parse(json) as { role?: unknown }).role
    return typeof role === 'string' ? role : null
  } catch {
    return null
  }
}

export function readBackendConfig(env: EnvLike = import.meta.env as EnvLike): ConfigState {
  const url = env.VITE_SUPABASE_URL?.trim()
  const publishableKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY)?.trim()
  if (!url || !publishableKey) return { ok: false, problem: 'missing' }

  if (publishableKey.startsWith('sb_secret_') || jwtRole(publishableKey) === 'service_role') {
    return { ok: false, problem: 'secret_key_in_browser' }
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { ok: false, problem: 'invalid_url' }
  }
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
  if (env.PROD && isLocal) return { ok: false, problem: 'localhost_in_production' }
  if (parsed.protocol !== 'https:' && !isLocal) return { ok: false, problem: 'invalid_url' }

  return { ok: true, config: { url: url.replace(/\/+$/, ''), publishableKey } }
}

export const backendConfig = readBackendConfig()

if (!backendConfig.ok && backendConfig.problem !== 'missing') {
  // Misconfiguration (not mere absence) is worth surfacing to whoever deploys the site.
  console.error(`[iturrieta] Online reservations disabled: ${backendConfig.problem}. Check the VITE_SUPABASE_* variables.`)
}

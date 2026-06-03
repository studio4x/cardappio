import { createClient } from '@supabase/supabase-js'
import { config } from '@/config'

// Captura imediatamente o fluxo de recuperação antes que a biblioteca do Supabase consuma o hash da URL
if (typeof window !== 'undefined' && window.sessionStorage) {
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const searchParams = new URLSearchParams(window.location.search)
  const isRecovery = hashParams.get('type') === 'recovery' || 
                     searchParams.get('type') === 'recovery' || 
                     window.location.href.includes('type=recovery')
  
  if (isRecovery) {
    window.sessionStorage.setItem('isRecoveryFlow', 'true')
  }
}

if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Bypass fallback for broken navigator.locks in Kaspersky/Brave
      // Executes the auth task immediately without waiting for the Web Locks API
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        return await fn();
      }
    },
  }
)

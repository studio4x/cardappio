import { createClient } from '@supabase/supabase-js'
import { config } from '@/config'

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
      // Executes the auth task immediately without waiting for the blocked Web Locks API
      lock: async (name: string, acquire: () => Promise<any> | any) => {
        return await acquire()
      }
    },
  }
)

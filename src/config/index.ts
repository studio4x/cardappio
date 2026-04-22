// Environment config
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },
  app: {
    name: 'Cardappio',
    tagline: 'Seu cardápio semanal pronto em poucos minutos.',
    url: import.meta.env.VITE_APP_URL as string || 'http://localhost:5173',
  },
} as const

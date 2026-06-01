import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseClient, getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"
import Stripe from "npm:stripe"

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) return createResponse(null, { code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401)

    // 2. Check if user is Admin
    const supabaseService = getServiceClient()
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return createResponse(null, { code: 'FORBIDDEN', message: 'Access denied' }, 403)
    }

    // 3. Fetch Stripe settings from app_settings table
    const { data: setting, error: settingError } = await supabaseService
      .from('app_settings')
      .select('value_json')
      .eq('setting_key', 'stripe_config')
      .single()

    if (settingError || !setting) {
      return createResponse(null, { code: 'NOT_FOUND', message: 'Stripe configuration not found in database settings' }, 404)
    }

    const config = setting.value_json as any
    const mode = config.mode || 'sandbox'
    const secretKey = mode === 'production' ? config.production_secret_key : config.sandbox_secret_key

    if (!secretKey) {
      return createResponse({
        success: false,
        error: `A chave secreta de ${mode === 'production' ? 'produção' : 'sandbox'} está em branco.`
      })
    }

    // 4. Test connection using Stripe API
    try {
      const stripe = new Stripe(secretKey, {
        apiVersion: "2024-06-20", // stable stripe version
      })

      // Fetch account details to verify credentials
      const account = await stripe.accounts.retrieve()
      
      return createResponse({
        success: true,
        mode,
        account_id: account.id,
        business_profile: account.business_profile?.name || account.email || "Conta Stripe"
      })

    } catch (stripeErr: any) {
      return createResponse({
        success: false,
        error: stripeErr.message || 'Erro de conexão com a API do Stripe.'
      })
    }

  } catch (err: any) {
    console.error('verify-stripe-connection failed:', err)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})

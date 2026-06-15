import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"
import webpush from "npm:web-push"

// VAPID credentials
// Fallback keys for sandbox testing (generated via CLI)
const DEFAULT_VAPID_PUBLIC_KEY = "BBB4XppXCi3mDOnORLXbX9ExXA4VM1epn32huhPA_mHgzRZVxjcnxoobw-rDGYwJKNg9Oie6tlg4ro02Hu3O94c"
const DEFAULT_VAPID_PRIVATE_KEY = "GuBFZGK_BETRVtql7DMQgje1prmQAYj2OfLp58WKCyM"

const VAPID_PUBLIC_KEY = Deno.env.get("VITE_VAPID_PUBLIC_KEY") || DEFAULT_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || DEFAULT_VAPID_PRIVATE_KEY
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@studio4x.com.br"

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

/**
 * dispatch-notifications
 * Processes pending items in the notification_queue.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getServiceClient()

    // Fetch visual identity logo for fallback icon
    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('value_json')
      .eq('setting_key', 'visual_identity')
      .maybeSingle()

    const visualIdentity = settingsData?.value_json as any
    const logoUrl = visualIdentity?.logo_light_url || visualIdentity?.logo_dark_url || '/favicon.svg'

    // 1. Fetch pending notifications
    // Using a 1-minute buffer (Date.now() + 60000) to account for database vs server clock drift
    const { data: queue, error: queueError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date(Date.now() + 60000).toISOString())
      .limit(50)

    if (queueError) throw queueError

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0
    }

    for (const item of queue || []) {
      results.processed++
      
      try {
        // Mark as processing first to avoid double deliveries
        await supabase
          .from('notification_queue')
          .update({ status: 'processing' })
          .eq('id', item.id)

        // 1. Always create the in-app notification first
        const { data: inAppNotif, error: inAppError } = await supabase
          .from('notifications')
          .insert({
            user_id: item.user_id,
            title: item.title,
            body: item.body,
            type: item.type === 'meal_reminder' || item.type === 'subscription' || item.type === 'promotion' || item.type === 'system' ? item.type : 'system',
            action_url: item.payload_json?.action_url || null,
            is_read: false
          })
          .select('id')
          .single()

        if (inAppError) throw inAppError

        // Log in-app delivery
        await supabase.from('notification_delivery_logs').insert({
          notification_id: inAppNotif.id,
          user_id: item.user_id,
          channel: 'in_app',
          status: 'success'
        })

        // 2. Attempt Web Push if enabled
        const { data: pref, error: prefError } = await supabase
          .from('notification_preferences')
          .select('push_enabled, push_token')
          .eq('user_id', item.user_id)
          .maybeSingle()

        if (pref && pref.push_enabled && pref.push_token) {
          try {
            const subscription = JSON.parse(pref.push_token)
            
            // Send the push notification
            await webpush.sendNotification(
              subscription,
              JSON.stringify({
                title: item.title,
                body: item.body,
                icon: item.payload_json?.icon_url || logoUrl,
                image: item.payload_json?.image_url || null,
                action_url: item.payload_json?.action_url || '/app/notificacoes'
              })
            )

            // Log Web Push delivery log
            await supabase.from('notification_delivery_logs').insert({
              notification_id: inAppNotif.id,
              user_id: item.user_id,
              channel: 'push',
              status: 'success'
            })
          } catch (pushErr: any) {
            console.error(`Web Push delivery failed for user ${item.user_id}:`, pushErr)
            
            // Log delivery failure
            await supabase.from('notification_delivery_logs').insert({
              notification_id: inAppNotif.id,
              user_id: item.user_id,
              channel: 'push',
              status: 'failed',
              error_message: pushErr.message
            })
          }
        }

        // Mark as sent
        await supabase
          .from('notification_queue')
          .update({ 
             status: 'sent', 
             attempts: item.attempts + 1
          })
          .eq('id', item.id)
        
        results.succeeded++

      } catch (deliveryError: any) {
        console.error(`Failed to process queue item ${item.id}:`, deliveryError)
        results.failed++
        const isLastAttempt = item.attempts >= 2 // max 3 attempts (0, 1, 2)
        
        await supabase
          .from('notification_queue')
          .update({ 
            status: isLastAttempt ? 'failed' : 'pending',
            attempts: item.attempts + 1,
            last_error: deliveryError.message,
            scheduled_for: new Date(Date.now() + 1000 * 60 * 15).toISOString() // Retry in 15 mins
          })
          .eq('id', item.id)
      }
    }

    // Log cron execution
    await supabase.from('cron_execution_logs').insert({
      job_name: 'dispatch-notifications',
      status: 'success',
      processed_count: results.processed,
      metadata_json: results
    })

    return createResponse(results)

  } catch (err: any) {
    console.error('dispatch-notifications failed:', err)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})

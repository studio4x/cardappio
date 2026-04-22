import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"

/**
 * dispatch-notifications
 * Per API_FUNCTIONS.md: Processes pending items in the notification_queue.
 * 
 * Logic:
 * 1. Fetch pending notifications with next_retry_at <= now.
 * 2. Attempt delivery (Mocking external providers for now).
 * 3. Update status (sent, failed) and attempt count.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getServiceClient()

    // 1. Fetch pending notifications
    const { data: queue, error: queueError } = await supabase
      .from('notification_queue')
      .select('*, notification:notifications(*)')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
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
        // DELIVERY LOGIC (In a real scenario, this calls Firebase, Postmark, etc.)
        // For now, we simulate success for in-app and mock others
        const deliverySuccess = true 

        if (deliverySuccess) {
          await supabase
            .from('notification_queue')
            .update({ 
               status: 'sent', 
               sent_at: new Date().toISOString(),
               attempt_count: item.attempt_count + 1
            })
            .eq('id', item.id)
          
          results.succeeded++
        } else {
          throw new Error('Provider delivery failure')
        }

      } catch (deliveryError: any) {
        results.failed++
        const isLastAttempt = item.attempt_count >= 3
        
        await supabase
          .from('notification_queue')
          .update({ 
            status: isLastAttempt ? 'failed' : 'pending',
            attempt_count: item.attempt_count + 1,
            last_error: deliveryError.message,
            next_retry_at: new Date(Date.now() + 1000 * 60 * 15).toISOString() // Retry in 15 mins
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
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})

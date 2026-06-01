import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"

/**
 * scan-meal-reminders
 * 
 * Scheduled job to run daily (e.g. at 20:00).
 * Scans active weekly plans for tomorrow, detects prep keywords (descongelar, molho, marinar, etc.)
 * in recipe steps, and queues notifications in notification_queue.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getServiceClient()

    // 1. Calculate tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0] // 'YYYY-MM-DD'

    // 2. Fetch active plan days for tomorrow
    const { data: days, error: daysError } = await supabase
      .from('meal_plan_days')
      .select(`
        id,
        date_reference,
        week:meal_plan_weeks!inner(
          id,
          user_id,
          status
        ),
        slots:meal_plan_slots(
          id,
          meal_type,
          recipe:recipes(
            id,
            title,
            steps:recipe_steps(
              id,
              step_number,
              content
            )
          )
        )
      `)
      .eq('date_reference', tomorrowStr)
      .eq('week.status', 'active')

    if (daysError) throw daysError

    const results = {
      days_scanned: 0,
      notifications_queued: 0,
      errors: [] as string[]
    }

    for (const day of days || []) {
      results.days_scanned++
      const userId = day.week.user_id
      const slots = day.slots || []
      
      if (slots.length === 0) continue

      const prepAlerts: string[] = []
      const mealsPlanned: { type: string; title: string }[] = []

      // Scan recipes in slots for prep keywords
      for (const slot of slots) {
        if (!slot.recipe) continue

        const recipe = slot.recipe as any
        mealsPlanned.push({ type: slot.meal_type, title: recipe.title })

        const steps = recipe.steps || []
        for (const step of steps) {
          const content = step.content.toLowerCase()
          
          // Keywords indicating tasks to do the day/night before
          const keywords = [
            'descongelar', 
            'deixar de molho', 
            'marinada', 
            'marinar', 
            'de véspera', 
            'geladeira de um dia para o outro',
            'molho por',
            'noite anterior'
          ]
          
          const matchedKeyword = keywords.find(keyword => content.includes(keyword))
          if (matchedKeyword) {
            prepAlerts.push(`Para ${recipe.title}: ${step.content}`)
          }
        }
      }

      // Determine what notification to queue
      let title = ""
      let body = ""
      let type = "meal_reminder"

      if (prepAlerts.length > 0) {
        title = "⚠️ Lembrete de Preparo para Amanhã"
        body = `Atenção: alguns preparos para amanhã exigem atenção hoje: \n${prepAlerts.join('\n')}`
      } else if (mealsPlanned.length > 0) {
        title = "📅 Seu Cardápio de Amanhã"
        const lunch = mealsPlanned.find(m => m.type === 'lunch')
        const dinner = mealsPlanned.find(m => m.type === 'dinner')
        
        if (lunch && dinner) {
          body = `Amanhã você tem planejado: Almoço: ${lunch.title} | Jantar: ${dinner.title}. Bom apetite!`
        } else if (lunch) {
          body = `Amanhã você tem planejado: Almoço: ${lunch.title}. Bom apetite!`
        } else if (dinner) {
          body = `Amanhã você tem planejado: Jantar: ${dinner.title}. Bom apetite!`
        }
      }

      if (title && body) {
        // Check user preferences first
        const { data: pref } = await supabase
          .from('notification_preferences')
          .select('meal_reminders')
          .eq('user_id', userId)
          .maybeSingle()

        // Default to true if preferences not created yet
        const wantsReminders = pref ? pref.meal_reminders : true

        if (wantsReminders) {
          const { error: queueError } = await supabase
            .from('notification_queue')
            .insert({
              user_id: userId,
              title,
              body,
              type,
              payload_json: { action_url: '/app/semana' },
              scheduled_for: new Date().toISOString(), // send immediately
              status: 'pending'
            })

          if (queueError) {
            results.errors.push(`User ${userId} queue error: ${queueError.message}`)
          } else {
            results.notifications_queued++
          }
        }
      }
    }

    // Log execution
    await supabase.from('cron_execution_logs').insert({
      job_name: 'scan-meal-reminders',
      status: results.errors.length > 0 ? 'partial_success' : 'success',
      processed_count: results.days_scanned,
      metadata_json: results
    })

    return createResponse(results)

  } catch (err: any) {
    console.error('scan-meal-reminders failed:', err)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})

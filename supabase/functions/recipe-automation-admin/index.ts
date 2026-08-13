import { createClient } from "npm:@supabase/supabase-js@2.95.0"

const MAX_RECIPES = 20
const HISTORY_LIMIT = 100
const TIMEZONE = "America/Sao_Paulo"
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
}

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

function env(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function response(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...cors,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function normalizeConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(422, "invalid_config", "config must be an object")
  }

  const raw = value as Record<string, unknown>
  const targetsRaw = Array.isArray(raw.targets) ? raw.targets : []
  const targets: Array<{ category_slug: string; quantity: number }> = []
  const seen = new Set<string>()
  let total = 0

  for (const targetRaw of targetsRaw) {
    if (!targetRaw || typeof targetRaw !== "object" || Array.isArray(targetRaw)) {
      throw new HttpError(422, "invalid_target", "invalid target")
    }

    const target = targetRaw as Record<string, unknown>
    const categorySlug = String(target.category_slug || "").trim()
    const quantity = Number(target.quantity)

    if (
      !/^[a-z0-9-]{1,80}$/.test(categorySlug) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_RECIPES ||
      seen.has(categorySlug)
    ) {
      throw new HttpError(422, "invalid_target", "invalid category or quantity")
    }

    seen.add(categorySlug)
    total += quantity
    targets.push({ category_slug: categorySlug, quantity })
  }

  if (total > MAX_RECIPES) {
    throw new HttpError(422, "total_limit_exceeded", `Maximum ${MAX_RECIPES} recipes per run`)
  }

  const enabled = raw.enabled === true
  if (enabled && total < 1) {
    throw new HttpError(422, "targets_required", "Select at least one category")
  }

  if (String(raw.timezone || "") !== TIMEZONE) {
    throw new HttpError(422, "invalid_timezone", `timezone must be ${TIMEZONE}`)
  }

  const schedule = raw.schedule && typeof raw.schedule === "object" && !Array.isArray(raw.schedule)
    ? raw.schedule as Record<string, unknown>
    : {}
  const days = [...new Set((Array.isArray(schedule.days_of_week) ? schedule.days_of_week : []).map(Number))]
    .sort((left, right) => left - right)

  if (!days.length || days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new HttpError(422, "invalid_days", "days_of_week must be 0..6")
  }

  const time = String(schedule.time || "").trim()
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new HttpError(422, "invalid_time", "time must be HH:mm")
  }

  return {
    version: 1,
    enabled,
    timezone: TIMEZONE,
    targets,
    schedule: { days_of_week: days, time },
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors })
  }

  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "method_not_allowed", "Only POST is accepted")
    }

    const authorization = request.headers.get("authorization") || ""
    if (!authorization) {
      throw new HttpError(401, "missing_authorization", "Authorization required")
    }

    const body = await request.json()
    const action = String(body?.action || "")

    const userClient = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) {
      throw new HttpError(401, "invalid_session", "Authenticated session required")
    }

    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single()

    if (profileError || !["admin", "super_admin"].includes(String(profile?.role || ""))) {
      throw new HttpError(403, "admin_required", "Administrator access required")
    }

    const serviceClient = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    if (action === "get") {
      const [configResult, runtimeResult, categoriesResult, logsResult, recipesResult] = await Promise.all([
        serviceClient.from("app_settings").select("value_json,updated_at").eq("setting_key", "recipe_automation_config").single(),
        serviceClient.from("app_settings").select("value_json,updated_at").eq("setting_key", "recipe_automation_runtime").single(),
        serviceClient.from("recipe_categories").select("name,slug,sort_order").eq("is_active", true).order("sort_order").order("name"),
        serviceClient.from("cron_execution_logs").select("status,processed_count,metadata_json,created_at").eq("job_name", "recipe_automation").order("created_at", { ascending: false }).limit(10),
        serviceClient.from("recipes").select("id,title,created_at").eq("is_automation_created", true).order("created_at", { ascending: false }).limit(HISTORY_LIMIT),
      ])

      if (
        configResult.error ||
        runtimeResult.error ||
        categoriesResult.error ||
        logsResult.error ||
        recipesResult.error
      ) {
        throw new HttpError(500, "state_query_failed", "Could not load state")
      }

      return response(200, {
        ok: true,
        config: configResult.data?.value_json,
        runtime: runtimeResult.data?.value_json || {},
        categories: categoriesResult.data || [],
        recent_runs: logsResult.data || [],
        generated_recipes: recipesResult.data || [],
        limits: {
          max_recipes_per_run: MAX_RECIPES,
          generated_recipe_history: HISTORY_LIMIT,
          timezone: TIMEZONE,
        },
      })
    }

    if (action === "get_recipe_source") {
      const recipeId = String(body?.recipe_id || "").trim()
      if (!isUuid(recipeId)) {
        throw new HttpError(422, "invalid_recipe_id", "recipe_id must be a UUID")
      }

      const { data: recipe, error: recipeError } = await serviceClient
        .from("recipes")
        .select("id,is_automation_created")
        .eq("id", recipeId)
        .maybeSingle()

      if (recipeError) {
        throw new HttpError(500, "recipe_query_failed", "Could not load recipe")
      }

      if (!recipe || recipe.is_automation_created !== true) {
        return response(200, { ok: true, source: null })
      }

      const { data: source, error: sourceError } = await serviceClient
        .from("recipe_import_runs")
        .select("source_url,canonical_url,completed_at,created_at")
        .eq("recipe_id", recipeId)
        .eq("status", "succeeded")
        .not("source_url", "is", null)
        .order("completed_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sourceError) {
        throw new HttpError(500, "recipe_source_query_failed", "Could not load recipe source")
      }

      return response(200, {
        ok: true,
        source: source
          ? {
              source_url: source.source_url,
              canonical_url: source.canonical_url || null,
              imported_at: source.completed_at || source.created_at || null,
            }
          : null,
      })
    }

    if (action === "save") {
      const config = normalizeConfig(body.config)
      const { data: categories, error: categoryError } = await serviceClient
        .from("recipe_categories")
        .select("slug")
        .eq("is_active", true)

      if (categoryError) {
        throw new HttpError(500, "category_query_failed", "Could not validate categories")
      }

      const active = new Set((categories || []).map((item) => String(item.slug)))
      for (const target of config.targets) {
        if (!active.has(target.category_slug)) {
          throw new HttpError(422, "inactive_or_unknown_category", `Inactive category: ${target.category_slug}`)
        }
      }

      const { error } = await serviceClient
        .from("app_settings")
        .update({
          value_json: config,
          updated_by: userData.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", "recipe_automation_config")

      if (error) throw new HttpError(500, "save_failed", "Could not save configuration")
      return response(200, { ok: true, config })
    }

    if (action === "run_now") {
      const { data, error } = await serviceClient.rpc("request_recipe_automation_manual_run_v1", {
        p_requested_by: userData.user.id,
      })

      if (error) {
        throw new HttpError(422, "manual_run_failed", String(error.message || "Could not request run").slice(0, 300))
      }

      return response(200, { ok: true, result: data })
    }

    throw new HttpError(422, "invalid_action", "Unsupported action")
  } catch (error) {
    if (error instanceof HttpError) {
      return response(error.status, { ok: false, error: { code: error.code, message: error.message } })
    }

    console.error("recipe-automation-admin", error instanceof Error ? error.name : "UnknownError")
    return response(500, { ok: false, error: { code: "internal_error", message: "Unexpected server error" } })
  }
})

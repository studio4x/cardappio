import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.95.0"

const MAX_RECIPES = 20
const HISTORY_LIMIT = 100
const COVER_LIST_LIMIT = 200
const COVER_BATCH_LIMIT = 20
const COVER_QUEUE_PREFIX = "recipe_cover_request:"
const TIMEZONE = "America/Sao_Paulo"
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
}

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}
function env(name: string): string { const value = Deno.env.get(name)?.trim(); if (!value) throw new Error(`Missing ${name}`); return value }
function response(status: number, payload: Record<string, unknown>) { return new Response(JSON.stringify(payload), { status, headers: { ...cors, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }) }
function isUuid(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) }

function normalizeConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(422, "invalid_config", "config must be an object")
  const raw = value as Record<string, unknown>
  const targetsRaw = Array.isArray(raw.targets) ? raw.targets : []
  const targets: Array<{ category_slug: string; quantity: number }> = []
  const seen = new Set<string>()
  let total = 0
  for (const targetRaw of targetsRaw) {
    if (!targetRaw || typeof targetRaw !== "object" || Array.isArray(targetRaw)) throw new HttpError(422, "invalid_target", "invalid target")
    const target = targetRaw as Record<string, unknown>
    const categorySlug = String(target.category_slug || "").trim()
    const quantity = Number(target.quantity)
    if (!/^[a-z0-9-]{1,80}$/.test(categorySlug) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_RECIPES || seen.has(categorySlug)) throw new HttpError(422, "invalid_target", "invalid category or quantity")
    seen.add(categorySlug); total += quantity; targets.push({ category_slug: categorySlug, quantity })
  }
  if (total > MAX_RECIPES) throw new HttpError(422, "total_limit_exceeded", `Maximum ${MAX_RECIPES} recipes per run`)
  const enabled = raw.enabled === true
  if (enabled && total < 1) throw new HttpError(422, "targets_required", "Select at least one category")
  if (String(raw.timezone || "") !== TIMEZONE) throw new HttpError(422, "invalid_timezone", `timezone must be ${TIMEZONE}`)
  const schedule = raw.schedule && typeof raw.schedule === "object" && !Array.isArray(raw.schedule) ? raw.schedule as Record<string, unknown> : {}
  const days = [...new Set((Array.isArray(schedule.days_of_week) ? schedule.days_of_week : []).map(Number))].sort((left, right) => left - right)
  if (!days.length || days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) throw new HttpError(422, "invalid_days", "days_of_week must be 0..6")
  const time = String(schedule.time || "").trim()
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new HttpError(422, "invalid_time", "time must be HH:mm")
  return { version: 1, enabled, timezone: TIMEZONE, targets, schedule: { days_of_week: days, time } }
}

type CoverQueueState = {
  version: 1; request_id: string; recipe_id: string; status: "pending" | "processing" | "succeeded" | "failed" | "skipped";
  request_source: "import" | "admin_single" | "admin_batch"; requested_by: string | null; force_regenerate: boolean; correlation_id: string;
  attempt_count: number; max_attempts: number; next_attempt_at: string; claimed_at: string | null; claimed_by: string | null; completed_at: string | null;
  model_used: string | null; prompt_used: string | null; image_url: string | null; storage_path: string | null; estimated_cost_usd: number | null;
  last_error_code: string | null; last_error_message: string | null; created_at: string; updated_at: string
}
function normalizeCoverQueue(value: unknown): CoverQueueState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  if (!isUuid(raw.request_id) || !isUuid(raw.recipe_id) || !isUuid(raw.correlation_id)) return null
  if (!["pending", "processing", "succeeded", "failed", "skipped"].includes(String(raw.status || ""))) return null
  return raw as unknown as CoverQueueState
}
function coverQueueKey(recipeId: string) { return `${COVER_QUEUE_PREFIX}${recipeId}` }

async function enqueueCover(serviceClient: SupabaseClient, args: { recipeId: string; requestedBy: string; requestSource: "admin_single" | "admin_batch"; forceRegenerate: boolean }) {
  const { data: recipe, error: recipeError } = await serviceClient.from("recipes").select("id,cover_image_url").eq("id", args.recipeId).maybeSingle()
  if (recipeError) throw new HttpError(500, "recipe_query_failed", "Could not load recipe")
  if (!recipe) throw new HttpError(422, "recipe_not_found", "Recipe not found")
  if (String(recipe.cover_image_url || "").trim() && !args.forceRegenerate) return { accepted: false, status: "skipped", reason: "cover_exists", request_id: null }
  const key = coverQueueKey(args.recipeId)
  const { data: existingRow, error: existingError } = await serviceClient.from("app_settings").select("value_json").eq("setting_key", key).maybeSingle()
  if (existingError) throw new HttpError(500, "cover_queue_query_failed", "Could not load cover queue")
  const existing = normalizeCoverQueue(existingRow?.value_json)
  if (existing && ["pending", "processing"].includes(existing.status)) return { accepted: false, status: existing.status, reason: "already_queued", request_id: existing.request_id }
  const now = new Date().toISOString()
  const state: CoverQueueState = {
    version: 1, request_id: crypto.randomUUID(), recipe_id: args.recipeId, status: "pending", request_source: args.requestSource,
    requested_by: args.requestedBy, force_regenerate: args.forceRegenerate, correlation_id: crypto.randomUUID(), attempt_count: 0, max_attempts: 3,
    next_attempt_at: now, claimed_at: null, claimed_by: null, completed_at: null, model_used: null, prompt_used: null, image_url: null, storage_path: null,
    estimated_cost_usd: null, last_error_code: null, last_error_message: null, created_at: now, updated_at: now,
  }
  const { error: upsertError } = await serviceClient.from("app_settings").upsert({
    setting_key: key, value_json: state, description: "Operational state for AI recipe cover generation. Managed server-side.", updated_by: args.requestedBy, updated_at: now,
  }, { onConflict: "setting_key" })
  if (upsertError) throw new HttpError(500, "cover_queue_write_failed", "Could not enqueue cover generation")
  return { accepted: true, status: "pending", reason: null, request_id: state.request_id }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })
  try {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "Only POST is accepted")
    const authorization = request.headers.get("authorization") || ""
    if (!authorization) throw new HttpError(401, "missing_authorization", "Authorization required")
    const body = await request.json()
    const action = String(body?.action || "")
    const userClient = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) throw new HttpError(401, "invalid_session", "Authenticated session required")
    const { data: profile, error: profileError } = await userClient.from("profiles").select("role").eq("id", userData.user.id).single()
    if (profileError || !["admin", "super_admin"].includes(String(profile?.role || ""))) throw new HttpError(403, "admin_required", "Administrator access required")
    const serviceClient = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })

    if (action === "get") {
      const [configResult, runtimeResult, categoriesResult, logsResult, recipesResult] = await Promise.all([
        serviceClient.from("app_settings").select("value_json,updated_at").eq("setting_key", "recipe_automation_config").single(),
        serviceClient.from("app_settings").select("value_json,updated_at").eq("setting_key", "recipe_automation_runtime").single(),
        serviceClient.from("recipe_categories").select("name,slug,sort_order").eq("is_active", true).order("sort_order").order("name"),
        serviceClient.from("cron_execution_logs").select("id,status,processed_count,metadata_json,created_at").eq("job_name", "recipe_automation").order("created_at", { ascending: false }).limit(HISTORY_LIMIT),
        serviceClient.from("recipes").select("id,title,created_at").eq("is_automation_created", true).order("created_at", { ascending: false }).limit(HISTORY_LIMIT),
      ])
      if (configResult.error || runtimeResult.error || categoriesResult.error || logsResult.error || recipesResult.error) throw new HttpError(500, "state_query_failed", "Could not load state")
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
          run_history: HISTORY_LIMIT,
          cover_batch_limit: COVER_BATCH_LIMIT,
          timezone: TIMEZONE,
        },
      })
    }

    if (action === "get_recipe_source") {
      const recipeId = String(body?.recipe_id || "").trim()
      if (!isUuid(recipeId)) throw new HttpError(422, "invalid_recipe_id", "recipe_id must be a UUID")
      const { data: recipe, error: recipeError } = await serviceClient.from("recipes").select("id,is_automation_created,cover_image_url").eq("id", recipeId).maybeSingle()
      if (recipeError) throw new HttpError(500, "recipe_query_failed", "Could not load recipe")
      if (!recipe) return response(200, { ok: true, source: null, cover_generation: null, has_cover: false })
      let source: Record<string, unknown> | null = null
      if (recipe.is_automation_created === true) {
        const { data: sourceRow, error: sourceError } = await serviceClient.from("recipe_import_runs").select("source_url,canonical_url,completed_at,created_at").eq("recipe_id", recipeId).eq("status", "succeeded").not("source_url", "is", null).order("completed_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(1).maybeSingle()
        if (sourceError) throw new HttpError(500, "recipe_source_query_failed", "Could not load recipe source")
        source = sourceRow ? { source_url: sourceRow.source_url, canonical_url: sourceRow.canonical_url || null, imported_at: sourceRow.completed_at || sourceRow.created_at || null } : null
      }
      const { data: queueRow } = await serviceClient.from("app_settings").select("value_json").eq("setting_key", coverQueueKey(recipeId)).maybeSingle()
      const coverGeneration = normalizeCoverQueue(queueRow?.value_json)
      return response(200, { ok: true, source, has_cover: Boolean(String(recipe.cover_image_url || "").trim()), cover_image_url: recipe.cover_image_url || null, cover_generation: coverGeneration ? { request_id: coverGeneration.request_id, status: coverGeneration.status, request_source: coverGeneration.request_source, attempt_count: coverGeneration.attempt_count, completed_at: coverGeneration.completed_at, image_url: coverGeneration.image_url, last_error_code: coverGeneration.last_error_code, last_error_message: coverGeneration.last_error_message } : null })
    }

    if (action === "list_missing_covers") {
      const automationOnly = body?.automation_only !== false
      const categorySlug = String(body?.category_slug || "").trim()
      const statusFilter = String(body?.status || "").trim()
      let recipesQuery = serviceClient.from("recipes").select("id,title,status,created_at,is_automation_created,cover_image_url,category:recipe_categories(name,slug)").or("cover_image_url.is.null,cover_image_url.eq.").order("created_at", { ascending: false }).limit(COVER_LIST_LIMIT)
      if (automationOnly) recipesQuery = recipesQuery.eq("is_automation_created", true)
      if (statusFilter && statusFilter !== "all") recipesQuery = recipesQuery.eq("status", statusFilter)
      const { data: recipes, error: recipesError } = await recipesQuery
      if (recipesError) throw new HttpError(500, "recipe_query_failed", "Could not load recipes without covers")
      const { data: queueRows } = await serviceClient.from("app_settings").select("setting_key,value_json").like("setting_key", `${COVER_QUEUE_PREFIX}%`)
      const queueByRecipe = new Map<string, CoverQueueState>()
      for (const row of queueRows || []) { const state = normalizeCoverQueue(row.value_json); if (state) queueByRecipe.set(state.recipe_id, state) }
      const filtered = (recipes || []).filter((recipe) => {
        const category = Array.isArray(recipe.category) ? recipe.category[0] : recipe.category
        return !categorySlug || String((category as Record<string, unknown> | null)?.slug || "") === categorySlug
      }).map((recipe) => {
        const category = Array.isArray(recipe.category) ? recipe.category[0] : recipe.category
        const queue = queueByRecipe.get(String(recipe.id))
        return { id: recipe.id, title: recipe.title, status: recipe.status, created_at: recipe.created_at, is_automation_created: recipe.is_automation_created === true, category_name: String((category as Record<string, unknown> | null)?.name || ""), category_slug: String((category as Record<string, unknown> | null)?.slug || ""), cover_request: queue ? { request_id: queue.request_id, status: queue.status, attempt_count: queue.attempt_count, updated_at: queue.updated_at, last_error_code: queue.last_error_code, last_error_message: queue.last_error_message } : null }
      })
      return response(200, { ok: true, recipes: filtered, total: filtered.length, limit: COVER_LIST_LIMIT })
    }

    if (action === "request_cover_generation") {
      const recipeId = String(body?.recipe_id || "").trim()
      if (!isUuid(recipeId)) throw new HttpError(422, "invalid_recipe_id", "recipe_id must be UUID")
      const result = await enqueueCover(serviceClient, { recipeId, requestedBy: userData.user.id, requestSource: "admin_single", forceRegenerate: body?.force_regenerate === true })
      return response(200, { ok: true, result })
    }

    if (action === "request_cover_generation_batch") {
      const ids = [...new Set((Array.isArray(body?.recipe_ids) ? body.recipe_ids : []).map((value) => String(value || "").trim()))]
      if (!ids.length || ids.length > COVER_BATCH_LIMIT || ids.some((id) => !isUuid(id))) throw new HttpError(422, "invalid_recipe_ids", `recipe_ids must contain 1..${COVER_BATCH_LIMIT} UUIDs`)
      const results = []
      for (const recipeId of ids) {
        try { results.push({ recipe_id: recipeId, ...(await enqueueCover(serviceClient, { recipeId, requestedBy: userData.user.id, requestSource: "admin_batch", forceRegenerate: false })) }) }
        catch (error) { results.push({ recipe_id: recipeId, accepted: false, status: "failed", reason: error instanceof Error ? error.message : "enqueue_failed", request_id: null }) }
      }
      return response(200, { ok: true, result: { requested: ids.length, accepted: results.filter((item) => item.accepted === true).length, results } })
    }

    if (action === "save") {
      const config = normalizeConfig(body.config)
      const { data: categories, error: categoryError } = await serviceClient.from("recipe_categories").select("slug").eq("is_active", true)
      if (categoryError) throw new HttpError(500, "category_query_failed", "Could not validate categories")
      const active = new Set((categories || []).map((item) => String(item.slug)))
      for (const target of config.targets) if (!active.has(target.category_slug)) throw new HttpError(422, "inactive_or_unknown_category", `Inactive category: ${target.category_slug}`)
      const { error } = await serviceClient.from("app_settings").update({ value_json: config, updated_by: userData.user.id, updated_at: new Date().toISOString() }).eq("setting_key", "recipe_automation_config")
      if (error) throw new HttpError(500, "save_failed", "Could not save configuration")
      return response(200, { ok: true, config })
    }

    if (action === "run_now") {
      const { data, error } = await serviceClient.rpc("request_recipe_automation_manual_run_v1", { p_requested_by: userData.user.id })
      if (error) throw new HttpError(422, "manual_run_failed", String(error.message || "Could not request run").slice(0, 300))
      return response(200, { ok: true, result: data })
    }

    throw new HttpError(422, "invalid_action", "Unsupported action")
  } catch (error) {
    if (error instanceof HttpError) return response(error.status, { ok: false, error: { code: error.code, message: error.message } })
    console.error("recipe-automation-admin", error instanceof Error ? error.name : "UnknownError")
    return response(500, { ok: false, error: { code: "internal_error", message: "Unexpected server error" } })
  }
})

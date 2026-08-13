import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.95.0"

const MAX_BODY_BYTES = 64 * 1024
const MAX_CLOCK_SKEW_SECONDS = 300
const QUEUE_PREFIX = "recipe_cover_request:"
const MAX_BATCH = 10

class HttpError extends Error { constructor(public status: number, public code: string, message: string) { super(message) } }
function jsonResponse(status: number, payload: Record<string, unknown>) { return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } }) }
function env(name: string): string { const value = Deno.env.get(name)?.trim(); if (!value) throw new Error(`Missing server configuration: ${name}`); return value }
function isUuid(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) }
function bytesToHex(bytes: Uint8Array) { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("") }
function hexToBytes(hex: string) { if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2 !== 0) return new Uint8Array(); const bytes = new Uint8Array(hex.length / 2); for (let index = 0; index < hex.length; index += 2) bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16); return bytes }
function timingSafeEqual(left: Uint8Array, right: Uint8Array) { if (left.length !== right.length || left.length === 0) return false; let mismatch = 0; for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index]; return mismatch === 0 }
async function sha256Hex(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return bytesToHex(new Uint8Array(digest)) }
async function hmacSha256(secret: string, value: string) { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))) }

type QueueState = {
  version: 1; request_id: string; recipe_id: string; status: "pending" | "processing" | "succeeded" | "failed" | "skipped";
  request_source: "import" | "admin_single" | "admin_batch"; requested_by: string | null; force_regenerate: boolean; correlation_id: string;
  attempt_count: number; max_attempts: number; next_attempt_at: string; claimed_at: string | null; claimed_by: string | null; completed_at: string | null;
  model_used: string | null; prompt_used: string | null; image_url: string | null; storage_path: string | null; estimated_cost_usd: number | null;
  last_error_code: string | null; last_error_message: string | null; created_at: string; updated_at: string
}
function normalizeQueueState(value: unknown): QueueState | null { if (!value || typeof value !== "object" || Array.isArray(value)) return null; const raw = value as Record<string, unknown>; if (!isUuid(raw.request_id) || !isUuid(raw.recipe_id) || !isUuid(raw.correlation_id)) return null; if (!["pending", "processing", "succeeded", "failed", "skipped"].includes(String(raw.status || ""))) return null; return raw as unknown as QueueState }
function queueKey(recipeId: string) { return `${QUEUE_PREFIX}${recipeId}` }
function newQueueState(args: { recipeId: string; requestSource: QueueState["request_source"]; requestedBy?: string | null; forceRegenerate?: boolean; correlationId?: string }): QueueState { const now = new Date().toISOString(); return { version: 1, request_id: crypto.randomUUID(), recipe_id: args.recipeId, status: "pending", request_source: args.requestSource, requested_by: args.requestedBy || null, force_regenerate: args.forceRegenerate === true, correlation_id: isUuid(args.correlationId) ? args.correlationId : crypto.randomUUID(), attempt_count: 0, max_attempts: 3, next_attempt_at: now, claimed_at: null, claimed_by: null, completed_at: null, model_used: null, prompt_used: null, image_url: null, storage_path: null, estimated_cost_usd: null, last_error_code: null, last_error_message: null, created_at: now, updated_at: now } }

async function loadRecipeContext(client: SupabaseClient, recipeId: string) {
  const { data: recipe, error } = await client.from("recipes").select("id,title,subtitle,cover_image_url,category:recipe_categories(name,slug)").eq("id", recipeId).single()
  if (error || !recipe) throw new HttpError(422, "recipe_not_found", "Recipe not found")
  const { data: ingredients, error: ingredientsError } = await client.from("recipe_ingredients").select("name,quantity_label,unit,sort_order").eq("recipe_id", recipeId).order("sort_order")
  if (ingredientsError) throw new HttpError(500, "ingredients_query_failed", "Could not load recipe ingredients")
  const { data: importRun } = await client.from("recipe_import_runs").select("payload").eq("recipe_id", recipeId).eq("status", "succeeded").order("completed_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(1).maybeSingle()
  const category = Array.isArray(recipe.category) ? recipe.category[0] : recipe.category
  const payload = importRun?.payload && typeof importRun.payload === "object" && !Array.isArray(importRun.payload) ? importRun.payload as Record<string, unknown> : {}
  return { recipe_id: recipe.id, title: String(recipe.title || ""), subtitle: String(recipe.subtitle || ""), category_name: String((category as Record<string, unknown> | null)?.name || ""), category_slug: String((category as Record<string, unknown> | null)?.slug || ""), current_cover_image_url: String(recipe.cover_image_url || ""), cover_image_prompt: String(payload.cover_image_prompt || ""), ingredients: (ingredients || []).map((item) => ({ name: String(item.name || ""), quantity_label: item.quantity_label ? String(item.quantity_label) : null, unit: item.unit ? String(item.unit) : null })) }
}

async function enqueue(client: SupabaseClient, args: { recipeId: string; requestSource: QueueState["request_source"]; requestedBy?: string | null; forceRegenerate?: boolean; correlationId?: string }) {
  const context = await loadRecipeContext(client, args.recipeId)
  if (context.current_cover_image_url && !args.forceRegenerate) return { accepted: false, reason: "cover_exists", status: "skipped", request: null }
  const key = queueKey(args.recipeId)
  const { data: existingRow, error: existingError } = await client.from("app_settings").select("setting_key,value_json,updated_at").eq("setting_key", key).maybeSingle()
  if (existingError) throw new HttpError(500, "queue_read_failed", "Could not read cover queue")
  const existing = normalizeQueueState(existingRow?.value_json)
  if (existing && ["pending", "processing"].includes(existing.status)) return { accepted: false, reason: "already_queued", status: existing.status, request: existing }
  const state = newQueueState(args)
  const { error: upsertError } = await client.from("app_settings").upsert({ setting_key: key, value_json: state, description: "Operational state for AI recipe cover generation. Managed server-side.", updated_by: args.requestedBy || null, updated_at: state.updated_at }, { onConflict: "setting_key" })
  if (upsertError) throw new HttpError(500, "queue_write_failed", "Could not enqueue cover generation")
  return { accepted: true, reason: null, status: "pending", request: state }
}

async function recoverStaleClaims(client: SupabaseClient, rows: Array<{ setting_key: string; value_json: unknown; updated_at: string }>) {
  const staleBefore = Date.now() - 10 * 60 * 1000
  for (const row of rows) {
    const state = normalizeQueueState(row.value_json)
    if (!state || state.status !== "processing" || !state.claimed_at) continue
    const claimedAt = new Date(state.claimed_at).getTime()
    if (!Number.isFinite(claimedAt) || claimedAt > staleBefore) continue
    const now = new Date().toISOString()
    const exhausted = state.attempt_count >= state.max_attempts
    const recovered: QueueState = { ...state, status: exhausted ? "failed" : "pending", claimed_at: exhausted ? state.claimed_at : null, claimed_by: exhausted ? state.claimed_by : null, completed_at: exhausted ? now : null, next_attempt_at: exhausted ? state.next_attempt_at : now, last_error_code: "stale_claim_recovered", last_error_message: exhausted ? "Cover generation claim expired and maximum attempts were reached." : "Cover generation claim expired and was safely requeued.", updated_at: now }
    const { data: changed } = await client.from("app_settings").update({ value_json: recovered, updated_at: now }).eq("setting_key", row.setting_key).eq("updated_at", row.updated_at).select("setting_key").maybeSingle()
    if (changed && exhausted) await client.from("cron_execution_logs").insert({ job_name: "recipe_cover_generation", status: "failed", processed_count: 0, metadata_json: { request_id: state.request_id, recipe_id: state.recipe_id, request_source: state.request_source, attempts: state.attempt_count, error_code: "stale_claim_recovered" } })
  }
}

async function conditionalClaim(client: SupabaseClient, row: { setting_key: string; value_json: unknown; updated_at: string }, workerId: string) {
  const state = normalizeQueueState(row.value_json)
  if (!state || state.status !== "pending" || new Date(state.next_attempt_at).getTime() > Date.now() || state.attempt_count >= state.max_attempts) return null
  const context = await loadRecipeContext(client, state.recipe_id)
  if (context.current_cover_image_url && !state.force_regenerate) {
    const skipped: QueueState = { ...state, status: "skipped", completed_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_error_code: "cover_exists", last_error_message: "Recipe already has a cover image." }
    await client.from("app_settings").update({ value_json: skipped, updated_at: skipped.updated_at }).eq("setting_key", row.setting_key).eq("updated_at", row.updated_at)
    return null
  }
  const now = new Date().toISOString()
  const claimed: QueueState = { ...state, status: "processing", attempt_count: state.attempt_count + 1, claimed_at: now, claimed_by: workerId.slice(0, 120), updated_at: now, last_error_code: null, last_error_message: null }
  const { data: claimedRow, error } = await client.from("app_settings").update({ value_json: claimed, updated_at: now }).eq("setting_key", row.setting_key).eq("updated_at", row.updated_at).select("setting_key,value_json,updated_at").maybeSingle()
  if (error || !claimedRow) return null
  return { ...context, request_id: claimed.request_id, correlation_id: claimed.correlation_id, request_source: claimed.request_source, force_regenerate: claimed.force_regenerate, attempt_count: claimed.attempt_count, max_attempts: claimed.max_attempts }
}

async function failRequest(client: SupabaseClient, args: { recipeId: string; requestId: string; errorCode: string; errorMessage: string; retryable: boolean }) {
  const key = queueKey(args.recipeId)
  const { data: row, error } = await client.from("app_settings").select("setting_key,value_json,updated_at").eq("setting_key", key).single()
  if (error || !row) throw new HttpError(422, "request_not_found", "Cover request not found")
  const state = normalizeQueueState(row.value_json)
  if (!state || state.request_id !== args.requestId) throw new HttpError(409, "request_mismatch", "Cover request mismatch")
  if (state.status === "succeeded") return state
  const retry = args.retryable && state.attempt_count < state.max_attempts
  const delaySeconds = Math.min(300, 30 * 2 ** Math.max(state.attempt_count - 1, 0))
  const now = new Date()
  const updated: QueueState = { ...state, status: retry ? "pending" : "failed", next_attempt_at: retry ? new Date(now.getTime() + delaySeconds * 1000).toISOString() : state.next_attempt_at, claimed_at: retry ? null : state.claimed_at, claimed_by: retry ? null : state.claimed_by, completed_at: retry ? null : now.toISOString(), last_error_code: (args.errorCode || "image_generation_failed").slice(0, 120), last_error_message: (args.errorMessage || "Image generation failed.").slice(0, 1000), updated_at: now.toISOString() }
  const { error: updateError } = await client.from("app_settings").update({ value_json: updated, updated_at: updated.updated_at }).eq("setting_key", key).eq("updated_at", row.updated_at)
  if (updateError) throw new HttpError(409, "request_changed", "Cover request changed while failing")
  if (!retry) await client.from("cron_execution_logs").insert({ job_name: "recipe_cover_generation", status: "failed", processed_count: 0, metadata_json: { request_id: state.request_id, recipe_id: state.recipe_id, request_source: state.request_source, attempts: state.attempt_count, error_code: updated.last_error_code } })
  return updated
}

Deno.serve(async (request: Request) => {
  let correlationId: string | null = null
  try {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "Only POST is accepted")
    const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
    if (contentType !== "application/json") throw new HttpError(415, "unsupported_media_type", "Content-Type must be application/json")
    const timestampHeader = request.headers.get("x-cardappio-timestamp")?.trim() || ""
    const nonce = request.headers.get("x-cardappio-nonce")?.trim() || ""
    const signatureHex = request.headers.get("x-cardappio-signature")?.trim().toLowerCase() || ""
    const timestamp = Number.parseInt(timestampHeader, 10)
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > MAX_CLOCK_SKEW_SECONDS) throw new HttpError(401, "stale_request", "Request timestamp is invalid or expired")
    if (!/^[0-9a-f-]{16,128}$/i.test(nonce) || !/^[a-f0-9]{64}$/.test(signatureHex)) throw new HttpError(401, "invalid_signature", "Invalid signed request")
    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) throw new HttpError(413, "payload_too_large", "Request body is too large")
    const expectedSignature = await hmacSha256(env("CARDAPPIO_N8N_HMAC_SECRET"), `${timestampHeader}.${nonce}.${await sha256Hex(rawBody)}`)
    if (!timingSafeEqual(hexToBytes(signatureHex), expectedSignature)) throw new HttpError(401, "invalid_signature", "Request signature is invalid")
    let body: Record<string, unknown>; try { body = JSON.parse(rawBody) } catch { throw new HttpError(400, "invalid_json", "Request body is not valid JSON") }
    correlationId = isUuid(body.correlation_id) ? body.correlation_id : null
    const client = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    const expiresAt = new Date((timestamp + MAX_CLOCK_SKEW_SECONDS * 2) * 1000).toISOString()
    const { data: nonceClaimed, error: nonceError } = await client.rpc("claim_recipe_import_nonce_v1", { p_nonce: nonce, p_correlation_id: correlationId || crypto.randomUUID(), p_expires_at: expiresAt })
    if (nonceError) throw new HttpError(500, "nonce_storage_failed", "Could not validate replay protection")
    if (nonceClaimed !== true) throw new HttpError(409, "replayed_request", "This signed request has already been used")

    const action = String(body.action || "")
    if (action === "enqueue" || action === "enqueue_and_claim") {
      if (!isUuid(body.recipe_id)) throw new HttpError(422, "invalid_recipe_id", "recipe_id must be UUID")
      const queued = await enqueue(client, { recipeId: body.recipe_id, requestSource: "import", requestedBy: null, forceRegenerate: false, correlationId: correlationId || undefined })
      if (action === "enqueue") return jsonResponse(200, { ok: true, correlation_id: correlationId, result: queued })
      if (!queued.request) return jsonResponse(200, { ok: true, correlation_id: correlationId, result: { queued, claim: null } })
      const { data: row } = await client.from("app_settings").select("setting_key,value_json,updated_at").eq("setting_key", queueKey(body.recipe_id)).single()
      const claim = row ? await conditionalClaim(client, row, String(body.worker_id || "n8n-v21")) : null
      return jsonResponse(200, { ok: true, correlation_id: correlationId, result: { queued, claim } })
    }

    if (action === "claim") {
      const limit = Math.max(1, Math.min(MAX_BATCH, Number(body.limit || 5)))
      const workerId = String(body.worker_id || "n8n-cover-worker").trim() || "n8n-cover-worker"
      const { data: rows, error } = await client.from("app_settings").select("setting_key,value_json,updated_at").like("setting_key", `${QUEUE_PREFIX}%`).order("updated_at", { ascending: true }).limit(50)
      if (error) throw new HttpError(500, "queue_read_failed", "Could not read cover queue")
      await recoverStaleClaims(client, rows || [])
      const { data: refreshedRows, error: refreshedError } = await client.from("app_settings").select("setting_key,value_json,updated_at").like("setting_key", `${QUEUE_PREFIX}%`).order("updated_at", { ascending: true }).limit(50)
      if (refreshedError) throw new HttpError(500, "queue_read_failed", "Could not refresh cover queue")
      const claims = []
      for (const row of refreshedRows || []) { if (claims.length >= limit) break; const claim = await conditionalClaim(client, row, workerId); if (claim) claims.push(claim) }
      return jsonResponse(200, { ok: true, correlation_id: correlationId, result: { claimed: claims.length, requests: claims } })
    }

    if (action === "fail") {
      if (!isUuid(body.recipe_id) || !isUuid(body.request_id)) throw new HttpError(422, "invalid_request", "recipe_id and request_id must be UUID")
      const result = await failRequest(client, { recipeId: body.recipe_id, requestId: body.request_id, errorCode: String(body.error_code || "image_generation_failed"), errorMessage: String(body.error_message || "Image generation failed."), retryable: body.retryable !== false })
      return jsonResponse(200, { ok: true, correlation_id: correlationId, result })
    }
    throw new HttpError(422, "invalid_action", "Unsupported action")
  } catch (error) {
    if (error instanceof HttpError) return jsonResponse(error.status, { ok: false, correlation_id: correlationId, error: { code: error.code, message: error.message } })
    console.error("recipe-cover-runtime", error instanceof Error ? error.name : "UnknownError")
    return jsonResponse(500, { ok: false, correlation_id: correlationId, error: { code: "internal_error", message: "Unexpected server error" } })
  }
})

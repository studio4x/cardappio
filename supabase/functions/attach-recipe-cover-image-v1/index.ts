import { createClient } from "npm:@supabase/supabase-js@2.95.0"

const MAX_BODY_BYTES = 8 * 1024 * 1024
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_CLOCK_SKEW_SECONDS = 300
const QUEUE_PREFIX = "recipe_cover_request:"
const BUCKET = "system"

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  })
}

function env(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing server configuration: ${name}`)
  return value
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2 !== 0) return new Uint8Array()
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < hex.length; index += 2) bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16)
  return bytes
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length || left.length === 0) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index]
  return mismatch === 0
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return bytesToHex(new Uint8Array(digest))
}

async function hmacSha256(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))
}

function base64ToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9+/=\s]+$/.test(value)) throw new HttpError(422, "invalid_image_base64", "Image data is not valid base64")
  let binary: string
  try { binary = atob(value.replace(/\s/g, "")) } catch { throw new HttpError(422, "invalid_image_base64", "Image data is not valid base64") }
  if (binary.length < 32 || binary.length > MAX_IMAGE_BYTES) throw new HttpError(413, "invalid_image_size", "Generated image size is outside allowed limits")
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  throw new HttpError(422, "unsupported_image_type", "Only PNG, JPEG or WebP images are accepted")
}

function validateMagic(bytes: Uint8Array, mime: string) {
  if (mime === "image/png") {
    const sig = [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]
    if (!sig.every((byte, index) => bytes[index] === byte)) throw new HttpError(422, "image_signature_mismatch", "PNG signature mismatch")
    return
  }
  if (mime === "image/jpeg") {
    if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9)) throw new HttpError(422, "image_signature_mismatch", "JPEG signature mismatch")
    return
  }
  if (mime === "image/webp") {
    const riff = String.fromCharCode(...bytes.slice(0, 4))
    const webp = String.fromCharCode(...bytes.slice(8, 12))
    if (riff !== "RIFF" || webp !== "WEBP") throw new HttpError(422, "image_signature_mismatch", "WebP signature mismatch")
  }
}

Deno.serve(async (request: Request) => {
  let correlationId: string | null = null
  let recipeId: string | null = null
  let requestId: string | null = null
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

    let body: Record<string, unknown>
    try { body = JSON.parse(rawBody) } catch { throw new HttpError(400, "invalid_json", "Request body is not valid JSON") }
    if (!isUuid(body.correlation_id) || !isUuid(body.recipe_id) || !isUuid(body.request_id)) throw new HttpError(422, "invalid_payload", "correlation_id, recipe_id and request_id must be UUID")
    correlationId = body.correlation_id
    recipeId = body.recipe_id
    requestId = body.request_id

    const mimeType = String(body.mime_type || "").toLowerCase().trim()
    const extension = extensionForMime(mimeType)
    const imageBase64 = String(body.image_base64 || "")
    const imageBytes = base64ToBytes(imageBase64)
    validateMagic(imageBytes, mimeType)

    const modelUsed = String(body.model_used || "gemini-2.5-flash-image").slice(0, 120)
    const promptUsed = String(body.prompt_used || "").slice(0, 4000)
    const estimatedCost = Number(body.estimated_cost_usd)
    const estimatedCostUsd = Number.isFinite(estimatedCost) && estimatedCost >= 0 ? estimatedCost : null

    const client = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const expiresAt = new Date((timestamp + MAX_CLOCK_SKEW_SECONDS * 2) * 1000).toISOString()
    const { data: nonceClaimed, error: nonceError } = await client.rpc("claim_recipe_import_nonce_v1", {
      p_nonce: nonce,
      p_correlation_id: correlationId,
      p_expires_at: expiresAt,
    })
    if (nonceError) throw new HttpError(500, "nonce_storage_failed", "Could not validate replay protection")
    if (nonceClaimed !== true) throw new HttpError(409, "replayed_request", "This signed request has already been used")

    const settingKey = `${QUEUE_PREFIX}${recipeId}`
    const { data: queueRow, error: queueError } = await client.from("app_settings")
      .select("value_json,updated_at")
      .eq("setting_key", settingKey)
      .single()
    if (queueError || !queueRow?.value_json || typeof queueRow.value_json !== "object" || Array.isArray(queueRow.value_json)) throw new HttpError(422, "request_not_found", "Cover request not found")

    const queue = queueRow.value_json as Record<string, unknown>
    if (queue.request_id !== requestId || queue.correlation_id !== correlationId || queue.status !== "processing") throw new HttpError(409, "request_mismatch", "Cover request is not the active processing request")
    const forceRegenerate = queue.force_regenerate === true

    const { data: recipe, error: recipeError } = await client.from("recipes")
      .select("id,cover_image_url")
      .eq("id", recipeId)
      .single()
    if (recipeError || !recipe) throw new HttpError(422, "recipe_not_found", "Recipe not found")

    if (recipe.cover_image_url && !forceRegenerate) {
      const now = new Date().toISOString()
      const skipped = { ...queue, status: "skipped", completed_at: now, updated_at: now, last_error_code: "cover_exists", last_error_message: "Recipe already has a cover image." }
      await client.from("app_settings").update({ value_json: skipped, updated_at: now }).eq("setting_key", settingKey).eq("updated_at", queueRow.updated_at)
      return jsonResponse(200, { ok: true, correlation_id: correlationId, result: { recipe_id: recipeId, request_id: requestId, status: "skipped", reason: "cover_exists" } })
    }

    const storagePath = `recipes/automation/${recipeId}/${requestId}.${extension}`
    const { error: uploadError } = await client.storage.from(BUCKET).upload(storagePath, imageBytes, {
      contentType: mimeType,
      cacheControl: "31536000",
      upsert: true,
    })
    if (uploadError) throw new HttpError(500, "storage_upload_failed", "Could not store generated image")

    const { data: publicData } = client.storage.from(BUCKET).getPublicUrl(storagePath)
    const imageUrl = publicData.publicUrl
    if (!imageUrl) {
      await client.storage.from(BUCKET).remove([storagePath])
      throw new HttpError(500, "storage_url_failed", "Could not resolve generated image URL")
    }

    let updateQuery = client.from("recipes").update({ cover_image_url: imageUrl, updated_at: new Date().toISOString() }).eq("id", recipeId)
    if (!forceRegenerate) updateQuery = updateQuery.is("cover_image_url", null)
    const { data: updatedRecipe, error: updateError } = await updateQuery.select("id,cover_image_url").maybeSingle()

    if ((updateError || !updatedRecipe) && !forceRegenerate) {
      const { data: emptyCoverUpdated } = await client.from("recipes")
        .update({ cover_image_url: imageUrl, updated_at: new Date().toISOString() })
        .eq("id", recipeId)
        .eq("cover_image_url", "")
        .select("id,cover_image_url")
        .maybeSingle()
      if (!emptyCoverUpdated) {
        await client.storage.from(BUCKET).remove([storagePath])
        const { data: latestRecipe } = await client.from("recipes").select("cover_image_url").eq("id", recipeId).single()
        if (latestRecipe?.cover_image_url) {
          const now = new Date().toISOString()
          const skipped = { ...queue, status: "skipped", completed_at: now, updated_at: now, last_error_code: "cover_exists", last_error_message: "Recipe received a cover image before AI generation completed." }
          await client.from("app_settings").update({ value_json: skipped, updated_at: now }).eq("setting_key", settingKey)
          return jsonResponse(200, { ok: true, correlation_id: correlationId, result: { recipe_id: recipeId, request_id: requestId, status: "skipped", reason: "cover_exists" } })
        }
        throw new HttpError(500, "recipe_update_failed", "Could not attach cover image to recipe")
      }
    } else if (updateError || !updatedRecipe) {
      await client.storage.from(BUCKET).remove([storagePath])
      throw new HttpError(500, "recipe_update_failed", "Could not attach cover image to recipe")
    }

    const now = new Date().toISOString()
    const succeeded = {
      ...queue,
      status: "succeeded",
      completed_at: now,
      model_used: modelUsed,
      prompt_used: promptUsed,
      image_url: imageUrl,
      storage_path: storagePath,
      estimated_cost_usd: estimatedCostUsd,
      last_error_code: null,
      last_error_message: null,
      updated_at: now,
    }

    await client.from("app_settings").update({ value_json: succeeded, updated_at: now }).eq("setting_key", settingKey)
    await client.from("cron_execution_logs").insert({
      job_name: "recipe_cover_generation",
      status: "completed",
      processed_count: 1,
      metadata_json: {
        request_id: requestId,
        recipe_id: recipeId,
        request_source: queue.request_source || null,
        model_used: modelUsed,
        image_url: imageUrl,
        estimated_cost_usd: estimatedCostUsd,
      },
    })

    return jsonResponse(200, {
      ok: true,
      correlation_id: correlationId,
      result: {
        request_id: requestId,
        recipe_id: recipeId,
        status: "succeeded",
        image_url: imageUrl,
        storage_path: storagePath,
        model_used: modelUsed,
        estimated_cost_usd: estimatedCostUsd,
      },
    })
  } catch (error) {
    if (error instanceof HttpError) return jsonResponse(error.status, { ok: false, correlation_id: correlationId, recipe_id: recipeId, request_id: requestId, error: { code: error.code, message: error.message } })
    console.error("attach-recipe-cover-image-v1", error instanceof Error ? error.name : "UnknownError")
    return jsonResponse(500, { ok: false, correlation_id: correlationId, recipe_id: recipeId, request_id: requestId, error: { code: "internal_error", message: "Unexpected server error" } })
  }
})

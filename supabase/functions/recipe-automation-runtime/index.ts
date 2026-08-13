import { createClient } from "npm:@supabase/supabase-js@2.95.0"

const MAX_BODY_BYTES = 256 * 1024
const MAX_CLOCK_SKEW_SECONDS = 300

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

function response(status: number, payload: Record<string, unknown>) {
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
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2 !== 0) return new Uint8Array()
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16)
  }
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

Deno.serve(async (request: Request) => {
  let correlationId: string | null = null

  try {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "Only POST is accepted")
    const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
    if (contentType !== "application/json") throw new HttpError(415, "unsupported_media_type", "Content-Type must be application/json")

    const declaredLength = Number.parseInt(request.headers.get("content-length") || "0", 10)
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      throw new HttpError(413, "payload_too_large", "Request body is too large")
    }

    const timestampHeader = request.headers.get("x-cardappio-timestamp")?.trim() || ""
    const nonce = request.headers.get("x-cardappio-nonce")?.trim() || ""
    const signatureHex = request.headers.get("x-cardappio-signature")?.trim().toLowerCase() || ""
    const timestamp = Number.parseInt(timestampHeader, 10)
    const nowSeconds = Math.floor(Date.now() / 1000)

    if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > MAX_CLOCK_SKEW_SECONDS) {
      throw new HttpError(401, "stale_request", "Request timestamp is invalid or expired")
    }
    if (!/^[0-9a-f-]{16,128}$/i.test(nonce)) throw new HttpError(401, "invalid_nonce", "Request nonce is invalid")
    if (!/^[a-f0-9]{64}$/.test(signatureHex)) throw new HttpError(401, "invalid_signature", "Request signature is invalid")

    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      throw new HttpError(413, "payload_too_large", "Request body is too large")
    }

    const bodyHash = await sha256Hex(rawBody)
    const expectedSignature = await hmacSha256(
      env("CARDAPPIO_N8N_HMAC_SECRET"),
      `${timestampHeader}.${nonce}.${bodyHash}`,
    )

    if (!timingSafeEqual(hexToBytes(signatureHex), expectedSignature)) {
      throw new HttpError(401, "invalid_signature", "Request signature is invalid")
    }

    let decoded: unknown
    try {
      decoded = JSON.parse(rawBody)
    } catch {
      throw new HttpError(400, "invalid_json", "Request body is not valid JSON")
    }

    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
      throw new HttpError(422, "invalid_payload", "Request body must be an object")
    }

    const body = decoded as Record<string, unknown>
    correlationId = typeof body.correlation_id === "string" ? body.correlation_id : null
    if (!isUuid(correlationId)) throw new HttpError(422, "invalid_correlation_id", "correlation_id must be a UUID")

    const serviceClient = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const expiresAt = new Date((timestamp + MAX_CLOCK_SKEW_SECONDS * 2) * 1000).toISOString()
    const { data: nonceClaimed, error: nonceError } = await serviceClient.rpc("claim_recipe_import_nonce_v1", {
      p_nonce: nonce,
      p_correlation_id: correlationId,
      p_expires_at: expiresAt,
    })

    if (nonceError) throw new HttpError(500, "nonce_storage_failed", "Could not validate request replay protection")
    if (nonceClaimed !== true) throw new HttpError(409, "replayed_request", "This signed request has already been used")

    const action = typeof body.action === "string" ? body.action.trim() : ""

    if (action === "claim") {
      const { data, error } = await serviceClient.rpc("claim_recipe_automation_run_v1")
      if (error) throw new HttpError(500, "run_claim_failed", "Could not claim recipe automation run")
      return response(200, { ok: true, correlation_id: correlationId, result: data })
    }

    if (action === "complete") {
      if (!isUuid(body.run_id)) throw new HttpError(422, "invalid_run_id", "run_id must be a UUID")
      const status = typeof body.status === "string" ? body.status.trim() : ""
      if (!["completed", "partial", "failed", "no_candidates"].includes(status)) {
        throw new HttpError(422, "invalid_status", "Unsupported completion status")
      }

      const summary = body.summary && typeof body.summary === "object" && !Array.isArray(body.summary)
        ? body.summary
        : {}
      const { data, error } = await serviceClient.rpc("complete_recipe_automation_run_v1", {
        p_run_id: body.run_id,
        p_status: status,
        p_summary: summary,
      })

      if (error) throw new HttpError(500, "run_completion_failed", "Could not complete recipe automation run")
      return response(200, {
        ok: true,
        correlation_id: correlationId,
        result: { completed: data === true, run_id: body.run_id },
      })
    }

    throw new HttpError(422, "invalid_action", "Unsupported action")
  } catch (error) {
    if (error instanceof HttpError) {
      return response(error.status, {
        ok: false,
        correlation_id: correlationId,
        error: { code: error.code, message: error.message },
      })
    }

    console.error("recipe-automation-runtime failed", {
      correlation_id: correlationId,
      error_name: error instanceof Error ? error.name : "UnknownError",
    })
    return response(500, {
      ok: false,
      correlation_id: correlationId,
      error: { code: "internal_error", message: "Unexpected server error" },
    })
  }
})

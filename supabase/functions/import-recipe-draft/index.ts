import { createClient } from "npm:@supabase/supabase-js@2.95.0"

const MAX_BODY_BYTES = 256 * 1024
const MAX_CLOCK_SKEW_SECONDS = 300
const DEFAULT_ALLOWED_HOSTS = [
  "panelinha.com.br",
  "receitas.globo.com",
  "tudogostoso.com.br",
  "receiteria.com.br",
]

class HttpError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

interface ImportRequest {
  correlation_id: string
  source_url: string
  canonical_url: string
  content_hash: string
  recipe: Record<string, unknown>
}

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  })
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing server configuration: ${name}`)
  return value
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value)
}

function parseHttpsUrl(value: unknown, field: string): URL {
  if (typeof value !== "string" || value.length > 2048) {
    throw new HttpError(422, `invalid_${field}`, `${field} is invalid`)
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new HttpError(422, `invalid_${field}`, `${field} is invalid`)
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    throw new HttpError(422, `invalid_${field}`, `${field} must be an HTTPS URL without credentials`)
  }

  return url
}

function allowedHosts(): string[] {
  const configured = Deno.env.get("CARDAPPIO_RECIPE_SOURCE_HOSTS")
  const hosts = configured
    ? configured.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_ALLOWED_HOSTS

  return [...new Set(hosts.map((host) => host.replace(/^www\./, "")))]
}

function assertAllowedHost(url: URL): void {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "")
  const permitted = allowedHosts().some((host) => hostname === host || hostname.endsWith(`.${host}`))
  if (!permitted) {
    throw new HttpError(422, "source_host_not_allowed", "Recipe source host is not allowed")
  }
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2 !== 0) return new Uint8Array()
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length || left.length === 0) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index]
  }
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
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))
  return new Uint8Array(signature)
}

function validateRecipeEnvelope(value: unknown): ImportRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(422, "invalid_payload", "Request body must be an object")
  }

  const payload = value as Record<string, unknown>
  if (!isUuid(payload.correlation_id)) {
    throw new HttpError(422, "invalid_correlation_id", "correlation_id must be a UUID")
  }
  if (!isSha256(payload.content_hash)) {
    throw new HttpError(422, "invalid_content_hash", "content_hash must be a SHA-256 hex digest")
  }
  if (!payload.recipe || typeof payload.recipe !== "object" || Array.isArray(payload.recipe)) {
    throw new HttpError(422, "invalid_recipe", "recipe must be an object")
  }

  const sourceUrl = parseHttpsUrl(payload.source_url, "source_url")
  const canonicalUrl = parseHttpsUrl(payload.canonical_url, "canonical_url")
  assertAllowedHost(sourceUrl)
  assertAllowedHost(canonicalUrl)

  return {
    correlation_id: payload.correlation_id,
    source_url: sourceUrl.toString(),
    canonical_url: canonicalUrl.toString(),
    content_hash: payload.content_hash,
    recipe: payload.recipe as Record<string, unknown>,
  }
}

Deno.serve(async (request: Request) => {
  let parsedPayload: ImportRequest | null = null

  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "method_not_allowed", "Only POST is accepted")
    }

    const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
    if (contentType !== "application/json") {
      throw new HttpError(415, "unsupported_media_type", "Content-Type must be application/json")
    }

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
    if (!/^[0-9a-f-]{16,128}$/i.test(nonce)) {
      throw new HttpError(401, "invalid_nonce", "Request nonce is invalid")
    }
    if (!/^[a-f0-9]{64}$/.test(signatureHex)) {
      throw new HttpError(401, "invalid_signature", "Request signature is invalid")
    }

    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      throw new HttpError(413, "payload_too_large", "Request body is too large")
    }

    const bodyHash = await sha256Hex(rawBody)
    const signingValue = `${timestampHeader}.${nonce}.${bodyHash}`
    const expectedSignature = await hmacSha256(getRequiredEnv("CARDAPPIO_N8N_HMAC_SECRET"), signingValue)
    if (!timingSafeEqual(hexToBytes(signatureHex), expectedSignature)) {
      throw new HttpError(401, "invalid_signature", "Request signature is invalid")
    }

    let decoded: unknown
    try {
      decoded = JSON.parse(rawBody)
    } catch {
      throw new HttpError(400, "invalid_json", "Request body is not valid JSON")
    }
    parsedPayload = validateRecipeEnvelope(decoded)

    const computedContentHash = await sha256Hex(JSON.stringify(parsedPayload.recipe))
    if (computedContentHash !== parsedPayload.content_hash) {
      throw new HttpError(422, "content_hash_mismatch", "content_hash does not match recipe payload")
    }

    const serviceClient = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )

    const expiresAt = new Date((timestamp + MAX_CLOCK_SKEW_SECONDS * 2) * 1000).toISOString()
    const { data: nonceClaimed, error: nonceError } = await serviceClient.rpc(
      "claim_recipe_import_nonce_v1",
      {
        p_nonce: nonce,
        p_correlation_id: parsedPayload.correlation_id,
        p_expires_at: expiresAt,
      },
    )

    if (nonceError) {
      throw new HttpError(500, "nonce_storage_failed", "Could not validate request replay protection")
    }
    if (nonceClaimed !== true) {
      throw new HttpError(409, "replayed_request", "This signed request has already been used")
    }

    const { data, error } = await serviceClient.rpc("import_recipe_draft_v1", {
      p_payload: parsedPayload.recipe,
      p_correlation_id: parsedPayload.correlation_id,
      p_source_url: parsedPayload.source_url,
      p_canonical_url: parsedPayload.canonical_url,
      p_content_hash: parsedPayload.content_hash,
    })

    if (error) {
      const errorCode = error.code === "22023" ? "recipe_validation_failed" : "database_import_failed"
      await serviceClient.rpc("log_recipe_import_failure_v1", {
        p_payload: parsedPayload.recipe,
        p_correlation_id: parsedPayload.correlation_id,
        p_source_url: parsedPayload.source_url,
        p_canonical_url: parsedPayload.canonical_url,
        p_content_hash: parsedPayload.content_hash,
        p_error_code: errorCode,
        p_error_message: String(error.message || "Database rejected the import").slice(0, 1000),
      })

      throw new HttpError(
        error.code === "22023" ? 422 : 500,
        errorCode,
        error.code === "22023" ? "Recipe payload was rejected by database validation" : "Recipe import failed",
      )
    }

    const result = Array.isArray(data) ? data[0] : data
    if (!result?.result_import_id || !result?.result_recipe_id) {
      throw new HttpError(500, "invalid_database_response", "Recipe import returned an invalid result")
    }

    return jsonResponse(200, {
      ok: true,
      correlation_id: parsedPayload.correlation_id,
      result: {
        import_id: result.result_import_id,
        recipe_id: result.result_recipe_id,
        status: result.result_status,
        duplicate: result.result_status === "duplicate",
        duplicate_reason: result.duplicate_reason || null,
      },
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.status, {
        ok: false,
        correlation_id: parsedPayload?.correlation_id || null,
        error: { code: error.code, message: error.message },
      })
    }

    console.error("import-recipe-draft failed", {
      correlation_id: parsedPayload?.correlation_id || null,
      error_name: error instanceof Error ? error.name : "UnknownError",
    })

    return jsonResponse(500, {
      ok: false,
      correlation_id: parsedPayload?.correlation_id || null,
      error: { code: "internal_error", message: "Unexpected server error" },
    })
  }
})

import { createClient } from "npm:@supabase/supabase-js@2.95.0"

const MAX_CLOCK_SKEW_SECONDS = 300
const MAX_CANDIDATES = 60
const ALLOWED_HOSTS = ["panelinha.com.br", "receitas.globo.com", "tudogostoso.com.br", "receiteria.com.br"]

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}

const env = (name: string) => {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

const reply = (status: number, payload: Record<string, unknown>) => new Response(JSON.stringify(payload), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
})

const isUuid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
const fromHex = (hex: string) => {
  if (!/^[a-f0-9]{64}$/i.test(hex)) return new Uint8Array()
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
  return bytes
}
const safeEqual = (a: Uint8Array, b: Uint8Array) => {
  if (!a.length || a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) mismatch |= a[i] ^ b[i]
  return mismatch === 0
}
async function sha256(value: string) {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))))
}
async function sign(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))
}

function canonicalUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) throw new HttpError(422, "invalid_url", "Invalid URL")
  let url: URL
  try { url = new URL(value) } catch { throw new HttpError(422, "invalid_url", "Invalid URL") }
  if (url.protocol !== "https:" || url.username || url.password) throw new HttpError(422, "invalid_url", "HTTPS URL required")
  const host = url.hostname.toLowerCase().replace(/^www\./, "")
  if (!ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) throw new HttpError(422, "source_host_not_allowed", "Source host not allowed")
  return url.toString()
}

Deno.serve(async (request) => {
  let correlationId: string | null = null
  try {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "Only POST is accepted")
    const timestampHeader = request.headers.get("x-cardappio-timestamp")?.trim() || ""
    const nonce = request.headers.get("x-cardappio-nonce")?.trim() || ""
    const signature = request.headers.get("x-cardappio-signature")?.trim().toLowerCase() || ""
    const timestamp = Number.parseInt(timestampHeader, 10)
    const now = Math.floor(Date.now() / 1000)
    if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > MAX_CLOCK_SKEW_SECONDS) throw new HttpError(401, "stale_request", "Expired request")
    if (!/^[0-9a-f-]{16,128}$/i.test(nonce) || !/^[a-f0-9]{64}$/.test(signature)) throw new HttpError(401, "invalid_signature", "Invalid signed request")

    const raw = await request.text()
    const expected = await sign(env("CARDAPPIO_N8N_HMAC_SECRET"), `${timestampHeader}.${nonce}.${await sha256(raw)}`)
    if (!safeEqual(fromHex(signature), expected)) throw new HttpError(401, "invalid_signature", "Invalid signature")

    const body = JSON.parse(raw)
    correlationId = body?.correlation_id
    if (!isUuid(correlationId) || !Array.isArray(body?.candidates) || body.candidates.length > MAX_CANDIDATES) throw new HttpError(422, "invalid_payload", `At most ${MAX_CANDIDATES} candidates are accepted`)

    const seen = new Set<string>()
    const candidates = body.candidates.map((item: Record<string, unknown>, index: number) => {
      const themeKey = String(item?.theme_key || "").trim()
      const url = canonicalUrl(item?.canonical_url)
      const score = Number(item?.score)
      if (!/^[a-z0-9-]{1,80}$/.test(themeKey) || !Number.isFinite(score) || seen.has(url)) throw new HttpError(422, "invalid_candidate", `Invalid candidate ${index}`)
      seen.add(url)
      return { theme_key: themeKey, canonical_url: url, score }
    })

    const service = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    const expiresAt = new Date((timestamp + MAX_CLOCK_SKEW_SECONDS * 2) * 1000).toISOString()
    const { data: claimed, error: nonceError } = await service.rpc("claim_recipe_import_nonce_v1", { p_nonce: nonce, p_correlation_id: correlationId, p_expires_at: expiresAt })
    if (nonceError) throw new HttpError(500, "nonce_storage_failed", "Replay protection failed")
    if (claimed !== true) throw new HttpError(409, "replayed_request", "Request already used")

    const urls = candidates.map((item) => item.canonical_url)
    const known = new Set<string>()
    if (urls.length) {
      const { data, error } = await service.from("recipe_import_runs").select("canonical_url").eq("status", "succeeded").in("canonical_url", urls)
      if (error) throw new HttpError(500, "candidate_status_query_failed", "Candidate lookup failed")
      for (const row of data || []) if (row.canonical_url) known.add(String(row.canonical_url))
    }

    return reply(200, { ok: true, correlation_id: correlationId, result: { checked: candidates.length, candidates: candidates.map((item) => ({ canonical_url: item.canonical_url, known: known.has(item.canonical_url) })) } })
  } catch (error) {
    if (error instanceof HttpError) return reply(error.status, { ok: false, correlation_id: correlationId, error: { code: error.code, message: error.message } })
    return reply(500, { ok: false, correlation_id: correlationId, error: { code: "internal_error", message: "Unexpected server error" } })
  }
})

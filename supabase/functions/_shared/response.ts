/**
 * Standardized response helpers for Edge Functions
 * Per API_FUNCTIONS.md: _shared/response.ts
 */
import { corsHeaders } from './cors.ts'

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status)
}

export function unauthorizedResponse(): Response {
  return errorResponse('Não autorizado.', 401)
}

export function forbiddenResponse(): Response {
  return errorResponse('Sem permissão para essa ação.', 403)
}

export function notFoundResponse(entity = 'Recurso'): Response {
  return errorResponse(`${entity} não encontrado.`, 404)
}

/**
 * Gera um slug limpo e legível a partir de um texto/título.
 * Remove acentos, caracteres especiais, espaços duplicados e converte para minúsculas.
 */
export function slugify(text: string): string {
  if (!text) return ''
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos / acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres não alfanuméricos exceto espaço e hífen
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
}

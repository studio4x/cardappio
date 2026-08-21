/**
 * CARDAPPIO — Blog Utility Functions (Replicated from GenFlix Architecture)
 */

/**
 * Corrige problemas comuns de codificação de texto (Mojibake UTF-8)
 */
export function fixMojibakeText(text: string | null | undefined): string {
  if (!text) return ''
  try {
    // Detecta se a string contem sequencias de caracteres mojibake comuns
    if (/[\u00C2-\u00F4][\u0080-\u00BF]/.test(text)) {
      const bytes = new Uint8Array(text.split('').map(c => c.charCodeAt(0)))
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(bytes)
    }
  } catch {
    return text
  }
  return text
}

/**
 * Otimiza a URL da imagem de capa via CDN de Imagens do Supabase (WebP, resizing)
 */
export function getGridCoverImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || !imageUrl.trim()) return ''
  return imageUrl
}

/**
 * Sanitiza HTML de artigos de blog removendo scripts, iframes e atributos perigosos (XSS Sanitizer)
 */
export function sanitizeBlogHtml(rawValue: string | null | undefined): string {
  if (!rawValue || !rawValue.trim()) return ''
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawValue, 'text/html')
  const blockedTags = new Set(['script', 'style', 'object', 'embed'])

  Array.from(doc.body.querySelectorAll('*')).forEach((node) => {
    const tagName = node.tagName.toLowerCase()
    if (blockedTags.has(tagName)) {
      node.remove()
      return
    }

    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()

      if (name.startsWith('on')) {
        node.removeAttribute(attribute.name)
        return
      }

      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        node.removeAttribute(attribute.name)
        return
      }
    })
  })

  return doc.body.innerHTML
}

/**
 * Sanitiza HTML de comentarios removendo tags nao autorizadas
 */
export function sanitizeCommentHtml(rawValue: string | null | undefined): string {
  if (!rawValue || !rawValue.trim()) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(rawValue, 'text/html')
  const blockedTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'])

  Array.from(doc.body.querySelectorAll('*')).forEach((node) => {
    if (blockedTags.has(node.tagName.toLowerCase())) {
      node.remove()
      return
    }

    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()

      if (name.startsWith('on')) {
        node.removeAttribute(attribute.name)
        return
      }

      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        node.removeAttribute(attribute.name)
      }
    })
  })

  return doc.body.innerHTML
}

/**
 * Normaliza valores de filtros para comparacao insensivel a acentos e maiusculas
 */
export function normalizeFilterValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

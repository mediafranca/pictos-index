/**
 * ICAP v2 — Cómputo de hashes para identidad de versión
 *
 * Usado en src/ingest.ts para calcular utterance_hash, image_hash y content_hash
 * de cada ítem. La identidad de versión es la pieza sobre la que descansa cualquier
 * sello futuro: si el dibujo cambia o la frase cambia, el hash cambia.
 *
 * Usa Web Crypto API nativo del navegador (no requiere dependencia externa).
 */

/** SHA-256 de un string o buffer de bytes. Devuelve hex en minúsculas. */
export async function sha256(data: string | ArrayBuffer): Promise<string> {
  const bytes =
    typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Hash del contenido de una imagen.
 * Intenta obtener los bytes reales (fetch); si falla, hace hash de la URL como
 * proxy débil (p.ej. cuando CORS bloquea el fetch o la imagen no está disponible).
 *
 * ponytail: URL hash es proxy débil. Reemplazar con fetch real cuando las imágenes
 * estén disponibles localmente o CORS lo permita.
 */
export async function hashImage(imageRef: string): Promise<string> {
  // Data URIs ya tienen el contenido embebido — hashear la cadena directamente,
  // sin fetch. Evita parsear megabytes de base64 como ArrayBuffer.
  if (imageRef.startsWith('data:')) return sha256(imageRef)
  try {
    const resp = await fetch(imageRef, { mode: 'cors' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return sha256(await resp.arrayBuffer())
  } catch {
    return sha256(`url:${imageRef}`)
  }
}

/** Hash combinado de imagen + utterance. Éste es el content_hash del ítem. */
export async function contentHash(imageHash: string, utteranceHash: string): Promise<string> {
  return sha256(`${imageHash}:${utteranceHash}`)
}

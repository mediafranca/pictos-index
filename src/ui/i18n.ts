/**
 * ICAP v2 — i18n
 *
 * t('brand.name')            → 'ICAP'
 * t('comprehension.seal', { answer: 'Baño' }) → '...'
 *
 * La clave puede ser un path anidado con puntos. Si la clave no existe
 * devuelve la clave misma para que los errores sean visibles en pantalla.
 */

import messages from '../../locales/es-419.json'

type Vars = Record<string, string | number>

export function t(key: string, vars?: Vars): string {
  const parts = key.split('.')
  let node: unknown = messages
  for (const p of parts) {
    if (typeof node !== 'object' || node === null) return key
    node = (node as Record<string, unknown>)[p]
    if (node === undefined) return key
  }
  if (typeof node !== 'string') return key
  if (!vars) return node
  return node.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? `{{${k}}}`))
}

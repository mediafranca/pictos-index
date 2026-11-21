/**
 * ICAP v2 — Adaptador PICTOS.net
 *
 * Usado en src/ingest.ts (regla ImportSource) para convertir el formato de
 * exportación de PICTOS.net al modelo interno de ICAP.
 *
 * Formato esperado: "Graph Module" — biblioteca JSON con campo `data` que
 * contiene un array de ítems. Cada ítem tiene al menos `id` y `UTTERANCE`.
 * La URL de imagen se deriva de los campos presentes en la fila.
 */

import type { EditorialMetadata } from '../types.ts'

// ─────────────────────────────────────────────
// Formato de exportación de PICTOS.net
// ─────────────────────────────────────────────

/** Biblioteca completa exportada de PICTOS.net. */
export interface PictosLibrary {
  id: string
  namespace?: string
  version?: string
  description?: string
  metadata?: {
    author?: string
    license?: string
    organization?: string
    language?: string
    published_at?: string
    [key: string]: unknown
  }
  data: PictosRow[]
}

/** Una fila del dump de PICTOS.net. Los campos opcionales dependen de la versión. */
export interface PictosRow {
  id: string
  UTTERANCE: string
  version?: string
  dated_at?: string
  image_url?: string
  bitmap_url?: string
  status?: string
  [key: string]: unknown
}

// ─────────────────────────────────────────────
// Validación del payload
// ─────────────────────────────────────────────

export class PictosParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PictosParseError'
  }
}

/**
 * Verifica que el payload tenga la forma mínima esperada y lo normaliza al
 * formato interno PictosLibrary. Maneja dos variantes:
 *
 *   - GraphModule (`data` array)        — formato de publicación estándar
 *   - pictonet_graph_dump (`rows` array) — exportación de PICTOS.net con
 *                                          imágenes embebidas como data URIs
 */
export function parsePictosLibrary(raw: unknown): PictosLibrary {
  if (!raw || typeof raw !== 'object') throw new PictosParseError('Payload no es un objeto')
  const obj = raw as Record<string, unknown>

  if (obj['type'] === 'pictonet_graph_dump') return normalizeGraphDump(obj)

  if (typeof obj['id'] !== 'string') throw new PictosParseError('Falta campo "id" en la biblioteca')
  if (!Array.isArray(obj['data'])) throw new PictosParseError('Falta campo "data" (array de ítems)')
  return obj as unknown as PictosLibrary
}

/**
 * Convierte el formato pictonet_graph_dump al formato interno PictosLibrary.
 * Las imágenes embebidas (bitmap data URIs) se usan directamente como image_ref.
 */
function normalizeGraphDump(obj: Record<string, unknown>): PictosLibrary {
  if (!Array.isArray(obj['rows'])) throw new PictosParseError('pictonet_graph_dump sin campo "rows"')

  const cfg = (typeof obj['config'] === 'object' && obj['config'])
    ? obj['config'] as Record<string, unknown>
    : {}

  const sourceId = typeof cfg['author'] === 'string'
    ? cfg['author']
    : `graph-dump-${String(obj['timestamp'] ?? Date.now())}`

  const rows = obj['rows'] as Array<Record<string, unknown>>

  return {
    id: sourceId,
    version: typeof obj['version'] === 'string' ? obj['version'] : '0.0.0',
    metadata: {
      ...(typeof cfg['author']  === 'string' ? { author:   cfg['author']  as string } : {}),
      ...(typeof cfg['license'] === 'string' ? { license:  cfg['license'] as string } : {}),
      ...(typeof cfg['lang']    === 'string' ? { language: cfg['lang']    as string } : {}),
    },
    data: rows.map(r => {
      const row: PictosRow = {
        id:        typeof r['id']        === 'string' ? r['id']        as string : '',
        UTTERANCE: typeof r['UTTERANCE'] === 'string' ? r['UTTERANCE'] as string : '',
      }
      if (typeof r['bitmap'] === 'string')  row.bitmap_url = r['bitmap']  as string
      if (typeof r['status'] === 'string')  row.status     = r['status']  as string
      return row
    }),
  }
}

// ─────────────────────────────────────────────
// Extracción de metadatos de la fuente
// ─────────────────────────────────────────────

export function pictosSourceId(lib: PictosLibrary): string {
  return lib.id
}

export function pictosSourceVersion(lib: PictosLibrary): string {
  return lib.version ?? '0.0.0'
}

export function pictosSchemaVersion(lib: PictosLibrary): string {
  // ponytail: la versión del schema se intenta detectar del payload; sin campo
  // explícito se devuelve 'unknown'. El informe de validación lo registrará
  // como finding de tipo schema_mismatch si hace falta.
  const meta = lib.metadata
  return (meta && typeof meta['schema_version'] === 'string')
    ? meta['schema_version']
    : 'unknown'
}

export function pictosMetadata(lib: PictosLibrary): EditorialMetadata {
  const m = lib.metadata ?? {}
  // exactOptionalPropertyTypes: solo incluir el campo si el valor es string no vacío
  const result: EditorialMetadata = {}
  if (typeof m['author'] === 'string') result.author = m['author']
  if (typeof m['license'] === 'string') result.license = m['license']
  if (typeof m['organization'] === 'string') result.organization = m['organization']
  if (typeof m['language'] === 'string') result.language = m['language']
  if (typeof m['published_at'] === 'string') result.published_at = m['published_at']
  return result
}

// ─────────────────────────────────────────────
// Extracción normalizada por fila
// ─────────────────────────────────────────────

export interface NormalizedRow {
  stable_id: string
  utterance: string
  image_ref: string
  item_version: string
  item_dated_at: string
  /** Sobreescrituras de metadatos respecto de la fuente, si las hay. */
  overrides?: EditorialMetadata
}

/**
 * Normaliza una fila de PICTOS.net al formato interno.
 * Devuelve null si la fila no tiene los campos mínimos (id + utterance + imagen).
 */
export function normalizeRow(row: PictosRow): NormalizedRow | null {
  if (!row.id || typeof row.id !== 'string') return null
  if (!row.UTTERANCE || typeof row.UTTERANCE !== 'string' || row.UTTERANCE.trim() === '') return null

  // Resolución de la referencia de imagen: imagen vectorial > bitmap > url genérica
  const image_ref =
    (typeof row['image_url'] === 'string' && row['image_url'])
    || (typeof row['bitmap_url'] === 'string' && row['bitmap_url'])
    || (typeof row['svg_url'] === 'string' && row['svg_url'])
    || null

  if (!image_ref) return null

  return {
    stable_id: row.id,
    utterance: row.UTTERANCE.trim(),
    image_ref,
    item_version: typeof row.version === 'string' ? row.version : '1.0.0',
    item_dated_at: typeof row.dated_at === 'string'
      ? row.dated_at
      : new Date().toISOString(),
  }
}

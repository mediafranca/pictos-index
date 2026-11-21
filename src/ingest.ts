/**
 * ICAP v2 — Reglas de ingesta (Fase 1)
 *
 * Implementa tres reglas del Allium:
 *   - ImportSource: crea Source, normaliza filas, genera Items y ValidationFindings
 *   - PublishImportReport: crea ImportReport, transiciona Source a 'validated'
 *   - scheduleGeometry: dispara el cómputo de Capa A sobre cada ítem (deferred)
 *
 * Todo importador entrega el mismo modelo interno (Source + Items + ImportReport),
 * de modo que añadir un nuevo formato de origen solo requiere un adaptador nuevo,
 * sin tocar estas reglas.
 *
 * Invariante NoSilentImport (del Allium): no se puede pasar de la ingesta sin que
 * exista el informe descargable que nombra toda exclusión.
 */

import { db, newId } from './store.ts'
import { sha256, hashImage, contentHash } from './hash.ts'
import {
  parsePictosLibrary,
  pictosSourceId,
  pictosSourceVersion,
  pictosSchemaVersion,
  pictosMetadata,
  normalizeRow,
  type PictosLibrary,
} from './adapters/pictos.ts'
import type {
  Source,
  Item,
  ImportReport,
  ValidationFinding,
  EditorialMetadata,
  FindingKind,
  RowOutcome,
} from './types.ts'

// ─────────────────────────────────────────────
// Tipos internos
// ─────────────────────────────────────────────

/** Finding pendiente de asignar report_id (se asigna en publishReport). */
interface PendingFinding {
  kind: FindingKind
  row_ref: string
  outcome: RowOutcome
  detail: string
}

/**
 * Resultado de procesar una fila: ítem creado (o no) más findings acumulados.
 * Un ítem parcialmente compatible (p.ej. con metadata_override) genera AMBOS
 * un ítem válido y un finding de tipo 'partially_compatible'.
 */
interface RowResult {
  item: Item | null
  findings: PendingFinding[]
}

// ─────────────────────────────────────────────
// Resultado público de la ingesta
// ─────────────────────────────────────────────

export interface IngestResult {
  source: Source
  report: ImportReport
  findings: ValidationFinding[]
  items: Item[]
}

// ─────────────────────────────────────────────
// Regla: ImportSource — biblioteca PICTOS.net
// ─────────────────────────────────────────────

/**
 * Ingesta una biblioteca de PICTOS.net.
 * Ejecuta la normalización completa, calcula hashes y genera el informe.
 * Lanza PictosParseError si el payload no tiene la estructura mínima.
 */
export async function importPictosLibrary(raw: unknown): Promise<IngestResult> {
  const lib = parsePictosLibrary(raw)

  const source: Source = {
    id: newId(),
    source_type: 'library',
    external_id: pictosSourceId(lib),
    external_version: pictosSourceVersion(lib),
    detected_schema_version: pictosSchemaVersion(lib),
    imported_at: new Date().toISOString(),
    metadata: pictosMetadata(lib),
    status: 'importing',
  }
  db.sources.set(source.id, source)

  const rowResults = await processRows(lib, source)
  const result = publishReport(source, lib.data.length, rowResults)

  // Transición: importing → validated
  // Invariante NoSilentImport garantizada: el informe existe antes de cambiar status
  source.status = 'validated'
  db.sources.set(source.id, source)

  // Disparar geometría en background (ComputeGeometry — deferred, no bloqueante)
  void scheduleGeometry(result.items)

  return result
}

// ─────────────────────────────────────────────
// Regla: ImportSource — pictograma suelto
// ─────────────────────────────────────────────

/**
 * Ingesta un pictograma suelto. Crea una Source de tipo 'single_item'.
 * Un ítem suelto no finge pertenecer a una biblioteca real.
 */
export async function importSingleItem(opts: {
  external_id: string
  utterance: string
  image_ref: string
  item_version?: string
  metadata?: EditorialMetadata
}): Promise<IngestResult> {
  const source: Source = {
    id: newId(),
    source_type: 'single_item',
    external_id: opts.external_id,
    external_version: opts.item_version ?? '1.0.0',
    detected_schema_version: 'single-item',
    imported_at: new Date().toISOString(),
    metadata: opts.metadata ?? {},
    status: 'importing',
  }
  db.sources.set(source.id, source)

  const rowResult = await processOneRow(
    {
      stable_id: opts.external_id,
      utterance: opts.utterance,
      image_ref: opts.image_ref,
      item_version: opts.item_version ?? '1.0.0',
      item_dated_at: new Date().toISOString(),
    },
    source,
    opts.external_id,
  )

  const result = publishReport(source, 1, [rowResult])

  source.status = 'validated'
  db.sources.set(source.id, source)

  if (result.items.length > 0) void scheduleGeometry(result.items)

  return result
}

// ─────────────────────────────────────────────
// Internos
// ─────────────────────────────────────────────

async function processRows(
  lib: PictosLibrary,
  source: Source,
): Promise<RowResult[]> {
  const seenIds = new Set<string>()

  return Promise.all(
    lib.data.map(async (row, idx) => {
      const rowRef = typeof row.id === 'string' ? row.id : `fila-${idx}`

      if (seenIds.has(rowRef)) {
        return {
          item: null,
          findings: [pending('duplicate_id', rowRef, 'invalid',
            `ID "${rowRef}" aparece más de una vez en el dump.`)],
        }
      }
      seenIds.add(rowRef)

      const normalized = normalizeRow(row)

      if (!normalized) {
        const kind: FindingKind = !row.id
          ? 'schema_mismatch'
          : !row.UTTERANCE || row.UTTERANCE.trim() === ''
          ? 'empty_utterance'
          : 'missing_image'
        return {
          item: null,
          findings: [pending(kind, rowRef, 'invalid', kindDetail(kind, rowRef))],
        }
      }

      return processOneRow(normalized, source, rowRef)
    }),
  )
}

async function processOneRow(
  row: {
    stable_id: string
    utterance: string
    image_ref: string
    item_version: string
    item_dated_at: string
    overrides?: EditorialMetadata
  },
  source: Source,
  rowRef: string,
): Promise<RowResult> {
  const findings: PendingFinding[] = []

  if (row.overrides) {
    findings.push(pending(
      'metadata_override', rowRef, 'partially_compatible',
      `El ítem "${rowRef}" declara metadatos propios que sobreescriben los de la fuente.`,
    ))
  }

  const item = await buildItem(source, row)

  if (!item) {
    findings.push(pending(
      'missing_image', rowRef, 'invalid',
      `No se pudo obtener ni hashear la imagen de "${rowRef}".`,
    ))
    return { item: null, findings }
  }

  return { item, findings }
}

/** Construye un Item con sus hashes y lo persiste en el store. */
async function buildItem(
  source: Source,
  row: {
    stable_id: string
    utterance: string
    image_ref: string
    item_version: string
    item_dated_at: string
    overrides?: EditorialMetadata
  },
): Promise<Item | null> {
  try {
    const utterance_hash = await sha256(row.utterance)
    const image_hash = await hashImage(row.image_ref)
    const content_hash = await contentHash(image_hash, utterance_hash)

    const item: Item = {
      id: newId(),
      source_id: source.id,
      stable_id: row.stable_id,
      item_version: row.item_version,
      item_dated_at: row.item_dated_at,
      utterance: row.utterance,
      utterance_hash,
      image_ref: row.image_ref,
      image_hash,
      content_hash,
      ...(row.overrides ? { overrides: row.overrides } : {}),
    }

    db.items.set(item.id, item)
    return item
  } catch {
    return null
  }
}

/** Regla PublishImportReport: consolida resultados, crea el informe y lo persiste. */
function publishReport(
  source: Source,
  rows_seen: number,
  rowResults: RowResult[],
): IngestResult {
  const items: Item[] = []
  const allPending: PendingFinding[] = []
  let valid_count = 0
  let partial_count = 0
  let invalid_count = 0

  for (const { item, findings } of rowResults) {
    const hasInvalid = findings.some(f => f.outcome === 'invalid')
    const hasPartial = findings.some(f => f.outcome === 'partially_compatible')

    if (item) {
      items.push(item)
      if (hasPartial) partial_count++
      else valid_count++
    } else {
      invalid_count++
    }

    allPending.push(...findings)
  }

  const report: ImportReport = {
    id: newId(),
    source_id: source.id,
    rows_seen,
    valid_count,
    partial_count,
    invalid_count,
  }
  db.importReports.set(report.id, report)

  const findings: ValidationFinding[] = allPending.map(f => {
    const vf: ValidationFinding = { id: newId(), report_id: report.id, ...f }
    db.validationFindings.set(vf.id, vf)
    return vf
  })

  return { source, report, findings, items }
}

/** Regla ComputeGeometry: cómputo de Capa A en background para cada ítem. */
async function scheduleGeometry(items: Item[]): Promise<void> {
  const { computeGeometry } = await import('./services/geometry.ts')
  for (const item of items) {
    try {
      const geometry = await computeGeometry(item.image_ref)
      if (geometry) {
        item.geometry = geometry
        db.items.set(item.id, item)
      }
    } catch {
      // geometry queda undefined; la interfaz lo muestra como "pendiente"
    }
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function pending(
  kind: FindingKind,
  row_ref: string,
  outcome: RowOutcome,
  detail: string,
): PendingFinding {
  return { kind, row_ref, outcome, detail }
}

function kindDetail(kind: FindingKind, rowRef: string): string {
  switch (kind) {
    case 'empty_utterance': return `La fila "${rowRef}" no tiene enunciado.`
    case 'missing_image':   return `La fila "${rowRef}" no tiene referencia de imagen.`
    case 'schema_mismatch': return `La fila "${rowRef}" no tiene campo "id".`
    default:                return `Error desconocido en la fila "${rowRef}".`
  }
}

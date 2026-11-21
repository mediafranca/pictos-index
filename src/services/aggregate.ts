/**
 * ICAP v2 — Servicio de agregado (Fase 7 — deferred)
 *
 * Especificado en icap.allium como `deferred AggregateComputation.recompute`.
 * Se dispara desde SealEvaluationRecord cada vez que entra evidencia nueva.
 *
 * El agregado NUNCA se mezcla con la evidencia original: vive en SourceAggregate,
 * un objeto separado. Garantía EvidenceNeverMixed (docs/GUARANTEES_UI.md).
 *
 * Pendiente de Fase 7: calcular cobertura, distribuciones, desacuerdo entre
 * evaluadores y contextos cubiertos.
 *
 * ponytail: stub. Reemplazar en Fase 7 cuando haya registros reales sobre los
 * cuales calcular, y cuando esté resuelta la pregunta abierta sobre cómo resumir
 * capa C entre registros con estados de ausencia mezclados.
 */

import { db, newId } from '../store.ts'
import type { SourceAggregate } from '../types.ts'

/**
 * Recalcula el SourceAggregate para una fuente dada.
 * Implementación actual: cobertura básica (ítems con registros / ítems totales).
 * El resto de las métricas espera Fase 7.
 */
export async function recomputeAggregate(source_id: string): Promise<SourceAggregate> {
  const sourceItems = db.itemsBySource(source_id)
  const items_total = sourceItems.length

  const evaluatorIds = new Set<string>()
  const protocolVersions = new Set<string>()
  const contexts = new Set<string>()
  const itemsWithRecords = new Set<string>()
  let record_count = 0
  let superseded_record_count = 0

  for (const item of sourceItems) {
    const records = db.recordsByItem(item.id).filter(r => r.status === 'sealed')
    if (records.length > 0) itemsWithRecords.add(item.id)

    for (const record of records) {
      record_count++
      if (record.item_content_hash !== item.content_hash) superseded_record_count++

      const session = db.evaluationSessions.get(record.session_id)
      if (session) {
        evaluatorIds.add(session.evaluator_id)
        protocolVersions.add(record.protocol_version)
        // Contexto resumido como string para deduplicar
        const ctx = record.context_override ?? session.context
        contexts.add(`${ctx.environment}/${ctx.target_population}`)
      }
    }
  }

  // Upsert del agregado para esta fuente
  const existing = [...db.sourceAggregates.values()].find(a => a.source_id === source_id)
  const aggregate: SourceAggregate = {
    id: existing?.id ?? newId(),
    source_id,
    items_total,
    items_with_records: itemsWithRecords.size,
    evaluator_count: evaluatorIds.size,
    record_count,
    protocol_versions_covered: [...protocolVersions],
    contexts_covered: [...contexts],
    superseded_record_count,
  }

  db.sourceAggregates.set(aggregate.id, aggregate)
  return aggregate
}

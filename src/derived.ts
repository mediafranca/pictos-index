/**
 * ICAP v2 — Propiedades derivadas del dominio
 *
 * Implementa los campos `derived` y las proyecciones del Allium como funciones
 * puras. No hay estado aquí: reciben entidades del store y devuelven un valor.
 *
 * Usado por la capa de presentación y por las reglas de exportación.
 */

import { CONFIG } from './config.ts'
import { db } from './store.ts'
import type {
  Item,
  Source,
  EvaluationRecord,
  EvaluationSession,
  SessionCalibration,
  FamilyReport,
  EditorialMetadata,
  Verdict,
  LearningProfile,
} from './types.ts'

// ─────────────────────────────────────────────
// Item — herencia de metadatos
// ─────────────────────────────────────────────

/** Vista resuelta de metadatos: override del ítem, o valor de la fuente. */
export function effectiveMetadata(item: Item, source: Source): Required<EditorialMetadata> {
  const s = source.metadata
  const o = item.overrides ?? {}
  return {
    author: o.author ?? s.author ?? '',
    license: o.license ?? s.license ?? '',
    organization: o.organization ?? s.organization ?? '',
    language: o.language ?? s.language ?? '',
    published_at: o.published_at ?? s.published_at ?? '',
  }
}

// ─────────────────────────────────────────────
// Item — veredicto determinista (Capa A + D)
// ─────────────────────────────────────────────

/**
 * A1: veto de grosor. El signo desaparece al reducirse si el trazo es
 * demasiado delgado respecto del diámetro de soporte.
 */
export function vetoStroke(item: Item): boolean {
  return item.geometry != null && item.geometry.stroke_pct < CONFIG.a1_stroke_min_pct
}

/**
 * D1: veto de confusabilidad. El ítem está en un par crítico de la familia.
 * Requiere que el FamilyReport esté calculado.
 */
export function vetoConfusable(item: Item, family: FamilyReport | undefined): boolean {
  if (!family) return false
  return db
    .pairsByFamily(family.id)
    .some(p => p.item_a_id === item.id || p.item_b_id === item.id)
}

/**
 * Veredicto determinista del ítem (nivel del ítem, no del evaluador).
 * A1 y D1 son pisos físicos, no predictores estadísticos.
 */
export function deterministicVerdict(
  item: Item,
  family: FamilyReport | undefined,
): { verdict: Verdict; veto_stroke: boolean; veto_confusable: boolean } {
  const veto_stroke = vetoStroke(item)
  const veto_confusable = vetoConfusable(item, family)
  return {
    verdict: veto_stroke || veto_confusable ? 'blocked' : 'admissible',
    veto_stroke,
    veto_confusable,
  }
}

/** Perfil compensatorio de Capa A (se reporta, no elimina). */
export function geometryProfile(item: Item) {
  const g = item.geometry
  if (!g) return null
  return {
    a2_ok: g.unlinked_units <= CONFIG.a2_units_max,
    // A3 es advertencia e hipótesis, nunca puntaje validado (decisión no negociable 10)
    a3_warning: g.closed_regions < CONFIG.a3_closed_regions_min,
    a4_ok: g.inferred_contour_pct <= CONFIG.a4_inferred_contour_max_pct,
  }
}

// ─────────────────────────────────────────────
// Item — proyecciones de registros
// ─────────────────────────────────────────────

/** Registros vigentes: sellados y anclados a la versión actual del ítem. */
export function currentRecords(item: Item) {
  return db
    .recordsByItem(item.id)
    .filter(r => r.status === 'sealed' && r.item_content_hash === item.content_hash)
}

/** Registros de versiones anteriores del ítem. */
export function supersededRecords(item: Item) {
  return db
    .recordsByItem(item.id)
    .filter(r => r.status === 'sealed' && r.item_content_hash !== item.content_hash)
}

// ─────────────────────────────────────────────
// EvaluationRecord — contexto efectivo y veto B2
// ─────────────────────────────────────────────

/** Contexto de evaluación efectivo: override del registro o contexto de sesión. */
export function effectiveContext(record: EvaluationRecord, session: EvaluationSession) {
  return record.context_override ?? session.context
}

/**
 * B2: veto de tamaño. El mismo pictograma puede aprobar para un tablero de
 * escritorio y fallar para señalética lejana: por eso este veto vive en el
 * registro, no en el ítem.
 */
export function vetoSize(record: EvaluationRecord, session: EvaluationSession): boolean {
  const ctx = effectiveContext(record, session)
  const measurement = db
    .thresholdsByRecord(record.id)
    .find(t => t.axis === 'size' && t.status === 'completed')
  if (!measurement || measurement.threshold == null) return false
  return measurement.threshold > ctx.presentation_size_px
}

/** Veredicto del registro (nivel de registro, depende de medición humana en contexto). */
export function recordVerdict(
  record: EvaluationRecord,
  session: EvaluationSession,
): { verdict: Verdict; veto_size: boolean } {
  const veto_size = vetoSize(record, session)
  return { verdict: veto_size ? 'blocked' : 'admissible', veto_size }
}

/** ¿El registro está anclado a la versión actual del ítem? */
export function pinnedToCurrent(record: EvaluationRecord, item: Item): boolean {
  return record.item_content_hash === item.content_hash
}

// ─────────────────────────────────────────────
// EvaluationSession — calibración
// ─────────────────────────────────────────────

/** La calibración es bloqueante: sin ella no se pueden abrir registros. */
export function isCalibrated(session: EvaluationSession): boolean {
  const cal = db.calibrationBySession(session.id)
  return cal != null && cal.status === 'anchors_revealed'
}

// ─────────────────────────────────────────────
// SessionCalibration — divergencia
// ─────────────────────────────────────────────

export function calibrationStats(calibration: SessionCalibration): {
  mean_signed: number
  mean_absolute: number
  diverges_notably: boolean
} {
  const responses = db.responsesByCalibration(calibration.id)
  if (responses.length === 0) {
    return { mean_signed: 0, mean_absolute: 0, diverges_notably: false }
  }

  const anchors = db.calibrationAnchors
  let sumSigned = 0
  let sumAbsolute = 0

  for (const r of responses) {
    const anchor = anchors.get(r.anchor_id)
    if (!anchor) continue
    const diff = r.given_score - anchor.anchor_score
    sumSigned += diff
    sumAbsolute += Math.abs(diff)
  }

  const n = responses.length
  const mean_signed = sumSigned / n
  const mean_absolute = sumAbsolute / n

  return {
    mean_signed,
    mean_absolute,
    diverges_notably: mean_absolute > CONFIG.calibration_divergence_flag,
  }
}

// ─────────────────────────────────────────────
// FamilyReport — D2
// ─────────────────────────────────────────────

export function d2Consistent(family: FamilyReport): boolean {
  return (
    family.cv_stroke_pct < CONFIG.d2_cv_max_pct &&
    family.cv_head_pct < CONFIG.d2_cv_max_pct &&
    family.cv_cardinal_pct < CONFIG.d2_cv_max_pct &&
    family.cv_entropy_pct < CONFIG.d2_cv_max_pct
  )
}

/** Los pares que superan el corte crítico derivado de la distribución. */
export function criticalPairs(family: FamilyReport) {
  return db.pairsByFamily(family.id).filter(p => p.r >= family.critical_r_cutoff)
}

// ─────────────────────────────────────────────
// Capa C — perfil de aprendibilidad (C1 × C4)
// ─────────────────────────────────────────────

/**
 * Cruce C1 × C4. opaque_but_learnable es un veredicto legítimo: los sistemas
 * de alta productividad composicional pagan opacidad inicial a cambio de
 * gramática visual generativa.
 */
export function learningProfile(
  c1_score: number,
  c4_score: number,
  floor = CONFIG.c_likert_floor,
): LearningProfile {
  const transparent = c1_score >= floor
  const learnable = c4_score >= floor
  if (transparent && learnable) return 'transparent_and_learnable'
  if (transparent && !learnable) return 'transparent_but_hard'
  if (!transparent && learnable) return 'opaque_but_learnable'
  return 'opaque_and_hard'
}

// ─────────────────────────────────────────────
// SourceAggregate
// ─────────────────────────────────────────────

export function coveragePct(
  items_with_records: number,
  items_total: number,
): number {
  if (items_total === 0) return 0
  return (items_with_records * 100) / items_total
}

// ─────────────────────────────────────────────
// Source
// ─────────────────────────────────────────────

/** ¿Todos los ítems de la fuente tienen geometría calculada? */
export function allGeometryComputed(source: Source): boolean {
  const items = db.itemsBySource(source.id)
  return items.length > 0 && items.every(i => i.geometry != null)
}

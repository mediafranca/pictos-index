/**
 * ICAP v2 — Semilla de conjunto de calibración (Fase de desarrollo)
 *
 * Crea un CalibrationSet mínimo a partir de los primeros ítems de la fuente
 * importada. Las anclas son propuestas sin calibrar (valor 3, punto central),
 * marcadas explícitamente como tales en el rationale.
 *
 * Un conjunto de calibración real requiere consenso empírico de expertos.
 * Este módulo es un andamiaje de desarrollo, no un conjunto de referencia.
 *
 * ponytail: anclas fijas en 3. Reemplazar con conjunto de referencia real
 * cuando esté disponible (carga desde JSON externo o endpoint).
 */

import { db, newId } from '../store.ts'
import { CONFIG } from '../config.ts'
import type { CalibrationSet, CalibrationCase, CalibrationAnchor, DimensionId } from '../types.ts'

const SEED_DIMS: DimensionId[] = [
  'c1_semantic',
  'c2_pragmatic',
  'c3_cultural',
  'c4_learnability',
]

const UNCALIBRATED_RATIONALE =
  'Propuesta sin calibrar. El valor 3 es el punto central de la escala Likert, ' +
  'no un consenso empírico sobre este ítem. Su divergencia con este valor es esperada ' +
  'y no indica error en su juicio.'

/**
 * Asegura que exista un CalibrationSet en el store.
 * Si ya existe uno para la fuente dada, lo devuelve sin crear nada nuevo.
 * Requiere que la fuente tenga al menos `calibration_min_responses` ítems.
 */
export function ensureCalibrationSet(sourceId: string): string {
  // Reusar si ya hay un set (una fuente → un set de calibración en esta sesión)
  const existing = [...db.calibrationSets.values()][0]
  if (existing) return existing.id

  const items = db.itemsBySource(sourceId)
  const count = Math.min(items.length, CONFIG.calibration_min_responses)
  if (count === 0) throw new Error('La fuente no tiene ítems para construir el conjunto de calibración.')
  if (count < CONFIG.calibration_min_responses) {
    throw new Error(
      `Se necesitan al menos ${CONFIG.calibration_min_responses} ítems; la fuente tiene ${items.length}.`,
    )
  }

  const set: CalibrationSet = {
    id: newId(),
    version: '1.0.0-seed',
    published_at: new Date().toISOString(),
  }
  db.calibrationSets.set(set.id, set)

  for (let i = 0; i < count; i++) {
    const item = items[i]!
    const dim = SEED_DIMS[i % SEED_DIMS.length]!

    const calCase: CalibrationCase = {
      id: newId(),
      calibration_set_id: set.id,
      label: item.utterance,
      image_ref: item.image_ref,
      utterance: item.utterance,
    }
    db.calibrationCases.set(calCase.id, calCase)

    const anchor: CalibrationAnchor = {
      id: newId(),
      case_id: calCase.id,
      dimension: dim,
      anchor_score: 3,
      rationale: UNCALIBRATED_RATIONALE,
    }
    db.calibrationAnchors.set(anchor.id, anchor)
  }

  return set.id
}

/**
 * Devuelve los casos del conjunto de calibración con sus anclas,
 * en el orden de presentación. Las anclas se devuelven aquí para
 * que la pantalla de calibración pueda iterar; los VALORES del ancla
 * solo se leen DESPUÉS de que el evaluador selle su respuesta.
 */
export interface CalibrationStep {
  anchorId: string
  caseId: string
  imageRef: string
  utterance: string
  dimension: DimensionId
}

export function getCalibrationSteps(setId: string): CalibrationStep[] {
  const cases = [...db.calibrationCases.values()].filter(c => c.calibration_set_id === setId)
  const steps: CalibrationStep[] = []

  for (const c of cases) {
    const anchors = [...db.calibrationAnchors.values()].filter(a => a.case_id === c.id)
    for (const a of anchors) {
      steps.push({
        anchorId: a.id,
        caseId:   c.id,
        imageRef: c.image_ref,
        utterance: c.utterance,
        dimension: a.dimension,
      })
    }
  }

  return steps
}

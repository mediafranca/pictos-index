/**
 * ICAP v2 — Reglas de calibración previa (Fase 2)
 *
 * Implementa tres reglas del Allium:
 *   - StartCalibration: abre la sesión de calibración en estado 'scoring'
 *   - RecordCalibrationResponse: registra una respuesta a ciegas (anclas ocultas)
 *   - RevealCalibrationAnchors: revela anclas + fundamento, fija la divergencia
 *
 * La calibración es BLOQUEANTE: sin ella no se pueden abrir registros de evaluación
 * (invariante RecordsComeFromCalibratedSessions). Es la única defensa disponible
 * contra la varianza entre jueces en un sitio abierto.
 *
 * Garantías del Allium implementadas aquí:
 *   - AnchorsHiddenWhileScoring: las funciones de calibración nunca devuelven
 *     anchor_score ni rationale mientras status = 'scoring'.
 *   - DivergenceNeverBlocks: RevealCalibrationAnchors no evalúa la magnitud de
 *     la divergencia; solo la fija como dato. El bloqueo sería un veto sobre
 *     la persona, sin evidencia que lo justifique.
 */

import { db, newId } from '../store.ts'
import { CONFIG } from '../config.ts'
import { PreconditionError } from '../errors.ts'
import type {
  SessionCalibration,
  CalibrationResponse,
} from '../types.ts'

// ─────────────────────────────────────────────
// StartCalibration
// ─────────────────────────────────────────────

/**
 * Abre la calibración de una sesión. Precondición: la sesión no tiene
 * calibración previa (cada sesión se calibra una sola vez).
 */
export function startCalibration(
  session_id: string,
  calibration_set_id: string,
): SessionCalibration {
  const existing = db.calibrationBySession(session_id)
  if (existing) {
    throw new PreconditionError(
      'StartCalibration',
      `La sesión ${session_id} ya tiene calibración (${existing.id}).`,
    )
  }

  const calibration: SessionCalibration = {
    id: newId(),
    session_id,
    calibration_set_id,
    status: 'scoring',
    started_at: new Date().toISOString(),
  }
  db.sessionCalibrations.set(calibration.id, calibration)
  return calibration
}

// ─────────────────────────────────────────────
// RecordCalibrationResponse
// ─────────────────────────────────────────────

/**
 * Registra o actualiza la respuesta a un ancla, emitida a ciegas.
 * Precondición: calibration.status = 'scoring' (las anclas siguen ocultas).
 *
 * Garantía AnchorsHiddenWhileScoring: esta función solo puede llamarse mientras
 * el estado es 'scoring'; RevealCalibrationAnchors la cierra y la transición es
 * irreversible.
 */
export function recordCalibrationResponse(
  calibration_id: string,
  anchor_id: string,
  given_score: number,
): CalibrationResponse {
  const calibration = db.sessionCalibrations.get(calibration_id)
  if (!calibration) throw new PreconditionError('RecordCalibrationResponse', `Calibración ${calibration_id} no encontrada.`)
  if (calibration.status !== 'scoring') {
    throw new PreconditionError(
      'RecordCalibrationResponse',
      `Las anclas ya fueron reveladas; no se puede modificar la respuesta.`,
    )
  }

  // Upsert: una respuesta por ancla (invariante OneCalibrationResponsePerAnchor)
  const responses = db.responsesByCalibration(calibration_id)
  const existing = responses.find(r => r.anchor_id === anchor_id)

  if (existing) {
    existing.given_score = given_score
    db.calibrationResponses.set(existing.id, existing)
    return existing
  }

  const response: CalibrationResponse = {
    id: newId(),
    calibration_id,
    anchor_id,
    given_score,
  }
  db.calibrationResponses.set(response.id, response)
  return response
}

// ─────────────────────────────────────────────
// RevealCalibrationAnchors
// ─────────────────────────────────────────────

/**
 * Revela las anclas con su fundamento. Desde este momento:
 *   - La divergencia queda fijada como dato del registro (via derived.ts).
 *   - La calibración pasa a 'anchors_revealed' (terminal).
 *   - La sesión queda habilitada para abrir registros de evaluación.
 *
 * Precondiciones:
 *   - calibration.status = 'scoring'
 *   - Al menos config.calibration_min_responses respuestas emitidas
 *
 * Garantía DivergenceNeverBlocks: esta función no evalúa la magnitud de la
 * divergencia. Solo transiciona el estado y registra completed_at. El valor
 * se reporta pero nunca bloquea (ver derived.ts::calibrationStats).
 */
export function revealCalibrationAnchors(calibration_id: string): SessionCalibration {
  const calibration = db.sessionCalibrations.get(calibration_id)
  if (!calibration) throw new PreconditionError('RevealCalibrationAnchors', `Calibración ${calibration_id} no encontrada.`)
  if (calibration.status !== 'scoring') {
    throw new PreconditionError(
      'RevealCalibrationAnchors',
      `La calibración ya está en estado '${calibration.status}'.`,
    )
  }

  const responseCount = db.responsesByCalibration(calibration_id).length
  if (responseCount < CONFIG.calibration_min_responses) {
    throw new PreconditionError(
      'RevealCalibrationAnchors',
      `Se necesitan al menos ${CONFIG.calibration_min_responses} respuestas; hay ${responseCount}.`,
    )
  }

  calibration.status = 'anchors_revealed'
  calibration.completed_at = new Date().toISOString()
  db.sessionCalibrations.set(calibration.id, calibration)
  return calibration
}

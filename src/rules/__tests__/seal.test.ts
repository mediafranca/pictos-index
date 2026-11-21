/**
 * Criterio de término Fase 2: abrir, completar y sellar un registro.
 * Verifica que ninguna ruta de escritura opere sobre un registro sellado.
 *
 * Ejecutar: node --experimental-vm-modules node_modules/.bin/vitest run
 * (o añadir vitest a devDependencies y correr con npm test)
 *
 * Este archivo es el cheque mínimo del criterio de la Fase 2. No cubre
 * todos los paths, solo los que importan para la garantía de inmutabilidad.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { db, newId } from '../../store.ts'
import { createEvaluatorProfile, createEvaluationSession } from '../session.ts'
import {
  startCalibration,
  recordCalibrationResponse,
  revealCalibrationAnchors,
} from '../calibration.ts'
import {
  openEvaluationRecord,
  recordSpontaneousResponse,
  revealTargetPhrase,
  recordDimensionResponse,
  sealEvaluationRecord,
  skipSpontaneousResponse,
} from '../evaluation.ts'
import { PreconditionError, InvariantError } from '../../errors.ts'
import type {
  CalibrationSet,
  CalibrationCase,
  CalibrationAnchor,
  Source,
  Item,
} from '../../types.ts'

// ─────────────────────────────────────────────
// Fixtures mínimos
// ─────────────────────────────────────────────

function seedStore() {
  // Fuente y ítem mínimos
  const source: Source = {
    id: newId(), source_type: 'library', external_id: 'test-lib',
    external_version: '1.0', detected_schema_version: '1.0',
    imported_at: new Date().toISOString(), metadata: {}, status: 'analysed',
  }
  db.sources.set(source.id, source)

  const item: Item = {
    id: newId(), source_id: source.id, stable_id: 'IMG-001',
    item_version: '1.0', item_dated_at: new Date().toISOString(),
    utterance: 'Quiero ir al baño',
    utterance_hash: 'abc123', image_ref: '/img/001.svg',
    image_hash: 'def456', content_hash: 'ghi789',
  }
  db.items.set(item.id, item)

  // Conjunto de calibración mínimo (4 anclas = calibration_min_responses)
  const calSet: CalibrationSet = { id: newId(), version: '1.0.0', published_at: new Date().toISOString() }
  db.calibrationSets.set(calSet.id, calSet)

  const dims = ['c1_semantic', 'c2_pragmatic', 'c3_cultural', 'c4_learnability'] as const
  const calCase: CalibrationCase = {
    id: newId(), calibration_set_id: calSet.id,
    label: 'Caso de referencia', image_ref: '/cal/001.svg',
    utterance: 'Quiero agua',
  }
  db.calibrationCases.set(calCase.id, calCase)

  const anchors: CalibrationAnchor[] = dims.map(d => ({
    id: newId(), case_id: calCase.id, dimension: d,
    anchor_score: 3, rationale: 'Valor de referencia consensuado.',
  }))
  anchors.forEach(a => db.calibrationAnchors.set(a.id, a))

  return { source, item, calSet, anchors }
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('Fase 2: ciclo de vida del registro', () => {
  let itemId: string
  let sessionId: string
  let calSetId: string
  let anchorIds: string[]

  beforeEach(() => {
    // Limpiar store entre tests
    ;[db.sources, db.items, db.evaluatorProfiles, db.evaluationSessions,
      db.sessionCalibrations, db.calibrationSets, db.calibrationCases,
      db.calibrationAnchors, db.calibrationResponses, db.evaluationRecords,
      db.comprehensionMoments, db.dimensionResponses].forEach(m => m.clear())

    const { item, calSet, anchors } = seedStore()
    itemId = item.id
    calSetId = calSet.id
    anchorIds = anchors.map(a => a.id)

    const profile = createEvaluatorProfile({
      pseudonym: 'evaluador-1', age_range: '30-39', gender: 'no-binario',
      region: 'ES-CAT', primary_language: 'ca', aac_experience: 'profesional',
      role: 'profesional_caa', consent_version: '1.0', consent_scope: 'aggregated_public',
    })
    const session = createEvaluationSession({
      evaluator_id: profile.id, app_version: '2.0.0',
      context: {
        target_population: 'Adultos con TEA',
        communicative_task: 'solicitud',
        environment: 'escuela',
        modality: 'tablero',
        presentation_size_px: 120,
        label_shown: false,
      },
    })
    sessionId = session.id

    // Calibración mínima
    const cal = startCalibration(sessionId, calSetId)
    anchorIds.forEach(anchor_id => recordCalibrationResponse(cal.id, anchor_id, 3))
    revealCalibrationAnchors(cal.id)
  })

  it('flujo completo: abrir → respuesta espontánea → revelar → sellar', () => {
    const { record, moment } = openEvaluationRecord(sessionId, itemId, { skipSourceCheck: false })

    expect(record.status).toBe('in_progress')
    expect(moment.status).toBe('awaiting_spontaneous')
    expect(record.item_content_hash).toBe('ghi789')

    recordSpontaneousResponse(moment.id, {
      response: 'Un baño', language: 'es', seconds: 4, confidence: 4,
    })
    revealTargetPhrase(moment.id, 4)

    const sealed = sealEvaluationRecord(record.id)
    expect(sealed.status).toBe('sealed')
  })

  it('flujo con skip de respuesta espontánea', () => {
    const { record, moment } = openEvaluationRecord(sessionId, itemId, { skipSourceCheck: false })
    skipSpontaneousResponse(moment.id)
    expect(moment.status).toBe('spontaneous_closed')
    revealTargetPhrase(moment.id, 0)
    const sealed = sealEvaluationRecord(record.id)
    expect(sealed.status).toBe('sealed')
  })

  it('inmutabilidad: no se puede registrar respuesta sobre un registro sellado', () => {
    const { record, moment } = openEvaluationRecord(sessionId, itemId, { skipSourceCheck: false })
    recordSpontaneousResponse(moment.id, { response: 'Baño', language: 'es' })
    revealTargetPhrase(moment.id, 3)
    sealEvaluationRecord(record.id)

    expect(() =>
      recordDimensionResponse(record.id, 'c1_semantic', 'scored', 4)
    ).toThrow(PreconditionError)
  })

  it('inmutabilidad: no se puede sellar dos veces', () => {
    const { record, moment } = openEvaluationRecord(sessionId, itemId, { skipSourceCheck: false })
    recordSpontaneousResponse(moment.id, { response: 'Baño', language: 'es' })
    revealTargetPhrase(moment.id, 3)
    sealEvaluationRecord(record.id)

    expect(() => sealEvaluationRecord(record.id)).toThrow(PreconditionError)
  })

  it('no se puede sellar sin completar el Momento 2', () => {
    const { record, moment } = openEvaluationRecord(sessionId, itemId, { skipSourceCheck: false })
    recordSpontaneousResponse(moment.id, { response: 'Baño', language: 'es' })
    // RevealTargetPhrase NO se llama

    expect(() => sealEvaluationRecord(record.id)).toThrow(PreconditionError)
  })

  it('no se puede abrir un registro sin calibración', () => {
    // Sesión nueva sin calibrar
    const profile2 = createEvaluatorProfile({
      pseudonym: 'eval-2', age_range: '20-29', gender: 'mujer', region: 'ES',
      primary_language: 'es', aac_experience: 'ninguna', role: 'usuario',
      consent_version: '1.0', consent_scope: 'private_only',
    })
    const uncalibratedSession = createEvaluationSession({
      evaluator_id: profile2.id, app_version: '2.0.0',
      context: { target_population: 'test', communicative_task: 'test',
        environment: 'test', modality: 'test', presentation_size_px: 100, label_shown: false },
    })

    expect(() =>
      openEvaluationRecord(uncalibratedSession.id, itemId, { skipSourceCheck: false })
    ).toThrow(PreconditionError)
  })

  it('invariante ScoredHasScore: score es obligatorio si state = scored', () => {
    const { record, moment } = openEvaluationRecord(sessionId, itemId, { skipSourceCheck: false })
    recordSpontaneousResponse(moment.id, { response: 'test', language: 'es' })

    expect(() =>
      recordDimensionResponse(record.id, 'c1_semantic', 'scored', undefined)
    ).toThrow(InvariantError)
  })

  it('invariante NotQualifiedHasReason: reason es obligatorio si state = not_qualified', () => {
    const { record, moment } = openEvaluationRecord(sessionId, itemId, { skipSourceCheck: false })
    recordSpontaneousResponse(moment.id, { response: 'test', language: 'es' })

    expect(() =>
      recordDimensionResponse(record.id, 'c1_semantic', 'not_qualified')
    ).toThrow(InvariantError)
  })
})

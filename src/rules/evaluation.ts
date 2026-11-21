/**
 * ICAP v2 — Reglas del ciclo de vida del registro de evaluación (Fase 2)
 *
 * Implementa nueve reglas del Allium:
 *   - OpenEvaluationRecord: abre el registro y crea el momento de comprensión
 *   - RecordSpontaneousResponse / SkipSpontaneousResponse: Momento 1
 *   - RevealTargetPhrase: Momento 2 (la frase objetivo llega aquí, no antes)
 *   - CodeSpontaneousResponse: codificación posterior, por un tercero
 *   - RecordDimensionResponse: Capa C con estados tipados de ausencia
 *   - recordThresholdPass: Capa B, despacha descendente o ascendente según status
 *   - AddNote: nota tipada con visibilidad explícita
 *   - SealEvaluationRecord: sellado irreversible, dispara RecomputeAggregate
 *
 * La inmutabilidad del registro sellado es ESTRUCTURAL, no depende de la
 * interfaz: ninguna regla de escritura acepta un registro con status = 'sealed'
 * en su precondición. El endpoint que implemente estas reglas hereda esa garantía.
 *
 * Garantía NoSilentRewrite: el control de edición debe RETIRARSE del árbol al
 * sellar, no deshabilitarse (ver docs/GUARANTEES_UI.md).
 */

import { db, newId } from '../store.ts'
import { CONFIG } from '../config.ts'
import { isCalibrated } from '../derived.ts'
import { PreconditionError, InvariantError } from '../errors.ts'
import type {
  EvaluationRecord,
  ComprehensionMoment,
  DimensionResponse,
  ThresholdMeasurement,
  Note,
  DimensionId,
  ResponseState,
  ThresholdAxis,
  NoteType,
  Visibility,
  ResponseCoding,
} from '../types.ts'

// ─────────────────────────────────────────────
// OpenEvaluationRecord
// ─────────────────────────────────────────────

/**
 * Abre un registro de evaluación. Congela la versión del ítem mediante
 * item_content_hash en el momento de apertura. Si el ítem cambia después,
 * este registro sigue siendo evidencia válida sobre la versión antigua.
 *
 * Precondiciones (del Allium):
 *   - item.source.status = 'analysed' (capa A y D calculadas)
 *   - session.is_calibrated (calibración previa completada)
 *
 * Nota Fase 2/3: la fuente solo alcanza 'analysed' cuando computeGeometry y
 * FamilyAnalysis.compute completan (stubs en Fase 2). Para desarrollo, el
 * parámetro skipSourceCheck omite esta precondición temporalmente.
 */
export function openEvaluationRecord(
  session_id: string,
  item_id: string,
  { skipSourceCheck = false } = {},
): { record: EvaluationRecord; moment: ComprehensionMoment } {
  const session = db.evaluationSessions.get(session_id)
  if (!session) throw new PreconditionError('OpenEvaluationRecord', `Sesión ${session_id} no encontrada.`)

  if (!isCalibrated(session)) {
    throw new PreconditionError(
      'OpenEvaluationRecord',
      'La sesión no está calibrada. Completar la calibración previa antes de evaluar.',
    )
  }

  const item = db.items.get(item_id)
  if (!item) throw new PreconditionError('OpenEvaluationRecord', `Ítem ${item_id} no encontrado.`)

  if (!skipSourceCheck) {
    const source = db.sources.get(item.source_id)
    if (!source || source.status !== 'analysed') {
      throw new PreconditionError(
        'OpenEvaluationRecord',
        `La fuente del ítem no está en estado 'analysed' (estado actual: '${source?.status ?? 'no encontrada'}'). Las capas A y D deben completarse antes de evaluar.`,
      )
    }
  }

  const calibration = db.calibrationBySession(session_id)
  if (!calibration) throw new PreconditionError('OpenEvaluationRecord', 'No se encontró calibración de sesión.')

  const calibration_set = db.calibrationSets.get(calibration.calibration_set_id)
  if (!calibration_set) throw new PreconditionError('OpenEvaluationRecord', 'No se encontró el conjunto de calibración.')

  const record: EvaluationRecord = {
    id: newId(),
    item_id,
    session_id,
    item_content_hash: item.content_hash,
    source_id: item.source_id,
    source_version: db.sources.get(item.source_id)?.external_version ?? '',
    protocol_version: session.protocol_version,
    rubric_version: session.rubric_version,
    calibration_set_version: calibration_set.version,
    schema_version: CONFIG.schema_version,
    created_at: new Date().toISOString(),
    status: 'in_progress',
  }
  db.evaluationRecords.set(record.id, record)

  const moment: ComprehensionMoment = {
    id: newId(),
    record_id: record.id,
    status: 'awaiting_spontaneous',
    spontaneous_skipped: false,
  }
  db.comprehensionMoments.set(moment.id, moment)

  return { record, moment }
}

// ─────────────────────────────────────────────
// RecordSpontaneousResponse — Momento 1
// ─────────────────────────────────────────────

/**
 * Registra la respuesta espontánea al pictograma (Momento 1).
 * Al cerrarse, el estado pasa a 'spontaneous_closed' y no hay transición de
 * vuelta: la prohibición de reescribir en silencio es estructural.
 *
 * Garantía TargetPhraseHidden: la frase objetivo no se expone en Momento 1.
 * El caller debe pedir solo los campos de SpontaneousComprehension surface.
 */
export function recordSpontaneousResponse(
  moment_id: string,
  opts: {
    response: string
    language: string
    seconds?: number
    confidence?: number
  },
): ComprehensionMoment {
  const moment = getMoment(moment_id)
  requireMomentStatus(moment, 'awaiting_spontaneous', 'RecordSpontaneousResponse')
  requireRecordInProgress(moment.record_id, 'RecordSpontaneousResponse')

  moment.spontaneous_response = opts.response
  moment.response_language = opts.language
  if (opts.seconds !== undefined) moment.response_seconds = opts.seconds
  if (opts.confidence !== undefined) moment.declared_confidence = opts.confidence
  moment.status = 'spontaneous_closed'

  db.comprehensionMoments.set(moment.id, moment)
  return moment
}

/**
 * Omite la respuesta espontánea. Permite continuar sin introducir un valor
 * forzado: la ausencia de dato es un dato.
 */
export function skipSpontaneousResponse(moment_id: string): ComprehensionMoment {
  const moment = getMoment(moment_id)
  requireMomentStatus(moment, 'awaiting_spontaneous', 'SkipSpontaneousResponse')
  requireRecordInProgress(moment.record_id, 'SkipSpontaneousResponse')

  moment.spontaneous_skipped = true
  moment.status = 'spontaneous_closed'

  db.comprehensionMoments.set(moment.id, moment)
  return moment
}

// ─────────────────────────────────────────────
// RevealTargetPhrase — Momento 2
// ─────────────────────────────────────────────

/**
 * Revela la frase objetivo y registra la correspondencia evaluada (Momento 2).
 * Solo es posible tras cerrar el Momento 1: la secuencia es irreversible.
 *
 * La frase objetivo llega al cliente aquí, nunca antes.
 * El campo correspondence es la valoración de cuánto coincide la respuesta
 * espontánea con la frase objetivo (escala definida en la rúbrica).
 */
export function revealTargetPhrase(
  moment_id: string,
  correspondence: number,
): ComprehensionMoment {
  const moment = getMoment(moment_id)
  requireMomentStatus(moment, 'spontaneous_closed', 'RevealTargetPhrase')
  requireRecordInProgress(moment.record_id, 'RevealTargetPhrase')

  moment.correspondence = correspondence
  moment.status = 'phrase_revealed'

  db.comprehensionMoments.set(moment.id, moment)
  return moment
}

// ─────────────────────────────────────────────
// CodeSpontaneousResponse — codificación posterior
// ─────────────────────────────────────────────

/**
 * Clasifica la respuesta espontánea después de la sesión, por un tercero en
 * rol de codificador. No la hace el evaluador durante la sesión.
 *
 * Precondiciones: Momento 2 completado, y existe una respuesta que clasificar.
 */
export function codeSpontaneousResponse(
  moment_id: string,
  coder_pseudonym: string,
  coding: ResponseCoding,
): ComprehensionMoment {
  const moment = getMoment(moment_id)
  requireMomentStatus(moment, 'phrase_revealed', 'CodeSpontaneousResponse')

  if (!moment.spontaneous_response) {
    throw new PreconditionError(
      'CodeSpontaneousResponse',
      'No existe respuesta espontánea que clasificar (la respuesta fue omitida).',
    )
  }

  moment.coding = coding
  moment.coded_by = coder_pseudonym
  moment.coded_at = new Date().toISOString()

  db.comprehensionMoments.set(moment.id, moment)
  return moment
}

// ─────────────────────────────────────────────
// RecordDimensionResponse — Capa C
// ─────────────────────────────────────────────

/**
 * Registra o actualiza la respuesta a una dimensión de la capa C.
 * Cuatro estados posibles; ninguno tiene valor por defecto.
 *
 * Invariantes del Allium aplicadas:
 *   - ScoredHasScore: si state = 'scored', score es obligatorio.
 *   - NotQualifiedHasReason: si state = 'not_qualified', reason es obligatorio.
 *   - OnlyScoredCarriesScore: score debe ser null en cualquier otro estado.
 *
 * Garantía NoForcedMidpoint: ningún valor por defecto; el caller debe entregar
 * un estado explícito. Un 3 por defecto contamina más que aceptar la ausencia.
 */
export function recordDimensionResponse(
  record_id: string,
  dimension: DimensionId,
  state: ResponseState,
  score?: number,
  reason?: string,
): DimensionResponse {
  requireRecordInProgress(record_id, 'RecordDimensionResponse')
  validateDimensionResponse(state, score, reason)

  const responses = db.responsesByRecord(record_id)
  const existing = responses.find(r => r.dimension === dimension)

  if (existing) {
    existing.state = state
    if (state === 'scored' && score !== undefined) {
      existing.score = score
    } else {
      delete existing.score
    }
    if (reason !== undefined) {
      existing.reason = reason
    } else {
      delete existing.reason
    }
    db.dimensionResponses.set(existing.id, existing)
    return existing
  }

  const response: DimensionResponse = {
    id: newId(),
    record_id,
    dimension,
    state,
    ...(state === 'scored' && score !== undefined ? { score } : {}),
    ...(reason !== undefined ? { reason } : {}),
  }
  db.dimensionResponses.set(response.id, response)
  return response
}

// ─────────────────────────────────────────────
// RecordThresholdPass — Capa B
// ─────────────────────────────────────────────

/**
 * Registra una pasada del método de ajuste de capa B. Despacha entre
 * pasada descendente (nitido → degradado) y ascendente (degradado → nítido)
 * según el estado actual de la medición.
 *
 * La histéresis (diferencia entre pasadas) es el estadístico de fiabilidad
 * del dato, no un indicador de error ni motivo de descarte.
 *
 * Garantías del protocolo B (docs/GUARANTEES_UI.md):
 *   - PreviousPassOpaque: el valor de la pasada anterior no se expone durante
 *     la siguiente (responsabilidad del caller / la surface).
 *   - BothPassesReported: threshold e hysteresis se calculan al completar.
 */
export function recordThresholdPass(
  measurement_id: string,
  value: number,
): ThresholdMeasurement {
  const measurement = db.thresholdMeasurements.get(measurement_id)
  if (!measurement) throw new PreconditionError('RecordThresholdPass', `Medición ${measurement_id} no encontrada.`)

  requireRecordInProgress(measurement.record_id, 'RecordThresholdPass')

  if (measurement.status === 'pending') {
    // Pasada descendente (nítido → degradado)
    measurement.descending_value = value
    measurement.status = 'descending_done'

  } else if (measurement.status === 'descending_done') {
    // Pasada ascendente (degradado → nítido) — cierra y deriva estadísticos
    if (measurement.descending_value === undefined) {
      throw new InvariantError('ThresholdMeasurement', 'descending_value debe existir en estado descending_done.')
    }
    measurement.ascending_value = value
    measurement.threshold = (measurement.descending_value + value) / 2
    measurement.hysteresis = Math.abs(measurement.descending_value - value)
    measurement.status = 'completed'

  } else {
    throw new PreconditionError(
      'RecordThresholdPass',
      `La medición ya está completada (status: '${measurement.status}').`,
    )
  }

  db.thresholdMeasurements.set(measurement.id, measurement)
  return measurement
}

/**
 * Crea una medición de umbral para un registro e ítem dados.
 * Se llama al abrir la tarea de capa B sobre un ítem de la submuestra.
 */
export function createThresholdMeasurement(
  record_id: string,
  axis: ThresholdAxis,
): ThresholdMeasurement {
  requireRecordInProgress(record_id, 'CreateThresholdMeasurement')

  // Invariante OneMeasurementPerAxisPerRecord
  const existing = db.thresholdsByRecord(record_id).find(t => t.axis === axis)
  if (existing) {
    throw new PreconditionError(
      'CreateThresholdMeasurement',
      `Ya existe una medición para el eje '${axis}' en el registro ${record_id}.`,
    )
  }

  const measurement: ThresholdMeasurement = {
    id: newId(),
    record_id,
    axis,
    status: 'pending',
  }
  db.thresholdMeasurements.set(measurement.id, measurement)
  return measurement
}

// ─────────────────────────────────────────────
// AddNote
// ─────────────────────────────────────────────

/**
 * Agrega una nota tipada sobre un ítem. Las curatoriales no llevan registro;
 * las otras pueden ir asociadas a un registro en progreso o sellado.
 *
 * La visibilidad es explícita porque las notas libres pueden contener
 * información sensible (opinión personal, datos de contexto).
 */
export function addNote(
  item_id: string,
  opts: {
    note_type: NoteType
    body: string
    visibility: Visibility
    record_id?: string
  },
): Note {
  // Invariante CuratorialHasNoRecord
  if (opts.note_type === 'curatorial' && opts.record_id) {
    throw new PreconditionError(
      'AddNote',
      'Las notas curatoriales no pueden estar asociadas a un registro.',
    )
  }

  const note: Note = {
    id: newId(),
    item_id,
    note_type: opts.note_type,
    body: opts.body,
    visibility: opts.visibility,
    created_at: new Date().toISOString(),
    ...(opts.record_id ? { record_id: opts.record_id } : {}),
  }
  db.notes.set(note.id, note)
  return note
}

// ─────────────────────────────────────────────
// SealEvaluationRecord
// ─────────────────────────────────────────────

/**
 * Sella el registro. A partir de aquí es INMUTABLE: ninguna regla de escritura
 * admite status = 'sealed' en su precondición, de modo que el sellado es
 * irreversible por construcción.
 *
 * Precondiciones:
 *   - record.status = 'in_progress'
 *   - comprehension.status = 'phrase_revealed' (ambos momentos completados)
 *
 * Postcondición: dispara RecomputeAggregate en background (deferred).
 *
 * Invariante SealedRecordPinsVersion: item_content_hash != null (garantizado
 * por OpenEvaluationRecord, verificado aquí para defensa en profundidad).
 */
export function sealEvaluationRecord(record_id: string): EvaluationRecord {
  const record = db.evaluationRecords.get(record_id)
  if (!record) throw new PreconditionError('SealEvaluationRecord', `Registro ${record_id} no encontrado.`)

  if (record.status !== 'in_progress') {
    throw new PreconditionError(
      'SealEvaluationRecord',
      `El registro ya está en estado '${record.status}'.`,
    )
  }

  // Verificar que el Momento 2 está completo (SealedHasComprehension)
  const moments = [...db.comprehensionMoments.values()].filter(m => m.record_id === record_id)
  if (moments.length === 0) {
    throw new PreconditionError('SealEvaluationRecord', 'El registro no tiene momento de comprensión.')
  }
  const moment = moments[0]
  if (!moment) throw new PreconditionError('SealEvaluationRecord', 'Momento de comprensión no encontrado.')
  if (moment.status !== 'phrase_revealed') {
    throw new PreconditionError(
      'SealEvaluationRecord',
      `El momento de comprensión está en '${moment.status}'; debe ser 'phrase_revealed' para sellar.`,
    )
  }

  // Defensa en profundidad: invariante SealedRecordPinsVersion
  if (!record.item_content_hash) {
    throw new InvariantError(
      'SealedRecordPinsVersion',
      'item_content_hash no puede ser vacío en un registro sellado.',
    )
  }

  record.status = 'sealed'
  db.evaluationRecords.set(record.id, record)

  // Disparar agregado en background (RecomputeAggregate — deferred)
  void scheduleAggregate(record.source_id)

  return record
}

// ─────────────────────────────────────────────
// Internos
// ─────────────────────────────────────────────

function getMoment(moment_id: string): ComprehensionMoment {
  const moment = db.comprehensionMoments.get(moment_id)
  if (!moment) throw new PreconditionError('ComprehensionMoment', `Momento ${moment_id} no encontrado.`)
  return moment
}

function requireMomentStatus(
  moment: ComprehensionMoment,
  expected: ComprehensionMoment['status'],
  rule: string,
): void {
  if (moment.status !== expected) {
    throw new PreconditionError(
      rule,
      `El momento está en '${moment.status}'; se requiere '${expected}'.`,
    )
  }
}

function requireRecordInProgress(record_id: string, rule: string): void {
  const record = db.evaluationRecords.get(record_id)
  if (!record) throw new PreconditionError(rule, `Registro ${record_id} no encontrado.`)
  if (record.status === 'sealed') {
    throw new PreconditionError(
      rule,
      'El registro está sellado. Ninguna regla de escritura opera sobre registros sellados.',
    )
  }
}

function validateDimensionResponse(
  state: ResponseState,
  score: number | undefined,
  reason: string | undefined,
): void {
  if (state === 'scored' && score === undefined) {
    throw new InvariantError('ScoredHasScore', 'state = scored requiere score.')
  }
  if (state === 'not_qualified' && !reason) {
    throw new InvariantError('NotQualifiedHasReason', 'state = not_qualified requiere reason.')
  }
  if (state !== 'scored' && score !== undefined) {
    throw new InvariantError('OnlyScoredCarriesScore', `Solo 'scored' puede llevar score; estado actual: '${state}'.`)
  }
}

async function scheduleAggregate(source_id: string): Promise<void> {
  const { recomputeAggregate } = await import('../services/aggregate.ts')
  try {
    await recomputeAggregate(source_id)
  } catch {
    // El agregado falla en silencio; es una estadística derivada, no evidencia
  }
}

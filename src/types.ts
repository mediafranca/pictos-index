/**
 * ICAP v2 — Tipos de dominio
 *
 * Mapeo directo de spec/icap.allium a TypeScript. Cada entidad del Allium
 * se convierte en una interfaz con un campo `id` añadido para persistencia.
 *
 * Las propiedades DERIVADAS del Allium (effective_author, pinned_to_current,
 * deterministic_verdict, etc.) viven en src/derived.ts como funciones puras,
 * no aquí: el tipo almacena hechos, la función calcula conclusiones.
 *
 * Convención de timestamps: strings ISO 8601 (Date.toISOString()).
 */

// ─────────────────────────────────────────────
// Enumeraciones
// ─────────────────────────────────────────────

export type SourceType = 'library' | 'single_item'
export type SourceStatus = 'importing' | 'validated' | 'analysed'

export type RowOutcome = 'valid' | 'partially_compatible' | 'invalid'

export type FindingKind =
  | 'duplicate_id'
  | 'missing_image'
  | 'unsupported_format'
  | 'empty_utterance'
  | 'inherited_metadata'
  | 'metadata_override'
  | 'schema_mismatch'

export type ThresholdAxis = 'blur' | 'size' | 'shift'

export type DimensionId =
  | 'c1_semantic'
  | 'c2_pragmatic'
  | 'c3_cultural'
  | 'c4_learnability'

export type ResponseState = 'scored' | 'not_applicable' | 'not_qualified' | 'skipped'
export type ResponseCoding = 'correct' | 'close' | 'alternative' | 'incorrect'
export type NoteType = 'free' | 'suggested_change' | 'curatorial' | 'moderation'
export type Visibility = 'private' | 'team' | 'public'
export type ConsentScope = 'private_only' | 'aggregated_public' | 'full_public'

export type LearningProfile =
  | 'transparent_and_learnable'
  | 'transparent_but_hard'
  | 'opaque_but_learnable'
  | 'opaque_and_hard'

export type Verdict = 'blocked' | 'admissible'

export type ComprehensionStatus =
  | 'awaiting_spontaneous'
  | 'spontaneous_closed'
  | 'phrase_revealed'

export type CalibrationStatus = 'scoring' | 'anchors_revealed'
export type RecordStatus = 'in_progress' | 'sealed'
export type ThresholdStatus = 'pending' | 'descending_done' | 'completed'

// ─────────────────────────────────────────────
// Value Types (sin id; se embeben en entidades)
// ─────────────────────────────────────────────

/** Metadatos editoriales que viven en la fuente y que los ítems pueden sobreescribir. */
export interface EditorialMetadata {
  author?: string
  license?: string
  organization?: string
  language?: string
  published_at?: string
}

/**
 * Capa A — Cuatro métricas geométricas sobre la máscara binaria figura/fondo.
 * Determinista: depende del píxel, no de quien mira.
 */
export interface GeometryLayer {
  stroke_pct: number            // A1: grosor de trazo (% del diámetro de soporte)
  unlinked_units: number        // A2: unidades desligadas (componentes conexas)
  closed_regions: number        // A3: regiones cerradas (huecos topológicos)
  inferred_contour_pct: number  // A4: contorno inferido (% del largo de esqueleto)
}

/** Contexto de evaluación: capturado una vez por sesión, heredable al registro. */
export interface EvaluationContext {
  target_population: string
  communicative_task: string
  environment: string
  modality: string
  presentation_size_px: number  // referente del veto B2
  label_shown: boolean
}

// ─────────────────────────────────────────────
// OBJETO 1 — FUENTE
// ─────────────────────────────────────────────

/** Biblioteca o pictograma individual importado. Aloja metadatos heredables. */
export interface Source {
  id: string
  source_type: SourceType
  external_id: string
  external_version: string
  detected_schema_version: string
  imported_at: string
  metadata: EditorialMetadata
  status: SourceStatus
}

/** Informe de validación de ingesta. Se muestra ANTES de empezar a evaluar. */
export interface ImportReport {
  id: string
  source_id: string
  rows_seen: number
  valid_count: number
  partial_count: number
  invalid_count: number
}

/** Un hallazgo concreto sobre una fila del dump. Cada exclusión queda nombrada. */
export interface ValidationFinding {
  id: string
  report_id: string
  kind: FindingKind
  row_ref: string
  outcome: RowOutcome
  detail: string
}

// ─────────────────────────────────────────────
// OBJETO 2 — ÍTEM NORMALIZADO
// ─────────────────────────────────────────────

/**
 * El pictograma que ICAP evalúa, con identidad de versión.
 * La evaluación se ancla a content_hash: si cambia el dibujo o la frase,
 * los registros anteriores siguen siendo evidencia válida sobre la versión antigua.
 */
export interface Item {
  id: string
  source_id: string
  stable_id: string
  item_version: string
  item_dated_at: string
  utterance: string
  utterance_hash: string
  image_ref: string
  image_hash: string
  content_hash: string          // sha256(image_hash + utterance_hash)
  overrides?: EditorialMetadata // solo se declara lo que difiere de la fuente
  geometry?: GeometryLayer      // Capa A: ausente hasta que se computa
}

// ─────────────────────────────────────────────
// OBJETO 3 — EVALUACIÓN
// ─────────────────────────────────────────────

/** Perfil del evaluador. La identidad no viaja al archivo público. */
export interface EvaluatorProfile {
  id: string
  pseudonym: string
  age_range: string
  gender: string
  region: string
  education?: string
  primary_language: string
  aac_experience: string
  role: string
  consent_version: string
  consent_scope: ConsentScope
}

/** Sesión de evaluación: contexto + calibración previa bloqueante. */
export interface EvaluationSession {
  id: string
  evaluator_id: string
  context: EvaluationContext
  protocol_version: string
  rubric_version: string
  app_version: string
  started_at: string
}

/** Conjunto de casos de calibración, versionado. */
export interface CalibrationSet {
  id: string
  version: string
  published_at: string
}

/** Un caso de referencia: pictograma con anclas consensuadas por dimensión. */
export interface CalibrationCase {
  id: string
  calibration_set_id: string
  label: string
  image_ref: string
  utterance: string
}

/**
 * El valor consensuado para una dimensión en un caso.
 * El fundamento importa tanto como el número: calibrar es alinear el uso
 * de la escala, no memorizar respuestas.
 */
export interface CalibrationAnchor {
  id: string
  case_id: string
  dimension: DimensionId
  anchor_score: number
  rationale: string
}

/**
 * La calibración de una sesión concreta. Se puntúa primero (anclas ocultas),
 * se revelan después, y no hay camino de vuelta al estado de puntuación.
 */
export interface SessionCalibration {
  id: string
  session_id: string
  calibration_set_id: string
  status: CalibrationStatus
  started_at: string
  completed_at?: string
}

/** La respuesta del evaluador a un ancla, emitida a ciegas. */
export interface CalibrationResponse {
  id: string
  calibration_id: string
  anchor_id: string
  given_score: number
}

/**
 * El registro. Congela la versión evaluada mediante item_content_hash, de modo
 * que si el ítem cambia después, este registro sigue siendo evidencia válida
 * sobre la versión antigua.
 */
export interface EvaluationRecord {
  id: string
  item_id: string
  session_id: string
  item_content_hash: string
  source_id: string
  source_version: string
  protocol_version: string
  rubric_version: string
  calibration_set_version: string
  schema_version: string
  created_at: string
  status: RecordStatus
  context_override?: EvaluationContext
}

/**
 * Momento de comprensión. Dos momentos separados:
 * 1. Solo el pictograma → respuesta espontánea
 * 2. Revelada la frase → evaluación de correspondencia
 */
export interface ComprehensionMoment {
  id: string
  record_id: string
  status: ComprehensionStatus
  spontaneous_response?: string
  response_language?: string
  response_seconds?: number
  declared_confidence?: number
  spontaneous_skipped: boolean
  correspondence?: number
  coding?: ResponseCoding
  coded_by?: string
  coded_at?: string
}

/**
 * Respuesta a una dimensión interpretativa.
 * La ausencia de dato es un dato: cuatro estados con el mismo peso visual.
 */
export interface DimensionResponse {
  id: string
  record_id: string
  dimension: DimensionId
  state: ResponseState
  score?: number
  reason?: string
}

/**
 * Capa B — Umbral psicofísico por método de ajuste con doble pasada.
 * La histéresis es el estadístico de fiabilidad del dato.
 */
export interface ThresholdMeasurement {
  id: string
  record_id: string
  axis: ThresholdAxis
  status: ThresholdStatus
  descending_value?: number
  ascending_value?: number
  threshold?: number
  hysteresis?: number
}

/** Nota tipada. Las curatoriales vienen importadas; las de moderación son posteriores. */
export interface Note {
  id: string
  item_id: string
  record_id?: string
  note_type: NoteType
  body: string
  visibility: Visibility
  created_at: string
}

// ─────────────────────────────────────────────
// OBJETO 4 — AGREGADO
// ─────────────────────────────────────────────

/**
 * Estadísticas calculadas a partir de muchas evaluaciones.
 * Nunca mezcladas con la evidencia original, nunca colapsadas en un número.
 */
export interface SourceAggregate {
  id: string
  source_id: string
  items_total: number
  items_with_records: number
  evaluator_count: number
  record_count: number
  protocol_versions_covered: string[]
  contexts_covered: string[]
  superseded_record_count: number
}

// ─────────────────────────────────────────────
// CAPA D — INFORME DE FAMILIA
// ─────────────────────────────────────────────

/**
 * Propiedades de familia, deterministas sobre el set completo.
 * D1 mide similitud objetivo-distractor, D2 la homogeneidad interna de la familia.
 */
export interface FamilyReport {
  id: string
  source_id: string
  cv_stroke_pct: number
  cv_head_pct: number
  cv_cardinal_pct: number
  cv_entropy_pct: number
  pair_median_r: number
  pair_p90_r: number
  critical_r_cutoff: number     // derivado de la distribución, no fijo
}

export interface ConfusablePair {
  id: string
  family_id: string
  item_a_id: string
  item_b_id: string
  r: number
}

// ─────────────────────────────────────────────
// EXPORTACIÓN
// ─────────────────────────────────────────────

export interface RecordExport {
  kind: 'record'
  id: string
  record_id: string
  schema_version: string
  app_version: string
  created_at: string
  includes_evaluator_profile: boolean
}

export interface BundleExport {
  kind: 'bundle'
  id: string
  source_id: string
  resolved_inheritance: boolean
  schema_version: string
  app_version: string
  created_at: string
  includes_evaluator_profile: boolean
}

export type IcapExport = RecordExport | BundleExport

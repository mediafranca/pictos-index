/**
 * ICAP v2 — Store en memoria
 *
 * Repositorio central de todas las entidades del dominio. Usado por las reglas
 * (src/rules/*.ts) para leer y escribir estado.
 *
 * Implementación actual: Maps en memoria, sin persistencia entre recargas.
 * La interfaz está diseñada para reemplazarse por IndexedDB cuando se necesite
 * persistencia real, sin tocar las reglas de dominio.
 *
 * ponytail: in-memory es suficiente para Fase 1–3. Migrar a IndexedDB cuando
 * el flujo completo funcione y haya necesidad de sesiones persistentes.
 */

import type {
  Source,
  Item,
  ImportReport,
  ValidationFinding,
  EvaluatorProfile,
  EvaluationSession,
  SessionCalibration,
  CalibrationSet,
  CalibrationCase,
  CalibrationAnchor,
  CalibrationResponse,
  EvaluationRecord,
  ComprehensionMoment,
  DimensionResponse,
  ThresholdMeasurement,
  Note,
  SourceAggregate,
  FamilyReport,
  ConfusablePair,
  IcapExport,
} from './types.ts'

// ─────────────────────────────────────────────
// Colecciones
// ─────────────────────────────────────────────

const sources = new Map<string, Source>()
const items = new Map<string, Item>()
const importReports = new Map<string, ImportReport>()
const validationFindings = new Map<string, ValidationFinding>()
const evaluatorProfiles = new Map<string, EvaluatorProfile>()
const evaluationSessions = new Map<string, EvaluationSession>()
const sessionCalibrations = new Map<string, SessionCalibration>()
const calibrationSets = new Map<string, CalibrationSet>()
const calibrationCases = new Map<string, CalibrationCase>()
const calibrationAnchors = new Map<string, CalibrationAnchor>()
const calibrationResponses = new Map<string, CalibrationResponse>()
const evaluationRecords = new Map<string, EvaluationRecord>()
const comprehensionMoments = new Map<string, ComprehensionMoment>()
const dimensionResponses = new Map<string, DimensionResponse>()
const thresholdMeasurements = new Map<string, ThresholdMeasurement>()
const notes = new Map<string, Note>()
const sourceAggregates = new Map<string, SourceAggregate>()
const familyReports = new Map<string, FamilyReport>()
const confusablePairs = new Map<string, ConfusablePair>()
const exports_ = new Map<string, IcapExport>()

// ─────────────────────────────────────────────
// Acceso tipado
// ─────────────────────────────────────────────

export const db = {
  sources,
  items,
  importReports,
  validationFindings,
  evaluatorProfiles,
  evaluationSessions,
  sessionCalibrations,
  calibrationSets,
  calibrationCases,
  calibrationAnchors,
  calibrationResponses,
  evaluationRecords,
  comprehensionMoments,
  dimensionResponses,
  thresholdMeasurements,
  notes,
  sourceAggregates,
  familyReports,
  confusablePairs,
  exports: exports_,

  // Consultas frecuentes

  itemsBySource(sourceId: string): Item[] {
    return [...items.values()].filter(i => i.source_id === sourceId)
  },

  findingsByReport(reportId: string): ValidationFinding[] {
    return [...validationFindings.values()].filter(f => f.report_id === reportId)
  },

  recordsByItem(itemId: string): EvaluationRecord[] {
    return [...evaluationRecords.values()].filter(r => r.item_id === itemId)
  },

  calibrationBySession(sessionId: string): SessionCalibration | undefined {
    return [...sessionCalibrations.values()].find(c => c.session_id === sessionId)
  },

  responsesByCalibration(calibrationId: string): CalibrationResponse[] {
    return [...calibrationResponses.values()].filter(r => r.calibration_id === calibrationId)
  },

  responsesByRecord(recordId: string): DimensionResponse[] {
    return [...dimensionResponses.values()].filter(r => r.record_id === recordId)
  },

  thresholdsByRecord(recordId: string): ThresholdMeasurement[] {
    return [...thresholdMeasurements.values()].filter(t => t.record_id === recordId)
  },

  pairsByFamily(familyId: string): ConfusablePair[] {
    return [...confusablePairs.values()].filter(p => p.family_id === familyId)
  },
}

/** Genera un UUID v4 simple (no criptográfico; solo para IDs internos). */
export function newId(): string {
  return crypto.randomUUID()
}

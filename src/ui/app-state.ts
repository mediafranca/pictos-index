/**
 * ICAP v2 — Estado mutable de la aplicación
 *
 * Registra el progreso del flujo de preparación: qué fuente se está evaluando,
 * qué sesión está activa, y qué pasos del prep-rail están completados.
 *
 * Este objeto NO persiste entre recargas de página (solo los borradores de
 * respuesta van a localStorage, por garantía GUARANTEES_UI.md). La sesión
 * se reconstruye desde el store (db) si hubiera persistencia.
 */

export type PrepStep = 'source' | 'validation' | 'profile' | 'context' | 'calibration'

export interface AppState {
  /** ID de la fuente importada actualmente activa */
  sourceId: string | null
  /** ID del último informe de validación generado */
  reportId: string | null
  /** ID del evaluador activo */
  evaluatorId: string | null
  /** ID de la sesión activa */
  sessionId: string | null
  /** Pasos del prep-rail completados */
  completedSteps: Set<PrepStep>
  /** Ítem que se está evaluando ahora */
  currentItemId: string | null
  /** Registro de evaluación abierto */
  currentRecordId: string | null
  /** Momento de comprensión activo */
  currentMomentId: string | null
  /** Si el ítem actual pertenece a la submuestra de capa B */
  currentItemIsSubsample: boolean
}

export const appState: AppState = {
  sourceId:     null,
  reportId:     null,
  evaluatorId:  null,
  sessionId:    null,
  completedSteps: new Set(),
  currentItemId:          null,
  currentRecordId:        null,
  currentMomentId:        null,
  currentItemIsSubsample: false,
}

export function completeStep(step: PrepStep): void {
  appState.completedSteps.add(step)
}

/** Marca un paso como visitado (aunque no esté completado). */
export function visitStep(step: PrepStep): void {
  appState.completedSteps.add(step)
}

/** Un paso es navegable si fue completado o si es el paso previo a completar. */
export function isNavigable(step: PrepStep): boolean {
  const ORDER: PrepStep[] = ['source', 'validation', 'profile', 'context', 'calibration']
  const idx = ORDER.indexOf(step)
  // Siempre se puede ir al inicio
  if (idx === 0) return true
  // Se puede ir a un paso si el anterior está completado
  const prev = ORDER[idx - 1]
  return prev !== undefined && appState.completedSteps.has(prev)
}

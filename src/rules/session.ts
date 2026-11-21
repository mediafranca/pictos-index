/**
 * ICAP v2 — Inicialización de sesión y perfil de evaluador
 *
 * El Allium no especifica reglas explícitas para crear el perfil y la sesión
 * (son condiciones de entrada al sistema, no eventos del instrumento), pero sí
 * declara invariantes sobre ellos: todo registro debe provenir de una sesión
 * calibrada, y todo actor Evaluator requiere consent_version != null.
 *
 * Estas funciones crean los objetos con esas condiciones garantizadas de entrada.
 * Usado por la surface SourceImport y el flujo de preparación (#prep-rail).
 */

import { db, newId } from '../store.ts'
import { CONFIG } from '../config.ts'
import type {
  EvaluatorProfile,
  EvaluationSession,
  EvaluationContext,
  ConsentScope,
} from '../types.ts'

// ─────────────────────────────────────────────
// Perfil de evaluador
// ─────────────────────────────────────────────

export interface CreateProfileOpts {
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

/**
 * Crea y persiste un perfil de evaluador.
 * La identidad no viaja al archivo público: el registro se ancla al seudónimo,
 * que permite análisis longitudinal sin publicar identidad.
 */
export function createEvaluatorProfile(opts: CreateProfileOpts): EvaluatorProfile {
  const profile: EvaluatorProfile = {
    id: newId(),
    ...opts,
  }
  db.evaluatorProfiles.set(profile.id, profile)
  return profile
}

// ─────────────────────────────────────────────
// Sesión de evaluación
// ─────────────────────────────────────────────

export interface CreateSessionOpts {
  evaluator_id: string
  context: EvaluationContext
  app_version: string
  protocol_version?: string
  rubric_version?: string
}

/**
 * Abre una sesión de evaluación. El contexto (tamaño de presentación, población
 * objetivo, etc.) se captura aquí y los registros lo heredan, salvo que declaren
 * un context_override explícito.
 *
 * La sesión no está calibrada al crearse: la calibración es un paso posterior
 * bloqueante (ver src/rules/calibration.ts).
 */
export function createEvaluationSession(opts: CreateSessionOpts): EvaluationSession {
  const session: EvaluationSession = {
    id: newId(),
    evaluator_id: opts.evaluator_id,
    context: opts.context,
    app_version: opts.app_version,
    protocol_version: opts.protocol_version ?? CONFIG.protocol_version,
    rubric_version: opts.rubric_version ?? CONFIG.rubric_version,
    started_at: new Date().toISOString(),
  }
  db.evaluationSessions.set(session.id, session)
  return session
}

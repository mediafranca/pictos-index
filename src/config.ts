/**
 * ICAP v2 — Configuración del instrumento
 *
 * ADVERTENCIA: estos valores son MARCADORES DE POSICIÓN, no constantes calibradas.
 * Heredados de las anclas verbales de la rúbrica v1 y de literatura de población
 * general. Deben recomputarse sobre el corpus completo de 21 pictogramas antes de
 * tratarse como evidencia. Ver "Estado de la evidencia" en CLAUDE.md.
 *
 * Los umbrales de los vetos duros (a1, d1, b2) se presentan en la interfaz como
 * editables con indicación visible de su condición provisional.
 */
export const CONFIG = {
  // Capa A — veto duro A1
  a1_stroke_min_pct: 4.0,

  // Capa A — perfil compensatorio
  a2_units_max: 3,
  a3_closed_regions_min: 1,
  a4_inferred_contour_max_pct: 10.0,

  // Capa C — piso Likert (se reporta, no es veto)
  c_likert_floor: 3,

  // Capa D — consistencia (D2)
  d2_cv_max_pct: 25.0,

  // Submuestra Capa B
  sample_fraction: 0.20,
  sample_min_items: 8,

  // Versiones del protocolo (viajan en cada registro para asegurar comparabilidad)
  schema_version: 'icap-evaluation-2.0.0',
  rubric_version: 'icap-rubric-1.0.0',
  protocol_version: 'icap-protocol-1.0.0',
  calibration_set_version: 'icap-calibration-1.0.0',

  // Calibración
  calibration_min_responses: 4,
  calibration_divergence_flag: 1.0,
} as const

export type Config = typeof CONFIG

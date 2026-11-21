/**
 * PICTOS Index Evaluation Service
 *
 * Extraído de pictos-net para su uso independiente en el repositorio MediaFranca/pictos-index.
 * Contiene la lógica de evaluación PICTOS Index: cálculo de promedio y control de calidad.
 */

import type { EvaluationMetrics } from '../types';

/**
 * Calculate PICTOS Index average score across 6 hexagonal dimensions
 */
export function calculatePictosIndexAverage(eval_: EvaluationMetrics): number {
  const {
    clarity,
    recognizability,
    semantic_transparency,
    pragmatic_fit,
    cultural_adequacy,
    cognitive_accessibility
  } = eval_;
  return (
    clarity +
    recognizability +
    semantic_transparency +
    pragmatic_fit +
    cultural_adequacy +
    cognitive_accessibility
  ) / 6;
}

/**
 * Build PICTOS Index metadata block for SVG provenance
 * Returns the pictos-index object to embed in SVG <metadata>
 */
export function buildPictosIndexMetadata(evaluation: EvaluationMetrics, author: string) {
  const avg = calculatePictosIndexAverage(evaluation);
  return {
    validated: true,
    validatedAt: new Date().toISOString(),
    validator: author || "PictoNet",
    clarityScore: Math.round(evaluation.clarity),
    comments: evaluation.reasoning || `PICTOS Index average: ${avg.toFixed(2)}`
  };
}

/**
 * PICTOS Index quality gate: check if evaluation meets minimum score threshold
 * Threshold: PICTOS Index average >= 4.0
 */
export function meetsPictosIndexThreshold(
  evaluation: EvaluationMetrics,
  threshold: number = 4.0
): { eligible: boolean; average: number; reason?: string } {
  const average = calculatePictosIndexAverage(evaluation);
  if (average < threshold) {
    return {
      eligible: false,
      average,
      reason: `PICTOS Index average (${average.toFixed(2)}) must be >= ${threshold}`
    };
  }
  return { eligible: true, average };
}

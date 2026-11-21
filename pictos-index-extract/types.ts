/**
 * PICTOS Index Evaluation Types
 *
 * Extraído de pictos-net para su uso independiente en el repositorio MediaFranca/pictos-index.
 *
 * PICTOS Index: evaluación de calidad pictográfica
 * Alineado con el esquema oficial: https://github.com/mediafranca/pictos-index
 */

// PICTOS Index Hexagonal Dimensions (Manual Input - Likert 1-5)
// Order aligned with official PICTOS Index schema (mediafranca/pictos-index):
// Clarity, Recognizability, Semantic Transparency, Pragmatic Fit, Cultural Adequacy, Cognitive Accessibility
export interface EvaluationMetrics {
  clarity: number;
  recognizability: number;
  semantic_transparency: number;
  pragmatic_fit: number;
  cultural_adequacy: number;
  cognitive_accessibility: number;
  reasoning: string;
}

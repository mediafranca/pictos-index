/**
 * PICTOS Index 50 Corpus
 *
 * Extraído de pictos-net para su uso independiente en el repositorio MediaFranca/pictos-index.
 * Fuente original: https://mediafranca.net/pictos-index/frases.json
 *
 * Este módulo contiene:
 * - PictosIndexPhrase / PictosIndexCorpus: interfaces del corpus externo
 * - fetchPictosIndexModule(): carga el corpus desde el endpoint de GitHub Pages
 * - PICTOS_INDEX_MODULE_FALLBACK: corpus estático de respaldo (50 frases, 8 categorías)
 */

// Adapter type - en integración real, importar desde el tipo de RowData del repo destino
interface RowDataPartial {
  id: string;
  UTTERANCE: string;
  status: string;
  nluStatus: string;
  visualStatus: string;
  bitmapStatus: string;
  [key: string]: any;
}

export interface GraphModule {
  id: string;
  namespace: string;
  version: string;
  description: string;
  data: RowDataPartial[];
}

/**
 * PICTOS Index Phrase structure from external JSON
 */
interface PictosIndexPhrase {
  id: string;
  category: string;
  phrase_es: string;
  nsm_primitives: string[];
  semantic_role: string;
  domain: string;
}

/**
 * PICTOS Index Corpus structure from external JSON
 */
interface PictosIndexCorpus {
  project: string;
  corpus_name: string;
  version: string;
  description: string;
  phrases: PictosIndexPhrase[];
}

/**
 * PICTOS Index endpoint URL (GitHub Pages)
 */
const PICTOS_INDEX_ENDPOINT = 'https://mediafranca.net/pictos-index/frases.json';

/**
 * Fetch PICTOS Index phrases from external endpoint
 * Returns the full PICTOS Index 50 corpus (50 phrases across 8 categories)
 */
export async function fetchPictosIndexModule(): Promise<GraphModule> {
  try {
    const response = await fetch(PICTOS_INDEX_ENDPOINT);

    if (!response.ok) {
      throw new Error(`Failed to fetch PICTOS Index module: ${response.status}`);
    }

    const corpus: PictosIndexCorpus = await response.json();

    const data: RowDataPartial[] = corpus.phrases.map((phrase) => ({
      id: phrase.id,
      UTTERANCE: phrase.phrase_es,
      status: 'idle',
      nluStatus: 'idle',
      visualStatus: 'idle',
      bitmapStatus: 'idle'
    }));

    return {
      id: "pictos-index-50",
      namespace: "mediafranca.graph.dataset",
      version: corpus.version,
      description: corpus.description,
      data
    };
  } catch (error) {
    console.error('Error fetching PICTOS Index module:', error);
    throw error;
  }
}

/**
 * Fallback: Static PICTOS Index 50 base corpus (for offline usage)
 * Source: frases.json v2.0.0
 */
export const PICTOS_INDEX_MODULE_FALLBACK: GraphModule = {
  id: "pictos-index-50-base",
  namespace: "mediafranca.graph.dataset",
  version: "2.0.0",
  description: "Corpus base PICTOS Index 50 para evaluación de pictogramas en CAA (50 frases base - FALLBACK)",
  data: [
    // SOLICITAR (6 frases)
    { "id": "SOL-01", "UTTERANCE": "Quiero ir al baño", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "SOL-02", "UTTERANCE": "Quiero comer pizza", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "SOL-03", "UTTERANCE": "Necesito tomar mi medicina", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "SOL-04", "UTTERANCE": "Tengo sed, quiero beber agua", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "SOL-05", "UTTERANCE": "Quiero jugar en el patio", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "SOL-06", "UTTERANCE": "Ayúdame con la tarea", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },

    // RECHAZAR (5 frases)
    { "id": "REC-01", "UTTERANCE": "No quiero tomar la sopa", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "REC-02", "UTTERANCE": "No quiero usar la chaqueta", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "REC-03", "UTTERANCE": "No ahora", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "REC-04", "UTTERANCE": "No necesito ayuda", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "REC-05", "UTTERANCE": "Basta ya", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },

    // DIRIGIR (6 frases)
    { "id": "DIR-01", "UTTERANCE": "Ven aquí", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "DIR-02", "UTTERANCE": "Mira esto", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "DIR-03", "UTTERANCE": "Dame la mano", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "DIR-04", "UTTERANCE": "Pon el libro en la mesa", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "DIR-05", "UTTERANCE": "Vamos a jugar", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "DIR-06", "UTTERANCE": "No corras", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },

    // ACEPTAR (6 frases)
    { "id": "ACE-01", "UTTERANCE": "Sí, quiero eso", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "ACE-02", "UTTERANCE": "Está bien", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "ACE-03", "UTTERANCE": "De acuerdo", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "ACE-04", "UTTERANCE": "Me gusta eso", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "ACE-05", "UTTERANCE": "Sí, por favor", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "ACE-06", "UTTERANCE": "Genial", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },

    // INTERACCIÓN SOCIAL (6 frases)
    { "id": "SOC-01", "UTTERANCE": "Hola", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "SOC-02", "UTTERANCE": "Adiós", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "SOC-03", "UTTERANCE": "Por favor", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "SOC-04", "UTTERANCE": "¿Quieres jugar?", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "SOC-05", "UTTERANCE": "Lo siento", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "SOC-06", "UTTERANCE": "Bien hecho", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },

    // EMOCIÓN (5 frases)
    { "id": "EMO-01", "UTTERANCE": "Te quiero", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "EMO-02", "UTTERANCE": "Estoy feliz", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "EMO-03", "UTTERANCE": "Estoy triste", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "EMO-04", "UTTERANCE": "Tengo miedo", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "EMO-05", "UTTERANCE": "Me duele la barriga", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },

    // COMENTAR (6 frases)
    { "id": "COM-01", "UTTERANCE": "Está lloviendo", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "COM-02", "UTTERANCE": "Hace frío", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "COM-03", "UTTERANCE": "Es hora de comer", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "COM-04", "UTTERANCE": "Tengo hambre", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "COM-05", "UTTERANCE": "El perro es grande", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "COM-06", "UTTERANCE": "Está roto", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },

    // PREGUNTAR (7 frases)
    { "id": "PRE-01", "UTTERANCE": "¿Dónde está el baño?", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "PRE-02", "UTTERANCE": "¿Qué es esto?", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "PRE-03", "UTTERANCE": "¿Quién es ella?", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "PRE-04", "UTTERANCE": "¿Cuándo vamos al parque?", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "PRE-05", "UTTERANCE": "¿Quién viene?", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "PRE-06", "UTTERANCE": "¿Dónde está mamá?", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" },
    { "id": "PRE-07", "UTTERANCE": "¿Qué vamos a comer?", "status": "idle", "nluStatus": "idle", "visualStatus": "idle", "bitmapStatus": "idle" }
  ]
};

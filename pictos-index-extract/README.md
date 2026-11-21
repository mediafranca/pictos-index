# PICTOS Index — Evaluación de Calidad Pictográfica

Módulo extraído de [pictos-net](https://github.com/mediafranca/pictos-net) para integración en el repositorio independiente [mediafranca/pictos-index](https://github.com/mediafranca/pictos-index).

PICTOS Index es una iniciativa de la red MediaFranca para la evaluación multidimensional de pictogramas de comunicación aumentativa y alternativa (CAA).

## Contenido de este directorio

Este directorio preserva la implementación de PICTOS Index que existía en pictos-net, organizada para facilitar su portabilidad:

```
pictos-index-extract/
├── types.ts                    # Interfaz EvaluationMetrics (6 dimensiones Likert 1-5)
├── corpus/
│   └── canonicalData.ts       # Corpus PICTOS Index 50 (50 frases, 8 categorías pragmáticas)
├── services/
│   └── pictosIndexService.ts  # calculatePictosIndexAverage, buildPictosIndexMetadata, meetsPictosIndexThreshold
├── components/
│   └── HexagonChart.tsx       # Componente React de visualización hexagonal
└── utils/
    └── getEvaluationScore.ts  # Helper de puntaje y codificación de color
```

El schema de validación vive en el repositorio oficial:
[https://github.com/mediafranca/pictos-index](https://github.com/mediafranca/pictos-index)

## Dimensiones PICTOS Index

Las 6 dimensiones en escala Likert 1-5, alineadas con el esquema oficial:

| Código | Dimensión | Descripción |
|--------|-----------|-------------|
| CLA | Clarity | Claridad visual y legibilidad |
| REC | Recognizability | Facilidad de reconocimiento |
| SEM | Semantic Transparency | Transparencia semántica |
| PRA | Pragmatic Fit | Adecuación pragmática en contextos CAA |
| CUL | Cultural Adequacy | Adecuación cultural y lingüística |
| COG | Cognitive Accessibility | Accesibilidad cognitiva |

## Corpus PICTOS Index 50

50 frases distribuidas en 8 categorías pragmáticas:
SOLICITAR, RECHAZAR, DIRIGIR, ACEPTAR, INTERACCIÓN SOCIAL, EMOCIÓN, COMENTAR, PREGUNTAR.

Endpoint externo: `https://mediafranca.net/pictos-index/frases.json`

## Instrucciones de integración

1. Copiar este directorio al repositorio destino
2. Ajustar el import de `RowData` en `corpus/canonicalData.ts` al tipo equivalente del repo destino
3. El componente `HexagonChart.tsx` requiere React y Tailwind CSS
4. Los esquemas JSON de validación se mantienen en [`schemas/`](../schemas/)

## Historial

Extraído de pictos-net en febrero de 2026 para modularización de la iniciativa MediaFranca.
La evaluación PICTOS Index ya no es un requisito de calidad interno en pictos-net; el módulo opera
como herramienta de investigación independiente en el repositorio mediafranca/pictos-index.

# UI_MAP — ICAP v2

> Mapa estructural de la interfaz. Fuente de verdad para todos los IDs semánticos.
> Actualizar siempre que se cree, renombre o elimine una región.

> Última actualización: 2026-07-29
> Estado: propuesto — ninguna pantalla implementada aún

## Convención

Heredada de PICTOS.net, ver `docs/UI_CONVENTIONS.md`:

```
#region              sección principal estática   → #site-header, #prep-rail, #site-footer
#region-subregion    sección secundaria           → #prep-step-calibration
#screen-name         raíz de pantalla             → #screen-spontaneous-comprehension
#block-name          bloque dentro de pantalla    → #block-layer-a, #block-verdict
#field-name          campo de formulario          → #field-threshold-a1
#widget-name         componente interactivo       → #threshold-slider, #judgment-scale-c1
#item-{id}           elemento dinámico            → #item-AR_0413
```

Prohibidos: `#container`, `#wrapper`, `#box`, `#main`, cualquier ID genérico.

---

## Armazón

```
#app-shell
│
├── #site-header                          [h-20, sticky, z-dropdown]
│   ├── #brand-area                       → wordmark ICAP + subtítulo
│   ├── #prep-rail                        [indicador de preparación; avanza, no retrocede]
│   │   ├── #prep-step-source
│   │   ├── #prep-step-validation
│   │   ├── #prep-step-profile
│   │   ├── #prep-step-context
│   │   └── #prep-step-calibration
│   ├── #diagnostics-entry                [permanente desde que la fuente queda analizada]
│   └── #locale-switcher
│
├── #screen-root                          [una pantalla a la vez]
│
└── #site-footer                          [en todas, discreto en tarea]
    ├── #footer-credits
    ├── #footer-links
    └── #footer-versions                  [esquema · rúbrica · protocolo · calibración]
```

## Público

```
#screen-home
├── #home-intro
├── #home-source-entry
└── #home-methodology-link

#screen-methodology
├── #methodology-what
├── #methodology-dimensions               [tabla de 14 en 4 capas]
├── #methodology-protocol
├── #methodology-limitations              [bloque de rendición de cuentas]
├── #methodology-references
└── #methodology-versions
```

## Preparación · lineal y bloqueante

```
#screen-source-import                     ← SourceImport
├── #widget-source-dropzone
├── #field-source-schema
└── #import-submit

#screen-import-report                     ← ImportReportView        [BLOQUEANTE]
├── #report-summary
├── #report-rows-valid
├── #report-rows-partial
├── #report-rows-invalid                  [motivo nombrado por fila]
├── #report-inheritance-applied
├── #report-exceptions
├── #report-schema-version
├── #report-download                      [debe habilitarse ANTES de #report-accept]
└── #report-accept

#screen-profile
├── #field-role                           [4 roles declarados]
├── #field-ethnographic-*
├── #widget-consent                       [versionado]
└── #profile-submit

#screen-context
├── #field-presentation-medium
├── #field-presentation-size
├── #field-viewing-distance                [ver problema abierto B2]
└── #context-submit

#screen-calibration                       ← CalibrationTask
├── #calibration-item
├── #block-deferred-anchor                [marca de revelación diferida]
├── #judgment-scale-cal
├── #calibration-seal
├── #calibration-reveal                   [respuesta propia + ancla, juntas]
└── #calibration-divergence               [se reporta, NUNCA bloquea]
```

## Tarea · repetitiva por ítem

```
#screen-item-index
├── #index-progress-c                     [sobre biblioteca]
├── #index-progress-b                     [sobre submuestra]
└── #item-{id}                            [+ StateChip: pendiente | no muestreado | registrada]

#screen-spontaneous-comprehension          ← SpontaneousComprehension
├── #pictogram-stage                      [alt obligatorio]
├── #block-deferred-phrase                [la frase objetivo NO está en este DOM]
├── #field-spontaneous-answer
├── #comprehension-seal                   [aviso específico, acción deliberada]
└── #comprehension-reveal                 [respuesta + frase objetivo, juntas;
                                            #field-spontaneous-answer se RETIRA]

#screen-phrase-correspondence              ← PhraseCorrespondence
├── #pictogram-stage
├── #target-phrase                        [ya revelada, legítima aquí]
└── #widget-correspondence

#screen-judgment                           ← JudgmentEntry
└── #judgment-dim-c1 … #judgment-dim-c4
    ├── #judgment-scale-c{n}              [celdas 1–5, 60px]
    ├── #judgment-absence-c{n}            [3 celdas, MISMO peso gráfico, misma fila]
    └── #field-absence-reason-c{n}        [obligatorio si "sin competencia"]

#screen-threshold-task                     ← ThresholdTask   [sólo submuestra]
├── #threshold-axis-tabs                   [B1 · B2 · B3]
├── #threshold-pass-indicator              [1 de 2; no revela la pasada anterior]
├── #threshold-subsample-progress          [ítem N de M sobre SUBMUESTRA]
├── #pictogram-stage                       [degradado en vivo]
├── #threshold-slider                      [valor oculto; alternativa por teclado]
├── #threshold-commit
└── #threshold-cannot-do
```

## Diagnóstico · siempre disponible, sólo lectura

```
#screen-item-ficha                         ← ItemFicha
├── #item-version                          [versión + hash, sin interacción]
├── #verdict-band-{itemId}                 [estado + causa + magnitud]
├── #block-compensatory-profile            [tratamiento distinto del veto]
├── #block-layer-a                         [barras contra umbral]
│   └── #block-layer-a-lesser              [A3 advertencia, A4 hipótesis]
├── #block-layer-b                         [unidades físicas + 2 pasadas + Δ]
├── #block-layer-c                         [triángulo C1–C3 + C4 al lado]
└── #block-superseded-evidence             [sección propia, etiquetada, no oculta]

#screen-family-report                      ← FamilyReportView
├── #family-plane                           [D1 × D2, figura de portada]
├── #pair-distribution                      [histograma completo + corte]
└── #family-fragility                       [D3, ordenamiento sin criterio]

#screen-aggregate                          ← AggregateView
├── #aggregate-coverage                     [las 5 celdas, ninguna opcional]
└── #aggregate-records                      [sección SEPARADA de las estadísticas]
```

## Administración

```
#screen-response-coding                    ← ResponseCodingView   [otro rol, otro momento]
#screen-export
├── #field-export-view                      [compacta | resuelta, elección explícita]
└── #export-submit
```

## Configuración de umbrales

```
#screen-thresholds
├── #field-threshold-a1                     + aviso "propuesta sin calibrar"
├── #field-threshold-b2                     + aviso + nota de unidad ambigua
└── #field-threshold-d1                     + aviso + "derivado de la distribución"
```

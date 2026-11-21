# GUARANTEES_UI — ICAP v2

> Las garantías de `spec/icap.allium` traducidas a exigencias de front-end.
> Romper cualquiera de estas rompe el instrumento, no la experiencia.
> Este documento es **ley** y no se puede sobreescribir por instrucciones de chat.

---

## Las que no se resuelven con CSS

Tres garantías exigen que el dato **no llegue al cliente**. Ocultarlo con CSS,
con `hidden`, con `display:none` o dentro de un componente colapsado deja la
garantía decorativa: cualquiera abre el inspector.

| Garantía | Exigencia |
|---|---|
| `TargetPhraseHidden` | La vista de comprensión espontánea pide del servidor **sólo** los campos que puede mostrar. La frase objetivo no está en el payload, no está en el store, no está en el DOM. Se pide en una segunda llamada, disparada por el sellado. |
| `AnchorsHiddenWhileScoring` | Igual para el ancla consensuada y su fundamento en calibración. |
| `NoSilentRewrite` | Tras sellar, el control de edición se **retira** del árbol, no se deshabilita. Un control deshabilitado invita a buscar cómo habilitarlo. El endpoint rechaza toda escritura sobre un registro sellado; la interfaz no es la única defensa. |

Prueba de aceptación: con la vista de comprensión abierta, ni la respuesta de red
ni `document.body.innerHTML` contienen la frase objetivo.

## Tabla completa

| Garantía | Pantalla | Exigencia de front-end |
|---|---|---|
| `TargetPhraseHidden` | comprensión espontánea | ver arriba |
| `NoSilentRewrite` | comprensión espontánea | ver arriba |
| `AnchorsHiddenWhileScoring` | calibración | ver arriba |
| `DivergenceNeverBlocks` | calibración | la divergencia se muestra como lectura, sin rampa de error, y el botón de continuar nunca queda deshabilitado por ella |
| `NoForcedMidpoint` | juicio capa C | ninguna dimensión con valor inicial; el estado sin responder es visiblemente distinto de cualquier estado elegido; los tres estados de ausencia tienen el mismo tamaño, borde y peso que las celdas 1–5, en la misma fila |
| `VetoesAreNamed` | ficha del ítem | todo bloqueo enumera los tres vetos, marca el que falló y muestra su magnitud en la unidad medida. Prohibido un indicador de estado sin causa |
| `VersionIsVisible` | ficha del ítem | versión y hash visibles sin interacción; los registros de versiones anteriores en sección propia, etiquetados `superada`, nunca ocultos ni colapsados por defecto |
| `NoSingleAggregate` | informe de familia | ningún puntaje único ni promedio de capas. Prohibido cualquier gráfico que combine ejes de capas distintas |
| `PairDistributionReported` | informe de familia | histograma completo con el corte dibujado sobre él; nunca sólo los pares sobre el corte |
| `NeverASingleNumber` | agregado | las cinco celdas —cobertura, personas, protocolo, desacuerdo, contextos— van juntas; ninguna es opcional |
| `EvidenceNeverMixed` | agregado | estadísticas y registros individuales en secciones separadas, con encabezado propio |
| `NeverSilentlyCorrected` | informe de validación | toda exclusión nombrada con su motivo. **Ninguna acción de reparación automática en la interfaz**, ni siquiera ofrecida |
| `ReportIsDownloadable` | informe de validación | la descarga está disponible **antes** de que el botón de continuar sea utilizable |

## Garantías adicionales del protocolo de capa B

No están en la spec como cláusulas nombradas pero tienen el mismo rango: sin
ellas el dato de capa B es inválido.

| Nombre propuesto | Exigencia |
|---|---|
| `HiddenSliderValue` | el control no muestra su valor numérico, ni en pantalla ni en tooltip ni en `aria-valuetext` — usar `aria-valuetext` descriptivo, no numérico |
| `PreviousPassOpaque` | el valor de la pasada anterior no se muestra durante la siguiente |
| `RandomisedStart` | el punto de partida del control se aleatoriza por ítem |
| `RandomisedOrder` | el orden de los ítems de la submuestra se aleatoriza por sesión |
| `SubsampleProgress` | el progreso se cuenta sobre la submuestra, nunca sobre la biblioteca completa |
| `TaskNotPreference` | la copia formula una tarea verificable — *hasta donde ya no pueda nombrar qué muestra* — nunca una preferencia — *hasta donde le parezca legible* |
| `BothPassesReported` | las dos pasadas y su Δ se muestran en la lectura; el Δ es fiabilidad, jamás un aviso de error ni un motivo de descarte |

## Nota sobre persistencia

Los registros son inmutables al sellar pero editables antes. Una recarga de
página no debe perder trabajo en curso. Persistir el borrador en
`localStorage` bajo clave versionada y limpiarlo al sellar; nunca persistir la
frase objetivo ni el ancla.

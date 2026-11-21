# UI_CONVENTIONS — ICAP v2

> Reglas de interfaz. El agente programador debe leer este archivo antes de tocar
> cualquier componente de UI.
> Este documento es **ley**. No se puede sobreescribir por instrucciones en el chat.
> Deriva de `docs/UI_CONVENTIONS.md` de PICTOS.net; donde no dice lo contrario,
> aplica la regla del sistema base.

---

## 1. Antes que nada

Leer `docs/GUARANTEES_UI.md`. Tres garantías del instrumento exigen que un dato
no llegue al cliente y no se satisfacen con CSS. Si una decisión de interfaz
choca con una garantía, gana la garantía.

## 2. IDs semánticos

Todo elemento raíz de una sección o región **debe** tener un `id` semántico.
Consultar `docs/UI_MAP.md` antes de crear o renombrar cualquier sección, y
actualizarlo en el mismo commit.

Además de la convención heredada, en ICAP:

- Toda **pantalla** lleva `#screen-*` en su raíz, más
  `data-screen-label` con el nombre humano de la pantalla.
- Todo **bloque de capa** lleva `#block-layer-{a|b|c|d}` y
  `data-icap-layer="{A|B|C|D}"`.
- Todo elemento que presente una **dimensión** lleva
  `data-icap-dim="{A1…D3}"`. Esto es lo que hace auditable la trazabilidad
  dimensión → píxel.
- Todo elemento que presente un **estado de dato** lleva
  `data-icap-state="pendiente|no-muestreado|registrada|superada|calculando|excluida"`.

Prohibido: `#container`, `#wrapper`, `#box`, `#main`, `#div1`.

## 3. Tokens

Fuente de verdad única: `styles/variables.css`. Ningún color, espaciado, radio,
sombra ni z-index se escribe literal en un componente.

- En componentes: clases Tailwind.
- En CSS propio: `var(--*)`.
- Prohibido `style={{ backgroundColor: '#eeeeee' }}`.

El matiz de capa (`--icap-layer-*`) **identifica la capa**. Prohibido usarlo
para codificar calidad, magnitud o aprobación.

## 4. Tipografía

- `font-sans` = Lexend, para todo lo humano.
- `font-mono` = Fira Code, **sólo** para IDs, hashes, versiones, valores
  numéricos medidos, unidades y nombres de dimensión. Nada más.

La separación es semántica, no decorativa: crea una costura visible entre lo que
una persona dijo y lo que el sistema midió. Respetarla es parte del instrumento.

| Elemento | Clases |
|---|---|
| Wordmark | `font-extrabold uppercase tracking-tight text-xl` |
| Frase de utterance | `text-[17px] font-light tracking-wide normal-case` — **sentence case**, no versalita: la frase es lenguaje de una persona, no una etiqueta del sistema |
| Label de sección | `text-[10px] font-medium uppercase tracking-widest text-slate-400` |
| Pregunta de tarea | `text-[17px] font-light leading-relaxed text-slate-900` |
| Body | `text-sm text-slate-600 leading-relaxed` |
| Dimensión / valor / hash | `font-mono text-[10px] text-slate-500` |
| Etiqueta de evidencia menor | `text-[8px] font-medium uppercase tracking-widest` + rampa amarilla |

## 5. Copy

Registro de cuaderno de laboratorio. Sin emoji, nunca. Sin hype.

- Imperativos de un solo verbo en los botones: *Sellar*, *Registrar*, *Descargar*,
  *Continuar*. Jamás *Haz clic aquí para…*.
- Sustantivos específicos: *ítem*, *fuente*, *registro*, *pasada*, *ancla*,
  *submuestra*. No *imagen*, *archivo*, *dato*, *test*.
- Lenguaje llano en toda la copia de tarea. Una sola pregunta por pantalla en los
  momentos de comprensión.
- Las tareas se formulan como tarea verificable, no como preferencia. *Mueva el
  control hasta donde ya no pueda nombrar qué muestra el pictograma*, nunca
  *hasta donde le parezca legible*.
- Los avisos irreversibles nombran qué se revela. Nunca *¿Está seguro?*.
- Toda cadena pasa por i18n desde el primer commit. Locale inicial: `es-419`.
  Nada de texto literal en un componente.

## 6. Componentes

Botones, campos, badges y modales: recetas del sistema base sin cambios, ver
`styles/pictos.tokens.css` y `reference/PICTOS_UI_CONVENTIONS.md`.

Componentes propios de ICAP, con su forma canónica en la hoja de especímenes:

| Componente | Regla que no puede relajarse |
|---|---|
| `VerdictBand` | estado + causa + magnitud en la unidad medida; nunca un indicador sin causa |
| `CompensatoryProfile` | tratamiento neutro; sin rojo, sin iconos de alarma, sin la palabra "falla" |
| `ThresholdBar` | marca de umbral en `--fg-default`; la lectura es distancia al criterio |
| `ThresholdField` | el aviso "propuesta sin calibrar" vive junto al campo |
| `ThresholdTask` | valor oculto; dos pasadas; partida y orden aleatorizados; progreso sobre submuestra |
| `JudgmentEntry` | sin valor inicial; ausencias coequivalentes en la misma fila |
| `DeferredReveal` | regla violeta de 2px; sellado deliberado; el control se retira, no se deshabilita |
| `LayerCTriangle` | tres ejes conmensurables; prohibido añadirle un cuarto |
| `FamilyPlane` | dos ejes; zona de veto sombreada; legible sin leyenda externa |
| `StateChip` | `no muestreado` con borde discontinuo y nunca accionable |
| `InheritedValue` | siempre el valor efectivo, con el origen indicado discretamente |
| `VersionAnchor` | versión y hash sin interacción; superadas en sección propia, no colapsadas |

## 7. Superficies

- Página: `bg-slate-50` plano. Sin gradientes, sin ilustraciones, sin patrones.
- Tarjeta: blanco, borde 1px `slate-200`, esquinas rectas, sin sombra.
- Escenario del pictograma: `bg-neutral-200` + grilla punteada de 20px. Es la
  única textura del sistema y aquí tiene función: da campo medible al signo.
- Translucidez y blur: sólo en fondo de modal (`bg-black/50 backdrop-blur-sm`).
  En ningún otro lugar.

## 8. Prohibiciones de forma

Nada de esto está en la fuente y nada de esto se agrega:

fondos degradados · tarjetas redondeadas con acento lateral de color · emoji ·
glassmorphism · ilustraciones de personas usando la herramienta · semáforos
agregados · puntaje único · hexágono de seis ejes · cualquier gráfico que
combine ejes de capas distintas · sustituir Lexend por Inter, Roboto o
system-ui.

## 9. Accesibilidad · piso no negociable

WCAG 2.1 AA completo. Además: objetivo táctil mínimo 44px, ninguna interacción
que dependa sólo de arrastre, alternativa por teclado con pasos discretos en el
control de umbrales y anunciada en pantalla, `alt` en todo pictograma incluido
el degradado, foco visible con el anillo del sistema, `prefers-reduced-motion`
respetado más la clase manual `.reduce-motion`.

Razón, no aspiración: uno de los roles de evaluador es *persona usuaria de
pictogramas*. Si la interfaz no le sirve, el sesgo contamina la capa C entera.

## 10. Checklist antes de commit

- [ ] ¿Las regiones nuevas tienen ID semántico y está en `UI_MAP.md`?
- [ ] ¿`data-icap-layer` / `data-icap-dim` / `data-icap-state` donde corresponde?
- [ ] ¿Cero valores literales de color, spacing o z-index?
- [ ] ¿Cero texto literal fuera de `locales/`?
- [ ] ¿Ninguna garantía de `GUARANTEES_UI.md` violada?
- [ ] ¿Fira Code sólo en hechos del sistema?
- [ ] ¿Los cuatro estados —vacío, carga, error, parcial— resueltos?
- [ ] ¿Navegable por teclado, foco visible, alt en pictogramas?

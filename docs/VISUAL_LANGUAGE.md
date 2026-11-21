# VISUAL_LANGUAGE — ICAP v2

> Lenguaje visual del sitio público de evaluación. Deriva del design system de
> PICTOS.net sin bifurcarlo.

---

## 1. Principio

ICAP mide pictogramas. La consecuencia de diseño es que **el pictograma evaluado
debe ser lo más colorido de la pantalla**, siempre. Todo el cromo recede: un
violeta de marca sobre campo pizarra, esquinas rectas, borde de 1&nbsp;px en lugar
de sombra, tipografía en dos familias con una separación estricta de oficio —
Lexend para lo humano, Fira Code para los hechos del sistema.

Esta regla no es estética prestada: si el cromo compite con el signo, contamina
la medición. Es la misma razón por la que la única textura del sistema, la grilla
punteada de 20&nbsp;px, en ICAP pasa de detalle a instrumento: da campo medible al
objeto que se está midiendo.

## 2. Qué se hereda sin cambios

Paleta completa, escala tipográfica, escala de espaciado de 4&nbsp;px, radios,
sombras, tiempos de animación, anillo de foco, reglas de borde y de tarjeta. Los
tokens viven en `styles/variables.css` y nada se declara fuera de ahí.

Dos herencias que conviene subrayar porque son contraintuitivas y son marca:

- **El hover del botón primario va a negro puro**, no a un violeta más oscuro.
- **Todo es cuadrado por defecto.** Los radios pequeños (4–6&nbsp;px) son para
  campos de formulario y botones. No hay tarjetas redondeadas.

Una divergencia deliberada respecto del sistema base: **la frase objetivo y la
respuesta de la persona van en sentence case, no en versalita.** En PICTOS.net la
frase es la entrada de un pipeline y la versalita la vuelve etiqueta; en ICAP es
lenguaje que alguien dijo y que otra persona tiene que leer y comparar con lo que
escribió. La versalita queda reservada a lo que el sistema rótula — marca,
labels de sección, badges, botones.

Se hereda también la voz: registro de cuaderno de laboratorio, imperativos de un
solo verbo en los botones, sin emoji, honesta sobre el estado del trabajo. En
ICAP esa honestidad es requisito funcional, no tono: el instrumento tiene que
declarar lo que no está en condiciones de afirmar.

## 3. Qué se extiende

Cuatro extensiones, todas derivadas de tokens existentes. Ninguna introduce un
matiz nuevo al sistema.

### 3.1 Las cuatro capas

Los cinco matices de fase del pipeline generativo se reasignan a las cuatro capas
de ICAP según el **origen del dato**, que es el principio organizador del
instrumento.

| Capa | Token | Valor | Origen del dato |
|---|---|---|---|
| A geométrica | `--icap-layer-a` | `#3b82f6` | script, en la ingesta |
| B psicofísica | `--icap-layer-b` | `#f97316` | ajuste humano, submuestra ~20&nbsp;% |
| C interpretativa | `--icap-layer-c` | `#10b981` | juicio humano, Likert 1–5 |
| D familia | `--icap-layer-d` | `#8b5cf6` | script, sobre el set completo |

El matiz **identifica la capa**. Nunca codifica calidad, magnitud ni aprobación.
Un valor malo en capa A sigue siendo azul; lo que cambia es el veredicto, que
tiene sus propios colores.

Se reasigna en lugar de inventar porque las capas son etapas de un procedimiento
—igual que las fases del pipeline— y el sistema ya tiene un juego de matices
probado para diagramar procedimientos. Un quinto matiz nuevo habría competido con
el violeta de marca.

### 3.2 Nivel de evidencia

La rampa amarilla pálida de "obsoleto / inconsistente" del sistema base pasa a
significar **evidencia de menor grado**: métrica marcada como hipótesis (A4),
métrica marcada como advertencia (A3), y umbral sin calibrar.

Tratamiento: fondo `#fefce8`, borde `#fde68a`, texto `#a16207`, nombre de la
dimensión en cursiva, y **etiqueta visible siempre** — `hipótesis`,
`advertencia`, `propuesta sin calibrar`. Nunca se presenta como un puntaje más
de la lista. El aviso de "sin calibrar" vive en el punto de edición del umbral,
no en la documentación.

### 3.3 Veredicto

- **Bloqueado**: rampa de error. Fondo `#fee2e2`, borde `#fecaca`, texto
  `#991b1b`, cuadrado de 8&nbsp;px en `#dc2626`. Siempre acompañado de la tabla
  de los tres vetos, con el que falló destacado y su magnitud en la unidad medida.
- **Admisible**: **no** es la rampa de éxito completa. Superficie blanca, borde
  `#e2e8f0`, cuadrado `#10b981`, texto `#047857`. Admisible significa que los
  tres vetos pasan, no que el signo sea bueno; el tratamiento tiene que ser
  sobrio para que no se lea como una aprobación de calidad.
- **Perfil compensatorio**: neutro. Sin rojo, sin iconos de alarma, sin la
  palabra "falla". Rejilla de valores contra su máximo o su piso.

Un ítem admisible con perfil débil y un ítem bloqueado son cosas distintas y
deben verse distintas.

### 3.4 La marca de revelación diferida

El patrón de sellado necesita un tratamiento gráfico propio y reconocible, para
que la segunda vez que aparezca la persona ya sepa qué va a pasar. La marca es
una **regla de 2&nbsp;px en `--color-primary` sobre el borde superior del bloque
diferido**, más su etiqueta en violeta versalita.

Aparece en exactamente dos lugares: comprensión espontánea y calibración. En
ningún otro. Es el equivalente funcional del `spectral-pulse` de PICTOS.net: el
único gesto expresivo del sistema, gastado a propósito en un solo momento.

## 4. Gramática de gráficos

Las cuatro capas no comparten unidad y por lo tanto **no comparten gráfico**.
Cualquier figura que combine ejes de capas distintas está prohibida. De ahí la
ficha de tres bandas, y de ahí que el hexágono de v1 no vuelva.

| Objeto | Forma | Por qué |
|---|---|---|
| Capa A | barra horizontal con marca de umbral en `#0f172a` | lo que importa es la distancia al criterio, no el valor |
| Capa B | cifra grande en unidad física + las dos pasadas + Δ | el número *es* el dato; el Δ es fiabilidad, no descarte |
| Capa C | triángulo C1–C3 | único radar legítimo: tres ejes conmensurables, misma escala |
| Familia | plano D1 × D2 con la zona de veto sombreada | figura de portada; dos ejes comparables entre sí |
| Pares | histograma completo con el corte dibujado sobre él | la distribución entera, nunca sólo la cola |
| Biblioteca | cinco celdas: cobertura, personas, protocolo, desacuerdo, contextos | nunca colapsa en una cifra |

Las cinco celdas del agregado van siempre juntas y ninguna puede faltar.

## 5. Estados del dato

El estado parcial es la situación normal de v2, no un error. Seis distintivos, y
la distinción entre los dos primeros es obligatoria:

| Distintivo | Forma | Semántica |
|---|---|---|
| `pendiente` | borde continuo `#e2e8f0`, accionable | hay tarea, está sin hacer |
| `no muestreado` | **borde discontinuo** `#cbd5e1`, nunca accionable | fuera de la submuestra B; no hay tarea y no la habrá |
| `registrada` | rampa éxito | sellada, inmutable, anclada a una versión |
| `superada` | rampa pizarra | versión anterior; se muestra separada y etiquetada |
| `calculando` | rampa naranja | sólo ingesta y capa D; dice *qué* calcula |
| `excluida` | rampa error | fila no admitida, con motivo; sin reparación automática |

## 6. Accesibilidad

ICAP mide accesibilidad cognitiva, así que su interfaz está obligada a cumplir el
estándar que evalúa — y no como aspiración: uno de los roles de evaluador
declarados es *persona usuaria de pictogramas*. Si la interfaz no le sirve, el
instrumento excluye del juicio a la población para la que los pictogramas fueron
hechos, y el sesgo contamina la capa C entera.

Piso: WCAG 2.1 AA completo. Además, propio del dominio:

- Lenguaje llano en toda la copia de tarea. Una sola pregunta por pantalla en los
  momentos de comprensión.
- Objetivo táctil mínimo 44&nbsp;px. Las celdas de la escala C son de 60&nbsp;px.
- Ninguna interacción depende sólo de arrastre. El control de umbrales tiene
  alternativa por teclado con incrementos discretos, anunciada en pantalla.
- Texto alternativo en todo pictograma presentado, incluido el degradado.
- `prefers-reduced-motion` respetado, más la clase manual `.reduce-motion`.

Someter las pantallas de tarea a la misma prueba de degradación que el
instrumento aplica a los pictogramas. Es barato y es coherente.

## 7. Pendientes para el diseñador

Cosas que este paquete no cierra y que no debe cerrar el agente programador por
su cuenta:

1. **Las seis pantallas de interacción novedosa.** Comprensión espontánea y
   correspondencia, calibración, umbrales de capa B, juicio de capa C, ficha del
   ítem, informe de familia. Este paquete entrega el vocabulario; las
   composiciones se diseñan aparte.
2. **C4 y el triángulo.** La regla dice triángulo de tres ejes conmensurables,
   pero la capa C tiene cuatro dimensiones Likert; C4 entró después de fijar la
   figura. La hoja de especímenes lo resuelve como triángulo C1–C3 más C4
   reportada al lado en la misma unidad. Es decisión de forma, no de instrumento;
   confirmar o corregir.
3. **La expansión de la sigla.** El repo la expande de dos maneras
   contradictorias. Este paquete adopta *Image-Communication Accessibility
   Protocol*, coherente con la eliminación del puntaje único. Requiere corrección
   de una línea en `index.html`, `README.md` y `ICAP-extract/README.md`.
4. **B2 y la unidad ambigua.** Los píxeles de canvas no son tamaño físico. Hasta
   que haya calibración, la interfaz declara que B2 sólo compara dentro de una
   misma sesión.
5. **Isotipo.** No existe. La marca es la palabra en Lexend 800 versalita.

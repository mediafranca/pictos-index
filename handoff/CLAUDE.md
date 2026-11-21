# CLAUDE.md — ICAP v2

Instrumento de medición de calidad pictográfica. Sitio público de evaluación,
rama `v2`. Stack con build. Locale inicial `es-419`, i18n desde el primer commit.

## Lectura obligatoria antes de tocar UI

En este orden, y no se puede saltar:

1. **`docs/GUARANTEES_UI.md`** — las 13 garantías de `spec/icap.allium` traducidas
   a exigencias de front-end. Romper una rompe el instrumento, no la experiencia.
   Tres de ellas exigen que un dato **no llegue al cliente**: ocultarlo con CSS
   deja la garantía decorativa.
2. **`docs/VISUAL_LANGUAGE.md`** — el lenguaje visual y su racional. Qué se
   hereda de PICTOS.net, qué se extiende y por qué.
3. **`docs/UI_CONVENTIONS.md`** — cómo se escribe. Es **ley** y no se
   sobreescribe por instrucciones de chat.
4. **`docs/UI_MAP.md`** — el mapa de IDs semánticos de las 17 pantallas. Fuente
   de verdad. Actualizarlo en el mismo commit que crea o renombra una región.
5. **`docs/lenguaje-visual.html`** — hoja de especímenes. Abrirla en el navegador:
   es la forma canónica renderizada de cada componente, con su nombre y su `id`.
   Cuando un documento y la hoja difieran, manda la hoja.

## Reglas que se rompen sin darse cuenta

- **Ningún puntaje único.** No hay promedio de capas, no hay hexágono de seis
  ejes, no hay semáforo agregado. Las unidades de las cuatro capas no son
  conmensurables y reconstruir un agregado está explícitamente prohibido.
- **La frase objetivo no está en el DOM** de la vista de comprensión espontánea.
  Tampoco el ancla en calibración mientras se puntúa. Esas vistas piden del
  servidor sólo los campos que pueden mostrar.
- **Tras sellar, el control de edición se retira**, no se deshabilita.
- **Los tres estados de ausencia de la capa C tienen el mismo peso gráfico que la
  escala 1–5**, en la misma fila. Ninguna dimensión arranca con valor.
- **El control de umbrales nunca muestra su valor numérico**, ni el de la pasada
  anterior. Ni en pantalla, ni en tooltip, ni en `aria-valuetext`.
- **`pendiente` y `no muestreado` no pueden verse iguales.** La segunda no tiene
  tarea asociada y nunca la tendrá.
- **Los tres umbrales de veto son propuestas sin calibrar** y la interfaz lo dice
  en el punto de edición, no en la documentación.
- **Ningún valor literal** de color, spacing, radio o z-index en un componente:
  todo sale de `styles/variables.css`. Ningún texto literal fuera de `locales/`.

## Convenciones de marcado propias

Además de los `id` semánticos de `docs/UI_MAP.md`:

- `data-screen-label` en la raíz de cada pantalla.
- `data-icap-layer="A|B|C|D"` en cada bloque de capa.
- `data-icap-dim="A1…D3"` en cada elemento que presente una dimensión.
- `data-icap-state="pendiente|no-muestreado|registrada|superada|calculando|excluida"`
  en cada elemento que presente un estado de dato.

Esto es lo que hace auditable la trazabilidad dimensión → píxel.

## Accesibilidad

WCAG 2.1 AA completo es piso, no meta. Uno de los roles de evaluador declarados
en el modelo es *persona usuaria de pictogramas*: si la interfaz no le sirve, el
instrumento excluye del juicio a la población para la que los pictogramas fueron
hechos, y el sesgo contamina la capa C entera. Ver `docs/VISUAL_LANGUAGE.md` § 6.

## Lo que no está decidido

`docs/VISUAL_LANGUAGE.md` § 7 lista cinco puntos abiertos — entre ellos el
triángulo de capa C frente a C4, la unidad ambigua de B2 y la expansión de la
sigla. No resolverlos por cuenta propia: preguntar.

# Hand-off del lenguaje visual · ICAP v2

Paquete de entrega para el agente programador. La estructura de carpetas de aquí
espeja la del repo `mediafranca/ICAP`: copiar el contenido de `handoff/` sobre la
raíz del repo en la rama `v2` deja cada archivo en su lugar.

## Qué contiene

| Ruta en este paquete | Ruta destino en el repo | Rol |
|---|---|---|
| `CLAUDE.md` | `CLAUDE.md` | Contexto permanente para Claude Code. Si el repo ya tiene uno, fusionar. |
| `docs/lenguaje-visual.html` | `docs/lenguaje-visual.html` | Hoja de especímenes autocontenida. Abrir en el navegador. |
| `docs/UI_CONVENTIONS.md` | `docs/UI_CONVENTIONS.md` | **Ley.** Reglas de interfaz. Leer antes de tocar cualquier componente. |
| `docs/UI_MAP.md` | `docs/UI_MAP.md` | Mapa de IDs semánticos de las 17 pantallas. Fuente de verdad. |
| `docs/VISUAL_LANGUAGE.md` | `docs/VISUAL_LANGUAGE.md` | El lenguaje visual y su racional: qué se hereda, qué se extiende y por qué. |
| `docs/GUARANTEES_UI.md` | `docs/GUARANTEES_UI.md` | Las 13 garantías de `spec/icap.allium` traducidas a exigencias de DOM y de datos. |
| `styles/variables.css` | `styles/variables.css` | Tokens. Base PICTOS.net + extensión ICAP. Único lugar donde vive un color. |
| `styles/pictos.tokens.css` | `styles/pictos.tokens.css` | Copia sin modificar de los tokens del sistema base, como referencia. |
| `locales/es-419.json` | `locales/es-419.json` | Cadena de copy inicial. i18n desde el primer commit. |
| `public/fonts/` | `public/fonts/` | Lexend variable. Fira Code se carga de Google Fonts. |
| `reference/` | — | Documentos de origen de PICTOS.net. No copiar al repo; sólo consulta. |

Junto a este paquete va la **hoja de especímenes** (`docs/lenguaje-visual.html`,
un solo archivo que funciona sin conexión): la forma canónica renderizada de cada
componente, con su nombre y su `id`. Es la referencia visual; estos documentos son
la referencia normativa. Cuando difieran, manda la hoja de especímenes y se
corrige el documento.

## Instalación

```sh
# desde la raíz del repo, en la rama v2
unzip handoff.zip
cp -r handoff/* .
rm -rf handoff
```

Luego revisar que `CLAUDE.md` no haya sobrescrito uno existente, y confirmar que
`styles/variables.css` se importa donde corresponda según el stack.

## Orden de lectura para el agente

1. `CLAUDE.md` — el resumen. Se carga solo en cada sesión.
2. `docs/GUARANTEES_UI.md` — qué no se puede romper. Antes que nada.
3. `docs/VISUAL_LANGUAGE.md` — el vocabulario y su razón de ser.
4. `docs/UI_CONVENTIONS.md` — cómo se escribe.
5. `docs/UI_MAP.md` — dónde va cada cosa.
6. `docs/lenguaje-visual.html` — cómo se ve.

## Qué NO está en este paquete

- El diseño de las 17 pantallas. Este paquete entrega el vocabulario, no las
  composiciones. Seis pantallas necesitan diseño original y están nombradas en
  `docs/VISUAL_LANGUAGE.md` § Pendientes.
- Un isotipo de ICAP. No existe. La marca es la palabra `ICAP` en Lexend 800
  versalita, y así debe quedar hasta que haya uno.
- Valores calibrados de los tres vetos. Los que aparecen son propuestas y la
  interfaz está obligada a decirlo en el punto de edición.

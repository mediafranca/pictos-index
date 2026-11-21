**For English speakers:** this document is in Spanish. See [the English README](./README_en.md).

<p align="center">
  <img src="web/assets/pictos-iso.svg" width="56" height="56" alt="Símbolo de PICTOS" />
</p>

<h1 align="center">PICTOS Index</h1>

<p align="center">
  Instrumento para evaluar la calidad comunicativa de bibliotecas pictográficas.
</p>

PICTOS Index permite revisar bibliotecas exportadas desde [pictos.net](https://pictos.net) mediante seis dimensiones complementarias. Todo el proceso ocurre en el navegador: los archivos cargados y el avance de la evaluación permanecen en el dispositivo de quien evalúa.

> [!WARNING]
> **Prototipo en construcción.** El índice, la rúbrica y los resultados son experimentales. No sustituyen estudios de comprensión, validación con personas usuarias ni una evaluación profesional de accesibilidad. Sus puntajes no deben interpretarse como certificación de una biblioteca pictográfica.

## Acerca del índice

PICTOS Index nace en la investigación doctoral de [Herbert Spencer](https://herbertspencer.net/cc) en diseño para la Comunicación Aumentativa y Alternativa, en Auckland University of Technology (AUT). Acompaña a [PICTOS.net](https://pictos.net): uno crea pictogramas desde la comprensión de lo que se quiere decir; el otro pregunta si lo logra. Los modelos generativos producen pictogramas en abundancia; el índice devuelve el juicio a las personas que los usan, los acompañan y los diseñan. Actualiza y reemplaza a VCSCI (*Visual Communicability and Semantic Correspondence Index*), su primera formulación.

El proyecto está bajo la custodia de [MediaFranca](https://mediafranca.net), iniciativa de Valparaíso que crea, reúne y cuida herramientas abiertas para la comunicación humana.

## Qué evalúa

1. **Claridad**
2. **Reconocibilidad**
3. **Transparencia semántica**
4. **Adecuación pragmática**
5. **Adecuación cultural**
6. **Accesibilidad cognitiva**

Cada pictograma recibe una valoración de 1 a 5 por dimensión. El instrumento muestra el perfil resultante en un gráfico hexagonal y acompaña cada puntaje con la descripción correspondiente de la rúbrica.

Al terminar los pictogramas, una auditoría separada muestra la biblioteca completa en una retícula normalizada y permite valorar dos propiedades del conjunto:

- **coherencia formal:** si los pictogramas se reconocen como integrantes de un mismo conjunto;
- **gramática visual:** si el conjunto aplica reglas visuales compartidas y reconocibles.

Estas dos valoraciones describen la biblioteca y **no se suman ni se promedian con el PICTOS Index** de los pictogramas. El análisis de pares confundibles queda fuera del alcance de esta versión.

## Probarlo en local

Requiere una versión reciente de [Node.js](https://nodejs.org/).

```bash
git clone https://github.com/mediafranca/pictos-index.git
cd pictos-index
npm run dev
```

Luego abre [http://localhost:4191](http://localhost:4191).

No hay dependencias que instalar: el servidor local usa únicamente Node.js.

## Idiomas

La interfaz y la rúbrica están disponibles en español latinoamericano (`es-419`) e inglés británico (`en-GB`). El idioma inicial sigue la preferencia del navegador y el selector del encabezado conserva la elección localmente.

Los catálogos viven en `locales/es-419.json` y `locales/en-GB.json`. Toda clave debe existir en ambos archivos y las descripciones de la rúbrica deben conservar sus pares `_es` / `_en`:

```bash
npm run validate-i18n
```

## Recorrido

1. **Cargar una biblioteca.** Acepta un archivo JSON exportado por PICTOS o una de las tres bibliotecas breves incluidas como ejemplo.
2. **Describir la relación con la CAA.** Permite marcar una o varias relaciones, o indicar que no existe experiencia previa.
3. **Evaluar los pictogramas.** Recoge primero una interpretación abierta y luego recorre las seis dimensiones, una por una, mostrando la rúbrica de cada nota.
4. **Evaluar la biblioteca.** Presenta todos los pictogramas en una retícula, con las etiquetas ocultas por defecto y un interruptor para mostrarlas, y registra coherencia formal y gramática visual como resultados separados.
5. **Exportar el resultado.** Descarga dos representaciones complementarias:
   - un **informe PDF** con el resumen de la biblioteca y una página por pictograma, donde aparecen la imagen, el gráfico, sus seis notas y su PICTOS Index;
   - un **JSON de datos** con el perfil de la persona evaluadora, el progreso, los promedios, el detalle por pictograma y la evaluación separada de la biblioteca.

El avance se guarda localmente en el navegador. La interfaz también ofrece navegación por teclado, gestión de foco, avisos para tecnologías de asistencia y adaptación a pantallas pequeñas.

## Formatos compatibles

El evaluador lee `payload.rows[]` de exportaciones PICTOS `schemaVersion: 3` y de archivos legados. Identifica cada pictograma mediante `row.id` o `row.sourceRowId` y obtiene su frase desde `row.UTTERANCE` o un campo equivalente.

Admite:

- imágenes raster desde `row.bitmap` como JPEG, PNG o WebP, en URL de datos, Base64 plano o URL HTTP(S);
- SVG desde `row.rawSvg` o `row.structuredSvg`.

Antes de mostrarlos, los SVG se aíslan como recursos de imagen y se limpian de elementos ejecutables y referencias externas.

## Ejemplos incluidos

Las tres bibliotecas de [`examples/`](examples/) contienen las mismas diez frases y permiten comparar representaciones distintas:

- **Raster:** 10 imágenes bitmap;
- **Recraft Vector:** 7 SVG y 3 bitmap;
- **Recraft Pro Vector:** 10 SVG.

## Rúbrica y exportación

La fuente de verdad de la escala está en [`data/rubric-scale-descriptions.json`](data/rubric-scale-descriptions.json). La documentación ampliada vive en [`docs/rubric.md`](docs/rubric.md).

La exportación usa el schema `pictos-index-library-evaluation-1.4.0` e incluye:

- metadatos de la biblioteca;
- relación de la persona evaluadora con la CAA;
- identificador UUID y marcas temporales propias de la evaluación;
- avance y promedios globales y por dimensión;
- comprensión pragmática, puntajes y promedio de cada pictograma.
- coherencia formal y gramática visual de la biblioteca, marcadas explícitamente como excluidas del promedio PICTOS Index.

El PDF se genera localmente con [jsPDF](https://github.com/parallax/jsPDF), cuya distribución UMD se conserva en `web/vendor/`. Las imágenes y evaluaciones no se envían a un servicio externo para producir el informe.

## Proyectos relacionados

| Repositorio | Descripción |
|---|---|
| [pictos-net](https://github.com/mediafranca/pictos-net) | Pictogramas generativos con razonamiento semántico ([pictos.net](https://pictos.net)) |
| [pictos-nlu-schema](https://github.com/mediafranca/pictos-nlu-schema) | Contrato de comprensión, basado en NSM y FrameNet |
| [pictos-composition-schema](https://github.com/mediafranca/pictos-composition-schema) | Contrato de composición visual |
| [pictos-svg-schema](https://github.com/mediafranca/pictos-svg-schema) | SVG semántico con metadatos de accesibilidad |

## Estructura del repositorio

```text
index.html             Interfaz principal
web/                   Lógica, estilos, recursos gráficos y dependencia PDF vendorizada
locales/               Catálogos paralelos es-419 / en-GB
data/                  Descripciones canónicas de la rúbrica
examples/              Bibliotecas breves para probar el instrumento
docs/                  Documentación de la rúbrica
schemas/               Schemas de los datos
specs/                 Especificación Allium del evaluador
scripts/               Servidor local y utilidades
```

## Publicación

El sitio es estático y puede publicarse directamente con GitHub Pages desde la raíz de la rama `main`.

1. Abre **Settings → Pages** en el repositorio.
2. Elige **Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/ (root)`.

Cada push posterior a `main` actualizará el sitio publicado.

## Citar

```
Spencer, H. (2026). PICTOS Index: evaluación de calidad pictográfica para la CAA.
https://github.com/mediafranca/pictos-index
```

*Licencia: Apache 2.0 (código) · CC BY 4.0 (rúbrica y documentación de investigación) · CC0 (bibliotecas de ejemplo). Detalle en [LICENSE](LICENSE).*

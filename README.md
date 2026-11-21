<p align="center">
  <img src="web/assets/pictos-iso.svg" width="56" height="56" alt="Símbolo de PICTOS" />
</p>

<h1 align="center">PICTOS Index</h1>

<p align="center">
  Instrumento para evaluar la calidad comunicativa de bibliotecas pictográficas.
</p>

PICTOS Index permite revisar bibliotecas exportadas desde [pictos.net](https://pictos.net) mediante seis dimensiones complementarias. Todo el proceso ocurre en el navegador: los archivos cargados y el avance de la evaluación permanecen en el dispositivo de quien evalúa.

## Qué evalúa

1. **Claridad**
2. **Reconocibilidad**
3. **Transparencia semántica**
4. **Adecuación pragmática**
5. **Adecuación cultural**
6. **Accesibilidad cognitiva**

Cada pictograma recibe una valoración de 1 a 5 por dimensión. El instrumento muestra el perfil resultante en un gráfico hexagonal y acompaña cada puntaje con la descripción correspondiente de la rúbrica.

## Probarlo en local

Requiere una versión reciente de [Node.js](https://nodejs.org/).

```bash
git clone https://github.com/mediafranca/pictos-index.git
cd pictos-index
npm run dev
```

Luego abre [http://localhost:4191](http://localhost:4191).

No hay dependencias que instalar: el servidor local usa únicamente Node.js.

## Recorrido

1. **Cargar una biblioteca.** Acepta un archivo JSON exportado por PICTOS o una de las tres bibliotecas breves incluidas como ejemplo.
2. **Describir la relación con la CAA.** Permite marcar una o varias relaciones, o indicar que no existe experiencia previa.
3. **Evaluar los pictogramas.** Recoge primero una interpretación abierta y luego recorre las seis dimensiones, una por una, mostrando la rúbrica de cada nota.
4. **Exportar el resultado.** Descarga un JSON con el perfil de la persona evaluadora, el progreso, los promedios y el detalle por pictograma.

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

La exportación usa el schema `pictos-index-library-evaluation-1.3.0` e incluye:

- metadatos de la biblioteca;
- relación de la persona evaluadora con la CAA;
- identificador UUID y marcas temporales propias de la evaluación;
- avance y promedios globales y por dimensión;
- comprensión pragmática, puntajes y promedio de cada pictograma.

## Estructura del repositorio

```text
index.html             Interfaz principal
web/                   Lógica, estilos y recursos gráficos
data/                  Descripciones canónicas de la rúbrica
examples/              Bibliotecas breves para probar el instrumento
docs/                   Documentación de la rúbrica
schemas/                Schemas de los datos
scripts/                Servidor local y utilidades
```

## Publicación

El sitio es estático y puede publicarse directamente con GitHub Pages desde la raíz de la rama `main`.

1. Abre **Settings → Pages** en el repositorio.
2. Elige **Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/ (root)`.

Cada push posterior a `main` actualizará el sitio publicado.

**English:** [development.md](development.md)

# Desarrollo

Notas para quien mantiene o modifica PICTOS Index. Para usar el instrumento, ver el [README](../README.md) y la [guía del protocolo](protocolo.md).

## Ejecutar en local

Requiere una versión reciente de [Node.js](https://nodejs.org/) (24.2 o posterior). No hay dependencias que instalar.

```bash
git clone https://github.com/mediafranca/pictos-index.git
cd pictos-index
npm run dev        # http://localhost:4191
npm test           # pruebas: alfa de Krippendorff, agregado, planillas, versión
npm run validate-i18n
```

El sitio es estático: `index.html` y la carpeta `web/`, sin paso de compilación.

## Parámetros de la URL

| Parámetro | Efecto |
|---|---|
| `?coordinar` | Abre la pantalla de coordinación de un panel |
| `?p=<n>` | Número de participante; los impares responden la forma A y los pares, la B |
| `?forma=A` / `?forma=B` | Asigna la forma a mano, sin número de participante |
| `?lib=<dirección>` | Carga la librería sola: una ruta del sitio o una dirección pública que permita lecturas entre sitios (CORS) |

Sin `?p` ni `?forma`, la aplicación ofrece la evaluación individual.

## Formatos de librería

El evaluador lee `payload.rows[]` de exportaciones de PICTOS.net (`schemaVersion: 3`) y de archivos anteriores. Identifica cada pictograma por `row.id` o `row.sourceRowId` y toma su frase de `row.UTTERANCE` o un campo equivalente. El contexto de uso viene de `config.domainContext`.

Admite imágenes raster desde `row.bitmap` (JPEG, PNG o WebP, como URL de datos, Base64 o URL HTTP(S)) y SVG desde `row.rawSvg` o `row.structuredSvg`. Los SVG se muestran como imágenes, limpios de elementos ejecutables y referencias externas.

## Idiomas

La interfaz está en español latinoamericano (`es-419`) e inglés británico (`en-GB`), en `locales/`. Toda clave debe existir en ambos catálogos; `npm run validate-i18n` lo comprueba, junto con las claves usadas en el código.

- Las frases clave de un texto se marcan como `**frase**` en el catálogo y se muestran en negrita.
- La rúbrica vive en [`data/rubric-scale-descriptions.json`](../data/rubric-scale-descriptions.json), con pares `_es` / `_en`. Las negritas de cada nivel están en `emphasis_es` / `emphasis_en`, y el validador exige que cada frase aparezca tal cual en su texto.

## Versiones

PICTOS Index usa [SemVer](https://semver.org/lang/es/) desde la 4.0.0. La versión se declara en `index.html` (`<meta name="pictos-index-version">`) y en `package.json`, y una prueba exige que coincidan. La aplicación la muestra en el encabezado y la guarda en cada evaluación exportada (`instrumentVersion`).

- **Mayor:** cambios en lo que se mide o en el formato de los datos.
- **Menor:** funciones nuevas que no rompen lo anterior.
- **Parche:** correcciones y cambios de texto.

Cada versión publicada lleva su etiqueta (`git tag -a vX.Y.Z`). La rama `v3` conserva el estado anterior a la versión 4.

## Publicación

GitHub Pages publica la rama `main`, desde la raíz, en [mediafranca.net/pictos-index](https://mediafranca.net/pictos-index/). Cada push a `main` actualiza el sitio; el trabajo en curso se hace en otra rama y se integra a `main` al publicar una versión.

## Línea de comandos del protocolo

Lo que hace la pantalla de coordinación puede hacerse también así:

```bash
node scripts/aggregate-protocol.mjs libreria.json evaluaciones/           # informe agregado
node scripts/coding-sheets.mjs sheets agregado.json planillas/ --judges 2 # una planilla por juez
node scripts/coding-sheets.mjs merge agregado.json planillas/juez-1.csv planillas/juez-2.csv
```

La versión de línea de comandos de `merge` no lleva la cuenta de rondas: conserva el informe de su primera ejecución.

## Dependencias incluidas

Sin servicios externos, todo se genera en el navegador:

- [jsPDF](https://github.com/parallax/jsPDF) para el informe PDF (`web/vendor/jspdf.umd.min.js`);
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 2.0.4, MIT, para los códigos QR (`web/vendor/qrcode.mjs`);
- [Lexend](https://github.com/googlefonts/lexend), OFL, para el PDF (`web/vendor/fonts/`).

## Estructura

```text
index.html     Interfaz
web/           Lógica (app, protocolo, coordinación, i18n), estilos, recursos y dependencias incluidas
locales/       Catálogos es-419 / en-GB
data/          Rúbrica canónica
examples/      Librerías de ejemplo
docs/          Documentación
schemas/       Esquemas de datos
specs/         Especificación Allium del evaluador (anterior a la versión 4)
scripts/       Servidor local, protocolo por línea de comandos y pruebas
```

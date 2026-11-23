**English:** [README_en.md](README_en.md)

<p align="center">
  <img src="web/assets/pictos-index-favicon.svg" width="56" height="56" alt="Símbolo de PICTOS Index" />
</p>

<h1 align="center">PICTOS Index</h1>

<p align="center">
  Instrumento abierto para evaluar la calidad comunicativa de librerías de pictogramas para la CAA.
</p>

<p align="center">
  <a href="https://mediafranca.net/pictos-index/"><strong>Abrir PICTOS Index</strong></a> ·
  <a href="https://mediafranca.net/pictos-index/?coordinar"><strong>Coordinar un panel</strong></a> ·
  <a href="docs/protocolo.md"><strong>Guía del protocolo</strong></a>
</p>

> [!WARNING]
> **Prototipo en construcción (versión 4).** El índice, la rúbrica y los resultados son experimentales. No sustituyen estudios de comprensión, validación con personas usuarias ni una evaluación profesional de accesibilidad, y sus resultados no certifican una librería.

## Qué es

Los modelos generativos producen pictogramas en abundancia, y alguien tiene que decir si comunican. PICTOS Index devuelve ese juicio a las personas que los usan, acompañan su uso o los diseñan. Evalúa cada pictograma por sí mismo y también como parte de su librería, y separa dos preguntas que suelen confundirse: si un pictograma **se entiende** sin conocer su frase, y si **sirve** para decirla en una situación concreta.

Todo ocurre en el navegador. No hay cuentas, servidor ni base de datos: las respuestas solo salen del dispositivo como un archivo que la persona decide entregar.

## Dos maneras de usarlo

| | Evaluación individual | Evaluación en panel |
|---|---|---|
| **Para qué** | Revisar una librería por tu cuenta | Estudiar una librería con un grupo, con resultados comparables |
| **Quiénes** | Una persona | Quien coordina, 8 o más personas evaluadoras y 2 o más jueces |
| **Qué se pregunta** | Qué comunica cada pictograma y, luego, sus seis dimensiones de calidad | Según la forma A o B: qué comunica (sin la frase) o si sirve aquí (con la frase) |
| **Resultado** | Informe PDF y datos JSON | Resultados por pictograma, con el acuerdo entre jueces |
| **Cómo empezar** | «Iniciar una evaluación» en la portada | «Coordinar un panel» en la portada |

## Evaluar en panel

El panel es la forma de usar PICTOS Index para investigar. Cada persona responde desde su teléfono, escaneando un código QR, y la librería se divide en dos mitades:

| Forma | Primera parte: sin la frase | Segunda parte: con la frase |
|---|---|---|
| **A** | mitad 1 → «¿Qué significa?» | mitad 2 → «¿Sirve aquí?» |
| **B** | mitad 2 → «¿Qué significa?» | mitad 1 → «¿Sirve aquí?» |

Así nadie interpreta un pictograma cuya frase ya vio, y cada pictograma recibe interpretaciones a ciegas de la mitad del panel y juicios de uso de la otra mitad. Las formas se reparten solas: los números impares responden la A y los pares, la B.

El recorrido completo:

1. **Quien coordina** elige la librería en [Coordinar un panel](https://mediafranca.net/pictos-index/?coordinar) y obtiene una tarjeta con código QR para cada persona, lista para imprimir.
2. **Cada persona** escanea su código y responde. Al terminar, su teléfono descarga un archivo con sus respuestas y lo envía a quien coordina.
3. **Quien coordina** carga esos archivos y descarga una planilla para cada juez.
4. **Los jueces**, por separado, deciden si cada interpretación escrita acertó, con un código del 1 al 6.
5. **Quien coordina** carga las planillas y obtiene, para cada pictograma, su tasa de comprensión, el acuerdo entre jueces y las respuestas de «¿Sirve aquí?».

La **[guía del protocolo](docs/protocolo.md)** lo explica paso a paso, con capturas: por qué hay dos formas, qué hace cada rol, cómo publicar una librería propia, qué cuenta como «entendido» y qué alfa informar.

## Cómo se recorre el instrumento

1. **Tú.** La persona declara su relación con la Comunicación Aumentativa y Alternativa (CAA).
2. **Conjunto.** Ve la librería completa, sin frases, y valora su coherencia formal y su gramática visual.
3. **Pictogramas.** Una pregunta por pantalla. Primero escribe qué cree que comunica cada pictograma, sin conocer su frase. En la evaluación individual, después ve la frase y califica seis dimensiones; en el panel, responde la parte que le toca según su forma.
4. **Entrega.** Descarga sus resultados. En el panel, el archivo se descarga solo y puede enviarse directamente desde el teléfono.

El avance queda guardado en el navegador, y el instrumento se puede usar por completo con el teclado.

## Qué se mide

- **Seis dimensiones por pictograma** (evaluación individual), de 1 a 5, cada nivel con su descripción: claridad, reconocibilidad, transparencia semántica, adecuación pragmática, adecuación cultural y accesibilidad cognitiva. Ver la [rúbrica](docs/rubric.md).
- **Dos propiedades del conjunto:** coherencia formal y gramática visual. Se informan aparte y nunca se promedian con los pictogramas.
- **Comprensión a ciegas** (panel): las interpretaciones escritas sin conocer la frase, codificadas por jueces.
- **Utilidad situada** (panel): si el pictograma sirve para decir su frase en el contexto de uso declarado.

Qué sustenta cada dimensión y qué no puede afirmar todavía el instrumento está en [fundamentos](docs/foundations.md).

## Librerías de ejemplo

Tres librerías breves, con el mismo estilo gráfico y un contexto de uso declarado, sirven para probar el instrumento y el protocolo:

- **Almorzar en el restorán** (18 pictogramas)
- **Viajar en transporte público** (18 pictogramas)
- **Consulta de salud** (18 pictogramas)

Son material de prueba, no librerías para usar con personas.

## Documentación

| Documento | Contenido |
|---|---|
| [Guía del protocolo](docs/protocolo.md) · [English](docs/protocol.md) | Cómo evaluar en panel, paso a paso |
| [Rúbrica](docs/rubric.md) | Las seis dimensiones y sus niveles (en inglés) |
| [Fundamentos](docs/foundations.md) | Literatura de cada dimensión y límites actuales (en inglés) |
| [Desarrollo](docs/desarrollo.md) · [English](docs/development.md) | Ejecutar en local, formatos, idiomas, versiones y publicación |

## Acerca de

PICTOS Index nace en la investigación doctoral de [Herbert Spencer](https://herbertspencer.net/cc) sobre diseño para la CAA, en Auckland University of Technology (AUT). Es el complemento evaluativo de [PICTOS.net](https://pictos.net), que genera pictogramas a partir de una frase y su situación de uso, y reemplaza a VCSCI, su primera formulación.

El proceso de PICTOS.net avanza en tres fases, y cada una se fija en un esquema formal: [pictos-nlu-schema](https://github.com/mediafranca/pictos-nlu-schema) para la comprensión de la intención comunicativa, [pictos-composition-schema](https://github.com/mediafranca/pictos-composition-schema) para la correspondencia entre palabra e imagen, y [pictos-svg-schema](https://github.com/mediafranca/pictos-svg-schema) para el SVG accesible que contiene toda su estirpe generativa.

Está bajo la custodia de [MediaFranca](https://mediafranca.net), iniciativa de Valparaíso que desarrolla y resguarda herramientas abiertas para la comunicación humana.

## Citar

```
Spencer, H. (2026). PICTOS Index: evaluación de calidad pictográfica para la CAA (versión 4).
https://github.com/mediafranca/pictos-index
```

*Licencias: Apache 2.0 (código) · CC BY 4.0 (rúbrica y documentación de investigación) · CC BY-SA (librerías de ejemplo). Detalle en [LICENSE](LICENSE).*

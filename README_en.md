**Para hispanohablantes:** la versión original de este documento está en [castellano](./README.md).

<p align="center">
  <img src="web/assets/pictos-iso.svg" width="56" height="56" alt="PICTOS symbol" />
</p>

<h1 align="center">PICTOS Index</h1>

<p align="center">
  An instrument for evaluating the communicative quality of pictogram libraries.
</p>

PICTOS Index reviews libraries exported from [pictos.net](https://pictos.net) across six complementary dimensions. Everything happens in the browser: the files loaded and the progress of the evaluation stay on the evaluator's device.

> [!WARNING]
> **Prototype under construction.** The index, the rubric and the results are experimental. They do not replace comprehension studies, validation with users or a professional accessibility assessment. Scores must not be read as a certification of a pictogram library.

## About the index

PICTOS Index grew out of the doctoral research of [Herbert Spencer](https://herbertspencer.net/cc) in design for Augmentative and Alternative Communication at Auckland University of Technology (AUT). It is the companion to [PICTOS.net](https://pictos.net): one creates pictograms from an understanding of what someone wants to say; the other asks whether they succeed. Generative models produce pictograms in abundance; the index returns judgement to the people who use them, support others with them and design them. It updates and replaces VCSCI (*Visual Communicability and Semantic Correspondence Index*), its first formulation.

The project is in the custody of [MediaFranca](https://mediafranca.net), an initiative from Valparaíso that creates, gathers and looks after open tools for human communication.

## What it evaluates

1. **Clarity**
2. **Recognisability**
3. **Semantic transparency**
4. **Pragmatic fit**
5. **Cultural adequacy**
6. **Cognitive accessibility**

Each pictogram is rated from 1 to 5 on every dimension. The instrument shows the resulting profile on a hexagonal chart and pairs each score with the rubric's description for that level.

Once the pictograms are done, a separate audit shows the whole library in a normalised grid and rates two properties of the set:

- **formal coherence:** whether the pictograms read as members of one set;
- **visual grammar:** whether the set applies shared, recognisable visual rules.

These two ratings describe the library and **are never added to or averaged with the PICTOS Index** of the pictograms. Analysis of confusable pairs is out of scope for this version.

## Run it locally

Requires a recent version of [Node.js](https://nodejs.org/).

```bash
git clone https://github.com/mediafranca/pictos-index.git
cd pictos-index
npm run dev
```

Then open [http://localhost:4191](http://localhost:4191).

There are no dependencies to install: the local server uses Node.js only.

## Languages

The interface and the rubric are available in Latin American Spanish (`es-419`) and British English (`en-GB`). The initial language follows the browser's preference, and the selector in the header remembers the choice locally.

The catalogues live in `locales/es-419.json` and `locales/en-GB.json`. Every key must exist in both files, and rubric descriptions must keep their `_es` / `_en` pairs:

```bash
npm run validate-i18n
```

## Walkthrough

1. **Load a library.** Accepts a JSON file exported by PICTOS or one of the three short bundled example libraries.
2. **Describe your relationship with AAC.** One or several relationships can be chosen, or no prior experience.
3. **Evaluate the pictograms.** First records an open interpretation, then goes through the six dimensions one by one, showing the rubric for each score.
4. **Evaluate the library.** Shows every pictogram in a grid, with labels hidden by default and a toggle to show them, and records formal coherence and visual grammar as separate results.
5. **Export the result.** Downloads two complementary representations:
   - a **PDF report** with the library summary and one page per pictogram, showing the image, the chart, its six scores and its PICTOS Index;
   - a **JSON data file** with the evaluator's profile, progress, averages, per-pictogram detail and the separate library evaluation.

Progress is saved locally in the browser. The interface also offers keyboard navigation, focus management, announcements for assistive technologies and adaptation to small screens.

## Supported formats

The evaluator reads `payload.rows[]` from PICTOS `schemaVersion: 3` exports and from legacy files. It identifies each pictogram by `row.id` or `row.sourceRowId` and takes its phrase from `row.UTTERANCE` or an equivalent field.

It accepts:

- raster images from `row.bitmap` as JPEG, PNG or WebP, as a data URL, plain Base64 or an HTTP(S) URL;
- SVG from `row.rawSvg` or `row.structuredSvg`.

Before display, SVGs are isolated as image resources and stripped of executable elements and external references.

## Bundled examples

The three libraries in [`examples/`](examples/) each declare a context of use (`config.domainContext`) and share the same graphic style, so context is the only thing that varies between them:

- **Almorzar en el restorán** (having lunch at a restaurant): 18 phrases;
- **Viajar en transporte público** (travelling on public transport): 18 phrases;
- **Consulta de salud** (health appointment): 18 phrases.

They are in Spanish only for now. They are test material for the protocol, not libraries for use with people.

## Rubric and export

The source of truth for the scale is [`data/rubric-scale-descriptions.json`](data/rubric-scale-descriptions.json). Extended documentation lives in [`docs/rubric.md`](docs/rubric.md).

The export uses the `pictos-index-library-evaluation-1.4.0` schema and includes:

- library metadata;
- the evaluator's relationship with AAC;
- a UUID and timestamps for the evaluation;
- progress, and overall and per-dimension averages;
- each pictogram's spontaneous interpretation, scores and average;
- the library's formal coherence and visual grammar, explicitly marked as excluded from the PICTOS Index average.

The PDF is generated locally with [jsPDF](https://github.com/parallax/jsPDF), whose UMD build is kept in `web/vendor/`. Images and evaluations are not sent to any external service to produce the report.

## Related projects

| Repository | Description |
|---|---|
| [pictos-net](https://github.com/mediafranca/pictos-net) | Generative pictograms with semantic reasoning ([pictos.net](https://pictos.net)) |
| [pictos-nlu-schema](https://github.com/mediafranca/pictos-nlu-schema) | Understanding contract, based on NSM and FrameNet |
| [pictos-composition-schema](https://github.com/mediafranca/pictos-composition-schema) | Visual composition contract |
| [pictos-svg-schema](https://github.com/mediafranca/pictos-svg-schema) | Semantic SVG with accessibility metadata |

## Repository structure

```text
index.html             Main interface
web/                   Logic, styles, graphic assets and the vendored PDF dependency
locales/               Parallel es-419 / en-GB catalogues
data/                  Canonical rubric descriptions
examples/              Short libraries for trying the instrument
docs/                  Rubric documentation
schemas/               Data schemas
specs/                 Allium specification of the evaluator
scripts/               Local server and utilities
```

## Publishing

The site is static and can be published directly with GitHub Pages from the root of the `main` branch.

1. Open **Settings → Pages** in the repository.
2. Choose **Deploy from a branch**.
3. Select the `main` branch and the `/ (root)` folder.

Every later push to `main` updates the published site.

## Cite

```
Spencer, H. (2026). PICTOS Index: evaluating pictographic quality for AAC.
https://github.com/mediafranca/pictos-index
```

*Licence: Apache 2.0 (code) · CC BY 4.0 (rubric and research documentation) · CC BY-SA (example libraries). Details in [LICENSE](LICENSE).*

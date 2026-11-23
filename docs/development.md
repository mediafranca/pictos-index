**Castellano:** [desarrollo.md](desarrollo.md)

# Development

Notes for whoever maintains or modifies PICTOS Index. To use the instrument, see the [README](../README_en.md) and the [protocol guide](protocol.md).

## Running locally

Requires a recent [Node.js](https://nodejs.org/) (24.2 or later). There are no dependencies to install.

```bash
git clone https://github.com/mediafranca/pictos-index.git
cd pictos-index
npm run dev        # http://localhost:4191
npm test           # tests: Krippendorff's alpha, aggregate, sheets, version
npm run validate-i18n
```

The site is static: `index.html` and the `web/` folder, with no build step.

## URL parameters

| Parameter | Effect |
|---|---|
| `?coordinar` | Opens the panel coordination screen |
| `?p=<n>` | Participant number; odd numbers answer form A and even numbers form B |
| `?forma=A` / `?forma=B` | Assigns the form by hand, without a participant number |
| `?lib=<address>` | Loads the library by itself: a path on the site or a public address that allows cross-origin reads (CORS) |

Without `?p` or `?forma`, the app offers the individual evaluation.

## Library formats

The evaluator reads `payload.rows[]` from PICTOS.net exports (`schemaVersion: 3`) and earlier files. It identifies each pictogram by `row.id` or `row.sourceRowId` and takes its phrase from `row.UTTERANCE` or an equivalent field. The context of use comes from `config.domainContext`.

It accepts raster images from `row.bitmap` (JPEG, PNG or WebP, as a data URL, Base64 or HTTP(S) URL) and SVG from `row.rawSvg` or `row.structuredSvg`. SVGs are shown as images, stripped of executable elements and external references.

## Languages

The interface is in Latin American Spanish (`es-419`) and British English (`en-GB`), in `locales/`. Every key must exist in both catalogues; `npm run validate-i18n` checks this, along with the keys used in the code.

- Key phrases in a text are marked `**phrase**` in the catalogue and shown in bold.
- The rubric lives in [`data/rubric-scale-descriptions.json`](../data/rubric-scale-descriptions.json), with `_es` / `_en` pairs. Each level's bold phrases are in `emphasis_es` / `emphasis_en`, and the validator requires each phrase to appear verbatim in its text.

## Versions

PICTOS Index follows [SemVer](https://semver.org/) from 4.0.0. The version is declared in `index.html` (`<meta name="pictos-index-version">`) and in `package.json`, and a test requires them to match. The app shows it in the header and stamps it on every exported evaluation (`instrumentVersion`).

- **Major:** changes to what is measured or to the data format.
- **Minor:** new features that do not break what came before.
- **Patch:** fixes and wording changes.

Each published version is tagged (`git tag -a vX.Y.Z`). The `v3` branch keeps the state before version 4.

## Publishing

GitHub Pages publishes the `main` branch, from the root, at [mediafranca.net/pictos-index](https://mediafranca.net/pictos-index/). Each push to `main` updates the site; work in progress happens on another branch and is merged into `main` when a version is released.

## Protocol command line

What the coordination screen does can also be done like this:

```bash
node scripts/aggregate-protocol.mjs library.json evaluations/            # aggregate report
node scripts/coding-sheets.mjs sheets aggregate.json sheets/ --judges 2  # one sheet per judge
node scripts/coding-sheets.mjs merge aggregate.json sheets/juez-1.csv sheets/juez-2.csv
```

The command-line `merge` does not track rounds: keep the report of its first run.

## Bundled dependencies

No external services; everything is generated in the browser:

- [jsPDF](https://github.com/parallax/jsPDF) for the PDF report (`web/vendor/jspdf.umd.min.js`);
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 2.0.4, MIT, for the QR codes (`web/vendor/qrcode.mjs`);
- [Lexend](https://github.com/googlefonts/lexend), OFL, for the PDF (`web/vendor/fonts/`).

## Structure

```text
index.html     Interface
web/           Logic (app, protocol, coordination, i18n), styles, assets and bundled dependencies
locales/       es-419 / en-GB catalogues
data/          Canonical rubric
examples/      Sample libraries
docs/          Documentation
schemas/       Data schemas
specs/         Allium specification of the evaluator (predates version 4)
scripts/       Local server, protocol command line and tests
```

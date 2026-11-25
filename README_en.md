**Castellano:** [README.md](README.md)

<p align="center">
  <img src="web/assets/pictos-index-favicon.svg" width="56" height="56" alt="PICTOS Index symbol" />
</p>

<h1 align="center">PICTOS Index</h1>

<p align="center">
  An open instrument for evaluating the communicative quality of pictogram libraries for AAC.
</p>

<p align="center">
  <a href="https://mediafranca.net/pictos-index/"><strong>Open PICTOS Index</strong></a> ·
  <a href="https://mediafranca.net/pictos-index/?coordinar"><strong>Coordinate a panel</strong></a> ·
  <a href="docs/protocol.md"><strong>Protocol guide</strong></a>
</p>

> [!WARNING]
> **Prototype under development (version 4).** The index, the rubric and the results are experimental. They do not replace comprehension studies, validation with users or a professional accessibility assessment, and their results do not certify a library.

## What it is

Generative models produce pictograms in abundance, and someone has to say whether they communicate. PICTOS Index returns that judgement to the people who use them, support their use or design them. It evaluates each pictogram on its own and as part of its library, and it separates two questions that are often confused: whether a pictogram **is understood** without knowing its phrase, and whether it **works** for saying it in a specific situation.

Everything happens in the browser. There are no accounts, no server and no database: answers only leave the device as a file the person chooses to hand in.

## Two ways to use it

| | Individual evaluation | Panel evaluation |
|---|---|---|
| **What for** | Reviewing a library on your own | Studying a library with a group, with comparable results |
| **Who** | One person | A coordinator, 8 or more evaluators and 2 or more judges |
| **What is asked** | What each pictogram communicates, then its six quality dimensions | Depending on form A or B: what it communicates (without the phrase) or whether it works here (with the phrase) |
| **Result** | PDF report and JSON data | Results per pictogram, with agreement between judges |
| **How to start** | "Begin an evaluation" on the home page | "Coordinate a panel" on the home page |

## Evaluating with a panel

The panel is how PICTOS Index is used for research. Each person answers on their phone, by scanning a QR code, and the library is split into two halves:

| Form | Part one: without the phrase | Part two: with the phrase |
|---|---|---|
| **A** | half 1 → "What does it mean?" | half 2 → "Does it work here?" |
| **B** | half 2 → "What does it mean?" | half 1 → "Does it work here?" |

That way nobody interprets a pictogram whose phrase they have seen, and each pictogram gets blind interpretations from half the panel and use judgements from the other half. The forms are assigned by themselves: odd numbers answer A and even numbers B.

The whole route:

1. **The coordinator** chooses the library in [Coordinate a panel](https://mediafranca.net/pictos-index/?coordinar) and gets a card with a QR code for each person, ready to print.
2. **Each person** scans their code and answers. At the end, their phone downloads a file with their answers and sends it to the coordinator.
3. **The coordinator** loads those files and downloads a sheet for each judge.
4. **The judges**, separately, decide whether each written interpretation got it right, with a code from 1 to 6.
5. **The coordinator** loads the sheets and gets, for each pictogram, its comprehension rate, the agreement between judges and the "Does it work here?" answers.

The **[protocol guide](docs/protocol.md)** explains it step by step, with screenshots: why there are two forms, what each role does, how to publish your own library, what counts as "understood" and which alpha to report.

## How the instrument runs

1. **You.** The person states their relationship with Augmentative and Alternative Communication (AAC). In a panel, they first accept the consent.
2. **The set.** They see the whole library, without phrases, and rate its formal coherence and visual grammar. In a panel this step comes last, so that part one is answered without the set in view.
3. **Pictograms.** One question per screen. First they write what they think each pictogram communicates, without knowing its phrase. In the individual evaluation, they then see the phrase and rate six dimensions; in a panel, they answer the part their form assigns.
4. **Submit.** They download their results. In a panel, the file downloads by itself and can be sent straight from the phone.

Progress is saved in the browser, and the instrument can be used entirely with the keyboard.

## What is measured

The instrument under study is the **panel**:

- **Blind comprehension:** interpretations written without knowing the phrase, coded by judges. Reported as a rate with its confidence interval.
- **Situated usefulness:** whether the pictogram works for saying its phrase in the declared context of use.
- **Two properties of the set:** formal coherence and visual grammar. They are reported separately and never averaged with the pictograms.

The individual evaluation adds **six dimensions per pictogram**, from 1 to 5: clarity, recognisability, semantic transparency, pragmatic fit, cultural adequacy and cognitive accessibility (see the [rubric](docs/rubric.md)). It comes from version 3 and is useful for reviewing a library, but it cannot be validated as it stands: it is rated after the phrase is known, by a single person.

The [protocol guide](docs/protocol.md#what-each-aspect-rests-on) says what literature each aspect rests on; [foundations](docs/foundations.md) details the constructs and what the instrument cannot yet claim.

## Sample libraries

Three short libraries, in the same graphic style and with a declared context of use, are there to try the instrument and the protocol:

- **Lunch at a restaurant** (18 pictograms)
- **Travelling by public transport** (18 pictograms)
- **A health appointment** (18 pictograms)

Their phrases are in Spanish. They are test material, not libraries for use with people.

## Documentation

| Document | Contents |
|---|---|
| [Protocol guide](docs/protocol.md) · [Castellano](docs/protocolo.md) | How to evaluate with a panel, step by step |
| [Rubric](docs/rubric.md) | The six dimensions and their levels |
| [Foundations](docs/foundations.md) | Literature behind each dimension and current limits |
| [Development](docs/development.md) · [Castellano](docs/desarrollo.md) | Running locally, formats, languages, versions and publishing |

## About

PICTOS Index is a project by [Herbert Spencer](https://herbertspencer.net/cc) at [MediaFranca](https://mediafranca.net), on design for AAC. It is the evaluative counterpart to [PICTOS.net](https://pictos.net), which generates pictograms from a phrase and its context of use, and it replaces VCSCI, its first formulation.

The PICTOS.net process moves through three phases, each fixed in a formal schema: [pictos-nlu-schema](https://github.com/mediafranca/pictos-nlu-schema) for understanding the communicative intent, [pictos-composition-schema](https://github.com/mediafranca/pictos-composition-schema) for the correspondence between word and image, and [pictos-svg-schema](https://github.com/mediafranca/pictos-svg-schema) for the accessible SVG that holds its whole generative lineage.

It is in the custody of [MediaFranca](https://mediafranca.net), a Valparaíso initiative that develops and safeguards open tools for human communication.

## Citation

```
Spencer, H. (2026). PICTOS Index: pictographic quality evaluation for AAC (version 4).
https://github.com/mediafranca/pictos-index
```

*Licences: Apache 2.0 (code) · CC BY 4.0 (rubric and research documentation) · CC BY-SA (sample libraries). Details in [LICENSE](LICENSE).*

## Loading a library

Individual evaluation and panel coordination use the same source selector: choose an example, upload a local JSON file or paste a public library URL. The address must serve JSON and permit cross-origin reads; preview pages and private files do not work. If loading fails, correct the address and try again.

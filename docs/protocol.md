# Experimental protocol: counterbalanced forms

Status: experimental (`protocolo-experimental-0.2`). It runs without a server: each person evaluates on their own, downloads a JSON file, and the files are joined afterwards.

## Why

Revealing a phrase splits two constructs. Before it, an interpretation measures **transparency**: inferring meaning from the image. After it, a judgement measures **translucency** and use: whether the sign serves the referent once the referent is known. No one can stop knowing a phrase once they have seen it, and in a library drawn with one visual grammar, seeing item 1's phrase teaches something about item 7. Per-item reveals mix the two constructs. Randomising the order spreads that carry-over across items but does not remove it.

The protocol therefore splits the library in two halves and gives each person only one construct per item:

| Form | Pass 1: without the phrase | Pass 2: with the phrase |
|---|---|---|
| A | half 1: «¿Qué significa?» | half 2: «¿Sirve aquí?» |
| B | half 2: «¿Qué significa?» | half 1: «¿Sirve aquí?» |

Each item gets blind interpretations from one form and use judgements from the other. No one interprets an item whose phrase they have seen, or judges an item they first interpreted blind.

## Three questions, one per pictogram

1. **¿Se ve bien?** Form. Nobody is asked: it is measured automatically with [pictos-auto-index](https://pictos-index-protocolo.netlify.app) (stroke, units, closed regions, dispersion and confusability within the library).
2. **¿Qué significa?** Pass 1. An open interpretation without the phrase, later coded by judges.
3. **¿Sirve aquí?** Pass 2. With the phrase and the declared context of use, the person answers whether the pictogram helps someone say that phrase in that situation: *yes*, *with reservations*, *no*, or *I cannot judge*, with an optional reason.

The six ratings of the individual flow (clarity, recognisability, semantic transparency, pragmatic fit, cultural adequacy, cognitive accessibility) are not asked in the protocol. They remain only in the individual flow, so earlier evaluations stay readable. The profile hexagon and the average are not shown.

## How to run it

1. Choose a library that declares `config.domainContext`. That context is shown during both passes, so what is measured is **situated** transparency. Report it as such.
2. Send each evaluator a link with a consecutive participant number: `?p=1`, `?p=2`, `?p=3`… Odd numbers get form A and even numbers form B, so the forms stay balanced and every export carries `protocol.participant`. (`?forma=A` or `?forma=B` still works for a manual assignment, without a participant number.)
3. Each person loads the same library file. They first see the whole library as a grid without phrases and rate its formal coherence and visual grammar, then complete both passes and download the evaluation JSON. Seeing the set first does not reveal any phrase, so the blind pass stays blind.
4. Open the coordination screen (`?coordinar`, also linked from the home page), choose the library and load every evaluation file. The screen shows how many evaluations each form has, any warnings and the agreement on «¿Sirve aquí?», and downloads the aggregate report.

The same steps can be run from the command line:

```sh
node scripts/aggregate-protocol.mjs library.json evaluations/
```

Without `?forma` the app keeps the individual flow, in which each pictogram is interpreted and then rated on the six dimensions.

## What the app guarantees

- **Same split in every browser.** The split comes from a seed derived from the library, not from the session.
- **Order varies by person.** Within each pass, the order is shuffled with a seed drawn for each evaluation. That seed is recorded.
- **Blind phrases stay out of the page.** During pass 1 the phrase is not in the DOM; hiding it with CSS would not be enough. The phrases are also left out of the export (`utterance: null`), so a partial download cannot reveal them.
- **No going back.** Once pass 2 starts, the person cannot return to pass 1. After a reload, the session resumes at the first unfinished item.
- **Results are kept apart.** Progress is stored separately for each library, protocol version and form, so it does not mix with individual evaluations.

## Export

The evaluation JSON (`pictos-index-library-evaluation-1.5.0`) adds:

- `protocol`: version, form, partition seed, order seed, both halves, and the full sequence with each item's pass and position;
- `items[].pass`: `blind` or `sighted`;
- `items[].sirve_aqui`: for sighted items, `respuesta` (`yes`, `partly`, `no`, `cannot_judge`) and `motivo`.

## Aggregate report

`scripts/aggregate-protocol.mjs` checks that every file comes from the same library, protocol version and split, and warns when the forms are unbalanced. It writes, for each item:

- the blind interpretations, with form and position, for the judges to code (see below).
- the «¿Sirve aquí?» answers, with reasons, and their distribution.

It also writes Krippendorff's ordinal alpha over the «¿Sirve aquí?» answers, ordered *no* < *with reservations* < *yes*; *I cannot judge* counts as missing (Krippendorff, 2011). `scripts/aggregate-protocol.test.mjs` checks this against Krippendorff's published example. No average is computed.

## Coding the blind interpretations

Judges code each open answer against the source phrase with the six-value scheme of Ramírez (2018, p. 80, Fig. 9):

| Code | Category | Criterion |
|---|---|---|
| 1 | Correct | The answer matches the assigned meaning |
| 2 | Almost correct | The answer is similar or close to the assigned meaning |
| 3 | Doubtful | The answer points to another interpretation or is ambiguous |
| 4 | Incorrect | The answer does not match the assigned meaning |
| 5 | Opposite meaning | The answer points to the contrary meaning |
| 6 | No answer | No answer is given, or the person says they do not know |

Ramírez adapted it from the comprehension-test procedures described by Brugger (1999), Olgyay, Frascara (2011) and Boersema & Adams (2017), simplifying seven-value variants. His figure labels it «Brugger–Frascara». PICTOS Index keeps that label only as an internal name. It does not designate a scale published or validated jointly by Brugger and Frascara.

Suggested wording for publications: «Se aplicó el esquema de codificación de seis valores de Ramírez (2018, p. 80), referido internamente como "Brugger–Frascara".»

### Procedure, one spreadsheet per judge

Everything happens on the coordination screen. The scripts below do the same from the command line.

1. Choose the number of judges and download one sheet each (`juez-1.csv`, `juez-2.csv`, …). The screen also shows instructions for the judges, with the six codes, ready to forward. Each sheet lists every answer with an opaque id, the source phrase, the answer and an empty `codigo` column. Each sheet has its own random order and shows neither the evaluator, the form nor the position. Skipped answers are left out and count as code 6.
2. Each judge opens their sheet in Excel or Google Sheets, writes a code from 1 to 6 in `codigo`, saves it as CSV and sends it back, without seeing the other judges' codes.
3. Load all the returned sheets on the coordination screen. It lists problems in each sheet (missing or invalid codes), the nominal alpha between judges, the disagreements to resolve, and for each item the distribution of the codes on which all judges agree. Answers with disagreements are counted as unresolved until the judges settle them and correct their sheets. The screen downloads the coding report (JSON) and a results sheet with one row per item: half, code distribution, unresolved answers, and the count of each «¿Sirve aquí?» answer.

Command line equivalent:

```sh
node scripts/coding-sheets.mjs sheets aggregate.json sheets/ --judges 2
node scripts/coding-sheets.mjs merge aggregate.json sheets/juez-1.csv sheets/juez-2.csv
```

Codes are categories, not an interval scale: 6 is not "worse" than 5. Agreement between judges should therefore be reported with nominal alpha, and each item's result as the distribution of codes rather than a mean.

## Known limits

- Each person judges only half the library, so there is no full individual profile.
- «¿Sirve aquí?» is a judgement by the evaluator on behalf of the person who would use the pictogram. It is not that person's own use.
- Assigning forms is up to the coordinator. Without a server nothing balances them automatically.
- Transparency cannot be reported until at least two judges have coded the interpretations.
- A persistent carry-over remains: the blind items of pass 1 teach the visual grammar used in pass 2. That affects translucency, not transparency, and should be declared.

## References

Krippendorff, K. (2011). *Computing Krippendorff's alpha-reliability*. Annenberg School for Communication, University of Pennsylvania. https://repository.upenn.edu/asc_papers/43

Ramírez M., R. (2018). El desempeño de íconos como herramienta gráfica para comunicar la emergencia. *Revista de Estudios Latinoamericanos sobre Reducción del Riesgo de Desastres REDER*, 2(1), 71–87. https://doi.org/10.55467/reder.v2i1.12

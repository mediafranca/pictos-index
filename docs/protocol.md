# Experimental protocol: counterbalanced forms

Status: experimental (`protocolo-experimental-0.1`). It runs without a server: each person evaluates on their own, downloads a JSON file, and the files are joined afterwards.

## Why

Revealing a phrase splits two constructs. Before it, an interpretation measures **transparency**: inferring meaning from the image. After it, a rating measures **translucency**: judging the link between sign and referent once the referent is known. No one can stop knowing a phrase once they have seen it, and in a library drawn with one visual grammar, seeing item 1's phrase teaches something about item 7. Per-item reveals mix the two constructs. Randomising the order spreads that carry-over across items but does not remove it.

The protocol therefore splits the library in two halves and gives each person only one construct per item:

| Form | Pass 1: without the phrase | Pass 2: with the phrase |
|---|---|---|
| A | half 1: interpretation | half 2: ratings |
| B | half 2: interpretation | half 1: ratings |

Each item gets blind interpretations from one form and ratings from the other. No one interprets an item whose phrase they have seen, or rates an item they first interpreted blind.

## How to run it

1. Choose a library that declares `config.domainContext`. That context is shown during both passes, so what is measured is **situated** transparency. Report it as such.
2. Send each evaluator a link with their form, alternating so that the two forms have equal numbers:
   - `https://mediafranca.net/pictos-index/?forma=A`
   - `https://mediafranca.net/pictos-index/?forma=B`
3. Each person loads the same library file, completes both passes and the library audit, and downloads the evaluation JSON.
4. Join the files:

   ```sh
   node scripts/aggregate-protocol.mjs library.json evaluations/
   ```

Without `?forma` the app keeps the individual flow, in which each pictogram is interpreted and then rated.

## What the app guarantees

- **Same split in every browser.** The split comes from a seed derived from the library, not from the session.
- **Order varies by person.** Within each pass, the order is shuffled with a seed drawn for each evaluation. That seed is recorded.
- **Blind phrases stay out of the page.** During pass 1 the phrase is not in the DOM; hiding it with CSS would not be enough. The phrases are also left out of the export (`utterance: null`), so a partial download cannot reveal them.
- **No going back.** Once pass 2 starts, the person cannot return to pass 1. After a reload, the session resumes at the first unfinished item.
- **Results are kept apart.** Progress is stored separately for each library, protocol version and form, so it does not mix with individual evaluations.

## Export

The evaluation JSON (`pictos-index-library-evaluation-1.5.0`) adds:

- `protocol`: version, form, partition seed, order seed, both halves, and the full sequence with each item's pass and position;
- `items[].pass`: `blind` or `sighted`.

## Aggregate report

`scripts/aggregate-protocol.mjs` checks that every file comes from the same library, protocol version and split, and warns when the forms are unbalanced. It writes, for each item:

- the blind interpretations, with form and position, ready to be coded by judges. There is no automatic scoring of correctness.
- the sighted ratings for each dimension: n, median and values.

For each dimension it also writes Krippendorff's ordinal alpha over the sighted ratings (Krippendorff, 2011). `scripts/aggregate-protocol.test.mjs` checks this against Krippendorff's published example. No average is computed.

## Known limits

- Each person rates only half the library, so there is no full individual profile.
- Assigning forms is up to the coordinator. Without a server nothing balances them automatically.
- The interpretations still need a coding scheme and at least two judges before transparency can be reported.
- A persistent carry-over remains: the blind items of pass 1 teach the visual grammar used in pass 2. That affects translucency, not transparency, and should be declared.

## Reference

Krippendorff, K. (2011). *Computing Krippendorff's alpha-reliability*. Annenberg School for Communication, University of Pennsylvania. https://repository.upenn.edu/asc_papers/43

**Castellano:** [protocolo.md](protocolo.md)

# Evaluating with a panel: the form A / form B protocol

This guide explains how to evaluate a pictogram library with a group of people, each on their own phone or computer, and how to turn their answers into results. It is written for the person coordinating a panel; no programming is needed.

> [!NOTE]
> Status: experimental (`protocolo-experimental-0.2`), in PICTOS Index 4.x. There is no server and no database: each person answers in their browser, downloads a file with their answers and sends it to you.

## In short

1. You choose a library and make **one card with a QR code per person** on the [Coordinate a panel](https://mediafranca.net/pictos-index/?coordinar) screen.
2. Each person scans their code and answers. At the end, their phone downloads a file with their answers, which they send to you.
3. You load those files on the same screen. It prepares the sheets for **the judges**, who decide whether each written interpretation got it right.
4. You load the judges' sheets and get the results for each pictogram.

## Why there are two forms, A and B

A "form" is not a character: it is **one of two versions of the questionnaire**. Half the people answer form A and the other half form B.

The protocol wants to know two different things about each pictogram:

- **What does it mean?** Whether someone who does not know the phrase understands what the pictogram is trying to say. This is called *transparency*.
- **Does it work here?** Whether, knowing the phrase, the pictogram works for saying it in a specific situation.

The problem is that nobody can "unknow" a phrase. Once someone has seen that a pictogram means "I am thirsty", they can no longer honestly say what they would have made of it without knowing. So **the same person cannot answer both questions about the same pictogram**.

The solution is to split the library into two halves and hand them out in reverse order:

| Form | Part one: without the phrase | Part two: with the phrase |
|---|---|---|
| **A** | half 1 → "What does it mean?" | half 2 → "Does it work here?" |
| **B** | half 2 → "What does it mean?" | half 1 → "Does it work here?" |

With a library of 18 pictograms, each person interprets 9 blind and judges the other 9 with their phrase. Taken together, **each pictogram gets blind interpretations from half the panel and use judgements from the other half**, and nobody interprets a pictogram whose phrase they have already seen.

```mermaid
flowchart LR
  L[Library of 18 pictograms] --> H1[Half 1: 9]
  L --> H2[Half 2: 9]
  H1 -- "form A: what does it mean?" --> R1[Blind interpretations]
  H1 -- "form B: does it work here?" --> R2[Use judgements]
  H2 -- "form B: what does it mean?" --> R1
  H2 -- "form A: does it work here?" --> R2
```

**Who gets which form?** Each person's number decides it: odd numbers (1, 3, 5…) answer form A and even numbers (2, 4, 6…) form B. If you hand out the cards in order, the two forms balance by themselves. An even number of people is therefore best; we recommend at least 8.

**How do all the phones know which half is half 1?** The split is computed from the library itself, always the same way. As long as everyone evaluates exactly the same file, every phone gets the same halves, without a server.

## Who takes part

| Role | What they do | How many |
|---|---|---|
| **Coordinator** | Chooses the library, hands out the cards, gathers the files and sheets, and reads the results. | 1 |
| **Evaluators** | Answer the instrument on their phone or computer. | 8 or more, an even number |
| **Judges** | Come in at the end. They compare each written interpretation with the real phrase and decide whether it got it right. They work separately and do not evaluate pictograms. | 2 or more |

Why judges? Interpretations are free text, and someone has to decide whether "I want water" matches "I am thirsty". With two or more independent judges, it is possible to measure whether that decision is reliable.

## Step by step

### 1. Prepare the panel (coordinator)

Open [Coordinate a panel](https://mediafranca.net/pictos-index/?coordinar), also linked from the home page.

1. **Choose the library.** It can be one of the three samples or your own. The library must declare its **context of use** (`config.domainContext`), because the questions are answered with that situation in mind.
2. **If it is your own library, publish it on the internet.** Each person's link carries the library's address, so the file must be readable from another page:
   - **Works:** a GitHub repository (open the file and use the "Raw" button), a GitHub Gist or a Netlify site.
   - **Does not work:** Google Drive, Dropbox or OneDrive, because they show a preview instead of the file.
   - **Do not change the file while the panel runs.** If it changes, the halves change and the evaluations can no longer be compared. On GitHub, use the address of a specific commit.

   When you paste the address, the screen reads it the way the panel's phones will; if something is wrong, you see it there and not in the middle of the evaluation. A library that is only on your computer cannot travel in a link: each person would then have to load the same file by hand.
3. **Say how many people will evaluate.** One card appears per person, with their number, form, QR code, link and a copy button. **"Print cards with QR codes"** prints only the cards, ready to cut out and hand out.

![QR code cards on the coordination screen](img/en-coordinacion-tarjetas.png)

Each link looks like `…/pictos-index/?p=3&lib=…`: `p` is the person's number (and sets their form) and `lib` is the library.

### 2. Evaluate (each person)

Each person scans their code with the phone camera, or opens the link on a computer. The library loads by itself and cannot be changed. Wi-Fi is advisable: a library is several megabytes (the sample ones, about 20 MB).

1. **You.** They state their relationship with Augmentative and Alternative Communication (AAC).
2. **The set.** They see the whole library as a grid without phrases and rate its formal coherence and visual grammar. Seeing the set reveals no phrase.
3. **Part one: what does it mean?** For each pictogram in their blind half they write what they think it communicates, or choose "I do not know what it communicates". The phrase is not shown and is not in the page.
4. **Part two: does it work here?** For each pictogram in the other half they see the phrase and answer whether it helps someone say it in that situation: *yes*, *with reservations*, *no* or *I cannot judge*, with an optional reason. Once part two has started, there is no going back to part one.
5. **Submit.** On the last answer, the file with their answers **downloads by itself** and the screen names it. On most phones a "Send the file…" button also appears, which sends it straight to the coordinator by WhatsApp, email or other means.

<p>
  <img src="img/en-movil-conjunto.png" width="240" alt="The set step on a phone: the whole library, without phrases" />
  <img src="img/en-movil-parte1.png" width="240" alt="Part one on a phone: what does this pictogram communicate?, without the phrase" />
  <img src="img/en-movil-parte2.png" width="240" alt="Part two on a phone: does it work here?, with the phrase" />
</p>

If someone closes the browser halfway, opening their link again resumes where they left off.

### 3. Gather the evaluations (coordinator)

In step 2 of the coordination screen, load every file you received. The screen:

- counts the evaluations of each form and warns if they are unbalanced or if a file comes from another library or protocol version (and leaves it out);
- computes the agreement between people on "Does it work here?" (Krippendorff's ordinal alpha; "I cannot judge" counts as missing);
- downloads the **aggregate report** (JSON);
- prepares **one sheet per judge** (`juez-1.csv`, `juez-2.csv`…). Each sheet lists every written interpretation next to its real phrase, in a different random order for each judge and without names, forms or positions. "I do not know" answers are not on the sheets: they count directly as code 6.

### 4. Code (judges)

Each judge opens their sheet in Excel or Google Sheets and, **without seeing what the others do**, writes a number from 1 to 6 in the `codigo` column for each answer:

| Code | Category | Criterion |
|---|---|---|
| 1 | Correct | The answer matches the assigned meaning |
| 2 | Almost correct | The answer is similar or close to the assigned meaning |
| 3 | Doubtful | The answer points to another interpretation or is ambiguous |
| 4 | Incorrect | The answer does not match the assigned meaning |
| 5 | Opposite meaning | The answer points to the contrary meaning |
| 6 | No answer | No answer is given, or the person says they do not know |

This is the six-value scheme of Ramírez (2018, p. 80, Fig. 9), adapted from the comprehension-test procedures described by Brugger (1999), Olgyay, Frascara (2011) and Boersema & Adams (2017). His figure labels it "Brugger–Frascara"; PICTOS Index keeps that label only as an internal name, not as a scale published or validated jointly by Brugger and Frascara.

They then save the sheet as CSV, with the same name, and send it back. The coordination screen includes these instructions, ready to forward.

### 5. Read the results (coordinator)

In step 3, load every returned sheet. The screen shows:

- the problems in each sheet (missing or invalid codes);
- **the agreement between judges** (Krippendorff's nominal alpha);
- the **disagreements to resolve**: answers the judges coded differently. They count as "unresolved" until the judges agree and correct their sheets.

And it downloads:

- **results per item** (CSV), one row per pictogram: its half, how many interpretations it had, how many received each code, the unresolved ones, the strict and lenient comprehension rates, and how often each "Does it work here?" option was chosen;
- the **coding report** (JSON) with all of the above.

#### What counts as "understood"

This rule is fixed here, before any panel, so it cannot be chosen after seeing the data. For each pictogram, the share of settled answers that got it right is computed ("I do not know" counts as code 6; unresolved answers are left out until settled):

- **Strict (primary result):** code 1 only.
- **Lenient (secondary):** codes 1 and 2.

Report the strict rate as the result and the lenient one beside it. They allow comparison with the acceptance criterion of ISO 9186-1 or with published comprehension indices.

#### Which alpha to report

The alpha of the **first complete round** of sheets measures how reliable the coding is. If the judges later settle disagreements and resend their sheets, the new alpha measures how far they converged, not how reliable their judgement was. The screen therefore stores the first-round alpha for each panel and never overwrites it; each later set of sheets counts as a new round. **Report the first-round alpha.** It is kept in the coordinator's browser: keep the coding report from that first load.

Codes are categories, not a scale: 6 is not "worse" than 5. Agreement is therefore reported with nominal alpha, and each pictogram with the distribution of its codes, not an average.

## What the app guarantees

- **The same halves on every phone.** The split derives from the library, not from the session.
- **A different order for each person** within each part, with a seed that is recorded.
- **Blind phrases are not in the page.** During part one the phrase does not exist in the document (hiding it with styles would not be enough), and it is not in the exported file either.
- **No going back** from part two to part one; after a reload, it resumes at the first unfinished pictogram.
- **Every file is traceable:** it carries the person's number, form, protocol version and instrument version.

## What it cannot claim

- Each person judges only half the library: there is no complete individual profile.
- "Does it work here?" is the evaluator's judgement on behalf of whoever would use the pictogram, not that person's actual use.
- Transparency cannot be reported until at least two judges have coded the interpretations.
- A carry-over remains and must be declared: the pictograms in part one teach the visual grammar used in part two. That affects the use judgement (*translucency*), not transparency.
- Form (whether the pictogram "looks right") is not asked in the protocol: it is meant to be measured separately and automatically.

## Outside the protocol

Without a participant number (`?p=`) or form (`?forma=`), the app offers the **individual evaluation**: one person interprets each pictogram, then rates it on the six dimensions of the [rubric](rubric.md), and can download a PDF report. That route does not separate transparency from usefulness as the panel does.

## Details for whoever analyses the data

- **Each person's file** (`pictos-index-library-evaluation-1.5.0`): `protocol` (version, form, participant number, seeds, both halves and the full sequence), `items[].pass` (`blind` or `sighted`), `items[].sirve_aqui` (`respuesta`: `yes`, `partly`, `no`, `cannot_judge`; and `motivo`), `libraryAssessment` (coherence and grammar) and `instrumentVersion`.
- **Aggregate report** (`pictos-index-protocol-aggregate-0.2`): per item, the blind interpretations with form and position, and the "Does it work here?" answers with their distribution; plus the list of evaluations with their participant and the ordinal alpha.
- **Coding report** (`pictos-index-coding-0.2`): judges, `agreement` (nominal alpha and `firstRound`), `round`, disagreements and, per item, distribution, unresolved and `comprehension` (`strict`, `lenient`).
- The same can be done from the command line (see [development](development.md)).

## References

Krippendorff, K. (2011). *Computing Krippendorff's alpha-reliability*. Annenberg School for Communication, University of Pennsylvania. https://repository.upenn.edu/asc_papers/43

Ramírez M., R. (2018). El desempeño de íconos como herramienta gráfica para comunicar la emergencia. *Revista de Estudios Latinoamericanos sobre Reducción del Riesgo de Desastres REDER*, 2(1), 71–87. https://doi.org/10.55467/reder.v2i1.12

# Foundations of the PICTOS Index

This document states what each dimension of the PICTOS Index draws on, what the current instrument actually measures, and what it cannot yet claim. It is meant to be read with [rubric.md](rubric.md).

## Status

PICTOS Index is a prototype with two modes. In the **individual evaluation**, one evaluator interprets each pictogram and rates it on six ordinal dimensions (1–5). In the **panel protocol** ([protocol.md](protocol.md)), several evaluators split the library into a blind half and a sighted half, and judges code the blind interpretations. In both, the library is rated separately on formal coherence and visual grammar; in the panel, at the end, so the blind pass is answered without the set in view. The panel is the instrument under study; the six ratings of the individual evaluation come from version 3 and are kept as a review tool. The literature behind each aspect of the panel is summarised in [protocol.md](protocol.md#what-each-aspect-rests-on). None of this has been validated yet: the panel collects the data a reliability study needs (inter-rater agreement for the coding and for «¿Sirve aquí?»), but there are no studies of dimensional structure, norms or criterion validity.

The literature below grounds the *constructs*. It does not validate the *instrument*.

## Dimensions

| Dimension | Construct | Grounding in the literature | What the instrument records today | Known limitation |
|---|---|---|---|---|
| Clarity | Perceptual legibility of the graphic form | Graphic-symbol design and perceptual-quality testing (ISO 22727 for design requirements; ISO 9186-2 for perceptual quality) | A 1–5 judgement | Viewing distance is not controlled; the display size is fixed and recorded only in the panel; overlaps with cognitive accessibility |
| Recognizability | Identification of the referent | Iconicity terminology: transparency vs. translucency (Fuller & Lloyd, 1991); comprehension testing (ISO 9186-1); normative indices for ARASAAC pictograms (Díez et al., 2024); symbol norms (Prada et al., 2015) | A 1–5 judgement made **after** the source phrase is revealed | Strictly measures translucency, not transparency (see below) |
| Semantic transparency | Correspondence between pictogram and the meaning of the target phrase | Fuller & Lloyd (1991); Díez et al. (2024) | A 1–5 judgement, also after the reveal | Shares the hindsight bias of recognizability; in the individual evaluation the blind interpretation is recorded but not scored (the panel protocol codes it) |
| Pragmatic fit | Usefulness in real AAC communication | Communicative competence in AAC (Light & McNaughton, 2014); the field's current challenges (Light & McNaughton, 2012) | A 1–5 judgement | Bundles board utility, age/ability appropriateness and social adequacy |
| Cultural adequacy | Fit with the cultural and linguistic context of the users | Symbol perception varies with culture and language (Huer, 2000; Haupt & Alant, 2002; Dada, Huguet & Bornman, 2013; Kang, Kim & Yeon, 2019) | A 1–5 judgement | A proxy judgement: the evaluator may not belong to the community concerned, and `aacRelations` is not used to qualify it |
| Cognitive accessibility | Processing demands for people with cognitive or intellectual disability | Iconicity with children with intellectual disability (Dada, Huguet & Bornman, 2013) | A 1–5 judgement | A proxy judgement; overlaps with clarity. ISO/IEC 24751 and WCAG were formerly cited here and have been withdrawn: neither defines criteria for an isolated pictogram |

### Library level

| Dimension | Construct | Grounding | Limitation |
|---|---|---|---|
| Formal coherence | Consistency of graphic language across the set | Design tradition; no validated measure identified | Rated 1–5 by judgement; a computable dispersion measure is possible |
| Visual grammar | Systematic recombination of graphic elements | Design tradition; no validated measure identified | As above. Pairwise confusability between pictograms, which matters most on a communication board, is not yet assessed |

Both are reported alongside the per-pictogram profile and are never averaged into it.

## Transparency and translucency

In the AAC iconicity literature, *transparency* is the ability to guess a symbol's referent without knowing it, and *translucency* is the perceived strength of the relation between a symbol and a referent that is already known (Fuller & Lloyd, 1991). The individual evaluation asks for a blind interpretation first, then reveals the source phrase and asks for ratings. The blind interpretation is therefore the only transparency datum it collects; the subsequent ratings of recognizability and semantic transparency are, strictly, judgements of translucency. The panel protocol separates the two constructs by design: each person interprets one half of the library blind and judges the other half's use with its phrase, and judges code the blind interpretations with Ramírez's (2018) six-value scheme, giving a comprehension rate per pictogram. Díez et al. (2024) report both indices for 1,525 ARASAAC pictograms and are the natural point of comparison.

## What the current design cannot support

- **The average.** The per-pictogram average treats ordinal ratings as interval data, weights the six dimensions equally without justification and lets a serious failure in one dimension be offset by others. It is provisional.
- **Precision.** The individual evaluation, with one evaluator, no randomisation, no timing and no repeated items, gives no estimate of error. The panel protocol randomises order per person, records the time of each answer and the size the pictogram was shown at, measures agreement between judges (also on the comprehension rule) and gives each comprehension rate a Wilson interval, but has no repeated items yet.
- **Suitability thresholds.** No score level means "suitable for AAC". Earlier scale labels that said so have been withdrawn.
- **Comprehension thresholds.** Public-information symbol standards use comprehension criteria for adoption; the exact criterion, edition and method must be checked against the standard before any threshold is adopted here.

## Validation still to be done

Content validity with users, families and professionals; dimensional structure with multiple judges on common items; inter-rater reliability beyond the panel's coding (the protocol already reports Krippendorff's alpha for it; see Krippendorff, 2004); and criterion validity against measured comprehension.

## References

Verified against OpenAlex by DOI on 2026-11-22.

- Dada, S., Huguet, A., & Bornman, J. (2013). The iconicity of picture communication symbols for children with English additional language and mild intellectual disability. *Augmentative and Alternative Communication*, 29(4), 360–373. https://doi.org/10.3109/07434618.2013.849753
- Díez, E., Díez-Álamo, A. M., Alonso, M. Á., Wojcik, D. Z., & Fernández, Á. (2024). Transparency and translucency indices for 1,525 pictograms from the Aragonese Portal of Augmentative and Alternative Communication. *Frontiers in Psychology*, 15, 1467796. https://doi.org/10.3389/fpsyg.2024.1467796
- Fuller, D. R., & Lloyd, L. L. (1991). Toward a common usage of iconicity terminology. *Augmentative and Alternative Communication*, 7(3), 215–220. https://doi.org/10.1080/07434619112331275913
- Haupt, L., & Alant, E. (2002). The iconicity of picture communication symbols for rural Zulu children. *South African Journal of Communication Disorders*, 49(1), 40–49. https://doi.org/10.4102/sajcd.v49i1.216
- Huer, M. B. (2000). Examining perceptions of graphic symbols across cultures: Preliminary study of the impact of culture/ethnicity. *Augmentative and Alternative Communication*, 16(3), 180–185. https://doi.org/10.1080/07434610012331279034
- Kang, R., Kim, Y. T., & Yeon, S. J. (2019). Cultural differences on the recognition of social word AAC graphic symbols between Korean and American undergraduate students. *Communication Sciences & Disorders*, 24(1), 71–86. https://doi.org/10.12963/csd.18542
- Krippendorff, K. (2004). Reliability in content analysis: Some common misconceptions and recommendations. *Human Communication Research*, 30(3), 411–433. https://doi.org/10.1111/j.1468-2958.2004.tb00738.x
- Light, J., & McNaughton, D. (2012). The changing face of augmentative and alternative communication: Past, present, and future challenges. *Augmentative and Alternative Communication*, 28(4), 197–204. https://doi.org/10.3109/07434618.2012.737024
- Light, J., & McNaughton, D. (2014). Communicative competence for individuals who require augmentative and alternative communication: A new definition for a new era of communication? *Augmentative and Alternative Communication*, 30(1), 1–18. https://doi.org/10.3109/07434618.2014.885080
- Prada, M., Rodrigues, D. L., Silva, R. R., & Garrido, M. V. (2015). Lisbon Symbol Database (LSD): Subjective norms for 600 symbols. *Behavior Research Methods*, 48(4), 1370–1382. https://doi.org/10.3758/s13428-015-0643-7
- Ramírez M., R. (2018). El desempeño de íconos como herramienta gráfica para comunicar la emergencia. *Revista de Estudios Latinoamericanos sobre Reducción del Riesgo de Desastres REDER*, 2(1), 71–87. https://doi.org/10.55467/reder.v2i1.12

Standards (titles given for orientation; edition not yet checked):

- ISO 9186-1. Graphical symbols — Test methods — Part 1: Method for testing comprehensibility.
- ISO 9186-2. Graphical symbols — Test methods — Part 2: Method for testing perceptual quality.
- ISO 22727. Graphical symbols — Creation and design of public information symbols — Requirements.

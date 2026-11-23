# PICTOS Index Evaluation Rubric

This rubric provides working definitions for each evaluation dimension.

## Status

This is a prototype instrument. The dimensions, the scale and the anchors have not been validated: there are no reliability, dimensionality or criterion-validity studies yet, and anchored examples are still to be built. Ratings must not be read as certification or as evidence that a pictogram is suitable for AAC. The literature behind each dimension, and the limits of the current design, are documented in [foundations.md](foundations.md).

## Rating Scale

All dimensions use a 5-point scale:

| Score | Label | General Description |
|-------|-------|---------------------|
| **5** | Excelente | La cualidad evaluada está plenamente presente; no se observan problemas. |
| **4** | Bien | La cualidad evaluada está presente, con problemas menores. |
| **3** | Funciona | La cualidad evaluada está presente de forma parcial; hay problemas visibles. |
| **2** | Insuficiente | La cualidad evaluada está presente solo de forma limitada; predominan los problemas. |
| **1** | No funcional | La cualidad evaluada está ausente o gravemente comprometida. |

**Nota**: Cada dimensión tiene descripciones específicas para cada nivel. Las definiciones operacionales completas están disponibles en [data/rubric-scale-descriptions.json](../data/rubric-scale-descriptions.json), que puede ser consultado programáticamente por interfaces de evaluación y scripts de análisis.

---

## Dimension 1: Clarity

**Definition**: The degree to which the pictogram is visually clear, legible, and free from visual ambiguity.

### Operational Criteria

- Line quality (clean, not pixelated or blurry)
- Contrast (sufficient figure-ground separation)
- Visual clutter (absence of unnecessary elements)
- Scalability (readable at different sizes)
- Technical quality (proper SVG rendering)

### Scale Descriptions

**Complete operational definitions for each score level (1-5) are available in [data/rubric-scale-descriptions.json](../data/rubric-scale-descriptions.json).**

Quick reference:

- **5 (Excelente)**: Líneas nítidas, alto contraste, sin ruido visual, escala perfectamente
- **4 (Bien)**: Visualmente claro, detalles menores no afectan legibilidad
- **3 (Funciona)**: Generalmente claro, imperfecciones menores aceptables
- **2 (Insuficiente)**: Problemas de claridad evidentes, compromete usabilidad
- **1 (No funcional)**: Borroso, pixelado, ilegible, requiere rediseño completo

---

## Dimension 2: Recognizability

**Definition**: The ease with which a viewer can identify what the pictogram represents without additional context or explanation.

**Caveat**: in the current instrument this dimension is rated *after* the source phrase is revealed. Strictly, it therefore measures translucency (the perceived relation between symbol and known referent), not transparency (identifying the referent without knowing it). See [foundations.md](foundations.md).

### Operational Criteria

- Immediate recognition (< 2 seconds)
- Matches mental model of concept
- Uses conventional visual representations
- Minimal ambiguity or alternative interpretations
- Works without text labels

### Scale Descriptions

**Complete operational definitions for each score level (1-5) are available in [data/rubric-scale-descriptions.json](../data/rubric-scale-descriptions.json).**

Quick reference:

- **5 (Excelente)**: Instantáneamente reconocible, inequívoco, usa convenciones universales
- **4 (Bien)**: Fácilmente reconocible, significado principal evidente
- **3 (Funciona)**: Reconocible en 2-3 segundos, interpretación clara
- **2 (Insuficiente)**: Difícil de reconocer, múltiples interpretaciones
- **1 (No funcional)**: Imposible de reconocer, simbolismo oscuro, requiere rediseño

---

## Dimension 3: Semantic Transparency

**Definition**: The degree to which the pictogram accurately conveys the specific meaning of the target phrase.

### Operational Criteria

- Matches phrase meaning (not just a related concept)
- Captures key semantic elements
- Appropriate level of specificity/generality
- Conveys action, object, emotion, or relationship as needed
- Aligns with linguistic structure

### Scale Descriptions

**Complete operational definitions for each score level (1-5) are available in [data/rubric-scale-descriptions.json](../data/rubric-scale-descriptions.json).**

Quick reference:

- **5 (Excelente)**: Captura perfectamente el significado, todos los elementos semánticos presentes
- **4 (Bien)**: Captura muy bien el significado principal, matices menores pueden perderse
- **3 (Funciona)**: Captura el significado central, componentes principales presentes
- **2 (Insuficiente)**: Captura parcialmente, faltan elementos importantes
- **1 (No funcional)**: No representa adecuadamente, distorsión semántica severa

---

## Dimension 4: Pragmatic Fit

**Definition**: The usefulness and appropriateness of the pictogram in real-world AAC communication contexts.

### Operational Criteria

- Practical for communication boards/devices
- Appropriate for target user age/ability
- Functional in typical use scenarios
- Socially appropriate
- Supports communicative goals

### Scale Descriptions

**Complete operational definitions for each score level (1-5) are available in [data/rubric-scale-descriptions.json](../data/rubric-scale-descriptions.json).**

Quick reference:

- **5 (Excelente)**: Altamente práctico, apropiado para edad/capacidad, facilita autonomía
- **4 (Bien)**: Muy práctico, apropiado para mayoría de usuarios y contextos
- **3 (Funciona)**: Generalmente práctico, funcionalmente adecuado para necesidades básicas
- **2 (Insuficiente)**: Limitaciones prácticas significativas, efectividad limitada
- **1 (No funcional)**: Impráctico, inapropiado, no facilita comunicación efectiva

---

## Dimension 5: Cultural Adequacy

**Definition**: The appropriateness and relevance of the pictogram for the cultural and linguistic context of the target audience.

### Operational Criteria

- Culturally neutral or culturally appropriate imagery
- No offensive or insensitive representations
- Reflects target culture's norms and values
- Linguistically aligned (Spanish/English context)
- Avoids stereotypes

### Scale Descriptions

**Complete operational definitions for each score level (1-5) are available in [data/rubric-scale-descriptions.json](../data/rubric-scale-descriptions.json).**

Quick reference:

- **5 (Excelente)**: Perfectamente adecuado culturalmente, refleja auténticamente cultura objetivo
- **4 (Bien)**: Culturalmente apropiado, alta adecuación, bien alineado
- **3 (Funciona)**: Generalmente adecuado, culturalmente neutral o aceptable
- **2 (Insuficiente)**: Problemas de adecuación cultural, alineamiento débil
- **1 (No funcional)**: Culturalmente inapropiado u ofensivo, requiere rediseño

---

## Dimension 6: Cognitive Accessibility

**Definition**: The accessibility and usability of the pictogram for users with cognitive differences, learning disabilities, or intellectual disabilities.

### Operational Criteria

- Visual simplicity (not overwhelming)
- Cognitive load (easy to process)
- Memory demands (recognizable without memorization)
- Attention requirements (captures and holds attention)

### Scale Descriptions

**Complete operational definitions for each score level (1-5) are available in [data/rubric-scale-descriptions.json](../data/rubric-scale-descriptions.json).**

Quick reference:

- **5 (Excelente)**: Extremadamente simple, carga cognitiva mínima, inmediatamente procesable
- **4 (Bien)**: Muy accesible, carga cognitiva baja, reconocimiento rápido
- **3 (Funciona)**: Adecuadamente accesible, carga cognitiva razonable
- **2 (Insuficiente)**: Desafíos significativos, carga cognitiva alta
- **1 (No funcional)**: Inaccesible, carga excesiva, requiere simplificación radical

---

## Using This Rubric

### Before Rating

1. Read all dimension definitions
2. Participate in a calibration session if available
3. Clarify any questions with the research team

### During Rating

1. View pictogram at standard size
2. Rate each dimension independently
3. Be consistent across all pictograms

### After Rating

1. Review for consistency
2. Identify patterns in your ratings
3. Discuss discrepancies with team (if applicable)

---

## References

See [foundations.md](foundations.md) for the full, verified reference list and the role each source plays.

- Fuller, D. R., & Lloyd, L. L. (1991). Toward a common usage of iconicity terminology. *Augmentative and Alternative Communication*, 7(3), 215–220. https://doi.org/10.1080/07434619112331275913
- Light, J., & McNaughton, D. (2014). Communicative competence for individuals who require augmentative and alternative communication: A new definition for a new era of communication? *Augmentative and Alternative Communication*, 30(1), 1–18. https://doi.org/10.3109/07434618.2014.885080
- ISO 9186-1. Graphical symbols — Test methods — Part 1: Method for testing comprehensibility.

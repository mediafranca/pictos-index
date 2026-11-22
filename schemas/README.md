# Schemas PICTOS Index

Este directorio contiene definiciones JSON Schema para validar estructuras de datos en el framework PICTOS Index.

## Schema Disponible

### Rubric Descriptions Schema

**Archivo:** [rubric-descriptions.schema.json](rubric-descriptions.schema.json)

Define la estructura para las descripciones de la rúbrica PICTOS Index, incluyendo:

* Escala general (niveles 1-5)
* 6 dimensiones de evaluación (Claridad, Reconocibilidad, Transparencia Semántica, Adecuación Pragmática, Adecuación Cultural, Accesibilidad Cognitiva)
* Descripciones bilingües (español/inglés) para cada nivel
* Texto compilable para evaluaciones narrativas

## Uso

### Validar con Node.js

```javascript
const Ajv = require('ajv');
const ajv = new Ajv();

const rubricSchema = require('./schemas/rubric-descriptions.schema.json');
const validate = ajv.compile(rubricSchema);

const rubricData = require('./data/rubric-scale-descriptions.json');
const valid = validate(rubricData);

if (!valid) {
  console.log(validate.errors);
}
```

### Validar con Command Line

Usando `ajv-cli`:

```bash
npm install -g ajv-cli
ajv validate -s schemas/rubric-descriptions.schema.json -d data/rubric-scale-descriptions.json
```

## Dimensiones de Evaluación PICTOS Index

| Dimensión | Descripción |
|-----------|-------------|
| **Claridad** | Nitidez visual, legibilidad y ausencia de ambigüedad visual |
| **Reconocibilidad** | Facilidad de identificación sin contexto adicional |
| **Transparencia Semántica** | Precisión en transmitir el significado de la frase objetivo |
| **Adecuación Pragmática** | Utilidad en contextos reales de comunicación AAC |
| **Adecuación Cultural** | Relevancia para contexto cultural y lingüístico hispanohablante |
| **Accesibilidad Cognitiva** | Usabilidad para usuarios con diferencias cognitivas |

Cada dimensión se evalúa en escala 1-5:

* **5 - Excelente:** cualidad plenamente presente
* **4 - Bien:** presente, con problemas menores
* **3 - Funciona:** presente de forma parcial
* **2 - Insuficiente:** presente sólo de forma limitada
* **1 - No funcional:** ausente o gravemente comprometida

## Versionado

Los schemas siguen versionado semántico. Cambios mayores incrementan la versión principal y requieren actualizar el campo `$id`.

---

**Ver también:** [data/rubric-scale-descriptions.json](../data/rubric-scale-descriptions.json) - Datos de rúbrica validados por este schema

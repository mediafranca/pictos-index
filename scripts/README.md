# Scripts

Utilidades de línea de comandos. Requieren Node.js 24.2 o posterior y no tienen dependencias. Ver también [docs/desarrollo.md](../docs/desarrollo.md).

## En uso

| Script | Para qué |
|---|---|
| `dev-server.mjs` | Servidor local (`npm run dev`, en http://localhost:4191) |
| `validate-i18n.mjs` | Comprueba que ambos catálogos tengan las mismas claves, que el código no use claves ausentes y que las negritas de la rúbrica existan en su texto (`npm run validate-i18n`) |
| `aggregate-protocol.mjs` | Reúne las evaluaciones de un panel en un informe agregado |
| `coding-sheets.mjs` | Prepara una planilla por juez y reúne las planillas codificadas |
| `*.test.mjs` | Pruebas (`npm test`): alfa de Krippendorff contra el ejemplo publicado, agregado, planillas y versión |

```bash
node scripts/aggregate-protocol.mjs libreria.json evaluaciones/
node scripts/coding-sheets.mjs sheets agregado.json planillas/ --judges 2
node scripts/coding-sheets.mjs merge agregado.json planillas/juez-1.csv planillas/juez-2.csv
```

La pantalla de coordinación (`?coordinar`) hace lo mismo sin línea de comandos; ver la [guía del protocolo](../docs/protocolo.md).

## Históricos

`compile-evaluation-text.js` y `generate-report.js` son anteriores a la versión 4: generan texto narrativo y reportes a partir de puntajes de la evaluación individual con el formato antiguo. No forman parte del flujo actual.

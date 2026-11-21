/**
 * ICAP v2 — Errores de dominio
 *
 * Errores tipados para violaciones de precondición del Allium.
 * Usado por todas las reglas en src/rules/*.ts.
 *
 * El nombre del error identifica qué invariante se violó, no qué función
 * lo detectó, de modo que el log sea legible sin contexto de pila.
 */

export class PreconditionError extends Error {
  constructor(
    public readonly rule: string,
    public readonly condition: string,
  ) {
    super(`[${rule}] precondición falló: ${condition}`)
    this.name = 'PreconditionError'
  }
}

export class InvariantError extends Error {
  constructor(
    public readonly invariant: string,
    public readonly detail: string,
  ) {
    super(`[${invariant}] violación: ${detail}`)
    this.name = 'InvariantError'
  }
}

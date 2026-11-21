/**
 * ICAP v2 — Tests de Capa A (geometría) sobre corpus sintético
 *
 * Verifica que las métricas A2 (unidades desligadas) y A3 (huecos topológicos)
 * sean deterministas para figuras conocidas. A1 y A4 son aproximaciones
 * continuas que solo se verifican en rango razonable.
 */

import { describe, it, expect } from 'vitest'
import { computeGeometryFromPixels } from '../geometry-algo.ts'
import {
  makeGrid,
  makeCircleFilled,
  makeRingHollow,
  makeOval,
  makeSquare,
  makeTriangle,
  syntheticCorpus,
} from '../../corpus/synthetic.ts'

// ─────────────────────────────────────────────
// A2 + A3 — deterministas por diseño
// ─────────────────────────────────────────────

describe('corpus sintético: A2 y A3 deterministas', () => {
  for (const { name, img, expectedUnits, expectedHoles } of syntheticCorpus()) {
    it(name, () => {
      const g = computeGeometryFromPixels(img)
      expect(g, `${name}: resultado null`).not.toBeNull()
      expect(g!.unlinked_units).toBe(expectedUnits)
      expect(g!.closed_regions).toBe(expectedHoles)
    })
  }
})

// ─────────────────────────────────────────────
// Grilla 5×5 — huecos y conectividad
// ─────────────────────────────────────────────

describe('grilla 5×5 trazo grueso', () => {
  const grid = makeGrid(5, 20, 3)
  let g: ReturnType<typeof computeGeometryFromPixels>

  it('no devuelve null', () => {
    g = computeGeometryFromPixels(grid)
    expect(g).not.toBeNull()
  })

  it('A2: la grilla es una sola componente conexa', () => {
    g = computeGeometryFromPixels(grid)
    expect(g!.unlinked_units).toBe(1)
  })

  it('A3: 25 huecos (una celda cerrada por cuadrícula)', () => {
    g = computeGeometryFromPixels(grid)
    expect(g!.closed_regions).toBe(25)
  })

  it('A1: stroke_pct > 0', () => {
    g = computeGeometryFromPixels(grid)
    expect(g!.stroke_pct).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────
// A1 — rangos razonables
// ─────────────────────────────────────────────

describe('A1 stroke_pct en rango razonable', () => {
  it('círculo relleno: stroke_pct alto (figura maciza)', () => {
    const g = computeGeometryFromPixels(makeCircleFilled(60))
    // Radio hidráulico de un disco es radio/2; sobre diámetro → ~25%
    expect(g!.stroke_pct).toBeGreaterThan(10)
  })

  it('anillo hueco: stroke_pct menor que círculo relleno', () => {
    const filled = computeGeometryFromPixels(makeCircleFilled(60))!
    const ring   = computeGeometryFromPixels(makeRingHollow(60, 6))!
    expect(ring.stroke_pct).toBeLessThan(filled.stroke_pct)
  })
})

// ─────────────────────────────────────────────
// A4 — contorno inferido
// ─────────────────────────────────────────────

describe('A4 inferred_contour_pct', () => {
  it('cuadrado: inferred_contour_pct ≥ 0', () => {
    const g = computeGeometryFromPixels(makeSquare(60, 40))
    expect(g!.inferred_contour_pct).toBeGreaterThanOrEqual(0)
  })

  it('triángulo arriba: inferred_contour_pct ≥ 0', () => {
    const g = computeGeometryFromPixels(makeTriangle(60, 'up'))
    expect(g!.inferred_contour_pct).toBeGreaterThanOrEqual(0)
  })

  it('óvalo: inferred_contour_pct cercano a 0 (convex ≈ perímetro)', () => {
    const g = computeGeometryFromPixels(makeOval(80, 50))
    // Una elipse es casi convexa; la diferencia hull/perimeter debería ser pequeña
    expect(g!.inferred_contour_pct).toBeLessThan(20)
  })
})

// ─────────────────────────────────────────────
// Casos extremos
// ─────────────────────────────────────────────

describe('casos extremos', () => {
  it('imagen vacía → null', () => {
    const empty = { data: new Uint8Array(100), width: 10, height: 10 }
    expect(computeGeometryFromPixels(empty)).toBeNull()
  })

  it('píxel único → unlinked_units=1, closed_regions=0', () => {
    const one = { data: new Uint8Array(9), width: 3, height: 3 }
    one.data[4] = 1  // centro
    const g = computeGeometryFromPixels(one)
    expect(g!.unlinked_units).toBe(1)
    expect(g!.closed_regions).toBe(0)
  })

  it('dos píxeles separados → unlinked_units=2', () => {
    const two = { data: new Uint8Array(25), width: 5, height: 5 }
    two.data[0]  = 1  // esquina superior izquierda
    two.data[24] = 1  // esquina inferior derecha
    const g = computeGeometryFromPixels(two)
    expect(g!.unlinked_units).toBe(2)
  })
})

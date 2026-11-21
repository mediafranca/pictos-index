/**
 * ICAP v2 — Corpus sintético para tests de geometría (Fase 3)
 *
 * Genera BinaryImage programáticamente, sin archivos externos.
 * Las imágenes están diseñadas para producir métricas de Capa A predecibles.
 */

import type { BinaryImage } from '../services/geometry-algo.ts'

// ─────────────────────────────────────────────
// Primitivos de dibujo sobre BinaryImage
// ─────────────────────────────────────────────

function blank(w: number, h: number): BinaryImage {
  return { data: new Uint8Array(w * h), width: w, height: h }
}

function set(img: BinaryImage, x: number, y: number): void {
  if (x >= 0 && x < img.width && y >= 0 && y < img.height)
    img.data[y * img.width + x] = 1
}

function hline(img: BinaryImage, y: number, x0: number, x1: number, thick: number): void {
  for (let dy = 0; dy < thick; dy++)
    for (let x = x0; x <= x1; x++) set(img, x, y + dy)
}

function vline(img: BinaryImage, x: number, y0: number, y1: number, thick: number): void {
  for (let dx = 0; dx < thick; dx++)
    for (let y = y0; y <= y1; y++) set(img, x + dx, y)
}

// ─────────────────────────────────────────────
// Grilla 5×5 con trazo grueso
// ─────────────────────────────────────────────

/**
 * Grilla de cells×cells celdas, trazo de strokeWidth px.
 * Tamaño de imagen: cells * cellSize + 1.
 *
 * A2 esperado: 1 (la grilla es conexa con 8-conectividad en las esquinas)
 * A3 esperado: cells² huecos (cada celda interior rellena)
 */
export function makeGrid(cells = 5, cellSize = 20, strokeWidth = 3): BinaryImage {
  const dim = cells * cellSize + strokeWidth
  const img = blank(dim, dim)

  for (let i = 0; i <= cells; i++) {
    const pos = i * cellSize
    hline(img, pos, 0, dim - 1, strokeWidth)
    vline(img, pos, 0, dim - 1, strokeWidth)
  }

  return img
}

// ─────────────────────────────────────────────
// Formas geométricas individuales
// ─────────────────────────────────────────────

/**
 * Círculo relleno de radio r centrado en la imagen.
 * A3 esperado: 0 (sin huecos)
 */
export function makeCircleFilled(size = 60): BinaryImage {
  const img = blank(size, size)
  const cx = (size - 1) / 2, cy = (size - 1) / 2
  const r = (size / 2) - 1
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(img, x, y)
  return img
}

/**
 * Anillo hueco: círculo exterior relleno menos círculo interior.
 * A3 esperado: 1 (hueco central)
 */
export function makeRingHollow(size = 60, strokeWidth = 6): BinaryImage {
  const img = blank(size, size)
  const cx = (size - 1) / 2, cy = (size - 1) / 2
  const outerR = (size / 2) - 1
  const innerR = outerR - strokeWidth
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2
      if (d2 <= outerR * outerR && d2 > innerR * innerR) set(img, x, y)
    }
  return img
}

/**
 * Óvalo relleno (elipse con semiejes a y b).
 * A3 esperado: 0
 */
export function makeOval(w = 80, h = 50): BinaryImage {
  const img = blank(w, h)
  const cx = (w - 1) / 2, cy = (h - 1) / 2
  const a = cx - 1, b = cy - 1
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if ((x - cx) ** 2 / (a * a) + (y - cy) ** 2 / (b * b) <= 1) set(img, x, y)
  return img
}

/**
 * Cuadrado relleno de lado side centrado en la imagen.
 * A3 esperado: 0
 */
export function makeSquare(size = 60, side = 40): BinaryImage {
  const img = blank(size, size)
  const x0 = Math.floor((size - side) / 2)
  const y0 = Math.floor((size - side) / 2)
  for (let y = y0; y < y0 + side; y++)
    for (let x = x0; x < x0 + side; x++) set(img, x, y)
  return img
}

/**
 * Triángulo relleno apuntando en la dirección dada.
 *   'up'    — punta arriba
 *   'down'  — punta abajo
 *   'left'  — punta izquierda
 *   'right' — punta derecha
 * A3 esperado: 0
 */
export function makeTriangle(size = 60, dir: 'up' | 'down' | 'left' | 'right' = 'up'): BinaryImage {
  const img = blank(size, size)
  const s = size - 1

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = false
      switch (dir) {
        case 'up':
          // Punta en (s/2, 0), base en y=s
          inside = y >= 0 && x >= Math.round(s / 2 - y / 2) && x <= Math.round(s / 2 + y / 2)
          break
        case 'down':
          // Punta en (s/2, s), base en y=0
          inside = y <= s && x >= Math.round((s - y) / 2) && x <= Math.round(s - (s - y) / 2)
          break
        case 'left':
          // Punta en (0, s/2), base en x=s
          inside = x >= 0 && y >= Math.round(s / 2 - x / 2) && y <= Math.round(s / 2 + x / 2)
          break
        case 'right':
          // Punta en (s, s/2), base en x=0
          inside = x <= s && y >= Math.round((s - x) / 2) && y <= Math.round(s - (s - x) / 2)
          break
      }
      if (inside) set(img, x, y)
    }
  }
  return img
}

// ─────────────────────────────────────────────
// Colección de figuras para tests
// ─────────────────────────────────────────────

export interface ShapeEntry {
  name: string
  img: BinaryImage
  /** A2: componentes conexas esperadas */
  expectedUnits: number
  /** A3: huecos esperados */
  expectedHoles: number
}

export function syntheticCorpus(): ShapeEntry[] {
  return [
    { name: 'círculo relleno',      img: makeCircleFilled(60),       expectedUnits: 1, expectedHoles: 0 },
    { name: 'anillo hueco',         img: makeRingHollow(60, 6),      expectedUnits: 1, expectedHoles: 1 },
    { name: 'óvalo',                img: makeOval(80, 50),           expectedUnits: 1, expectedHoles: 0 },
    { name: 'cuadrado',             img: makeSquare(60, 40),         expectedUnits: 1, expectedHoles: 0 },
    { name: 'triángulo arriba',     img: makeTriangle(60, 'up'),     expectedUnits: 1, expectedHoles: 0 },
    { name: 'triángulo abajo',      img: makeTriangle(60, 'down'),   expectedUnits: 1, expectedHoles: 0 },
    { name: 'triángulo izquierda',  img: makeTriangle(60, 'left'),   expectedUnits: 1, expectedHoles: 0 },
    { name: 'triángulo derecha',    img: makeTriangle(60, 'right'),  expectedUnits: 1, expectedHoles: 0 },
  ]
}

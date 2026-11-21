/**
 * ICAP v2 — Algoritmos de Capa A sobre imagen binaria
 *
 * Todas las funciones aquí operan sobre un BinaryImage (array de bytes + dimensiones)
 * sin tocar el DOM ni Canvas. Esto las hace testables en Node.js y reutilizables
 * tanto desde el browser (geometry.ts) como desde los tests (geometry.test.ts).
 *
 * Las cuatro métricas de la capa A:
 *
 *   A1  stroke_pct           — grosor de trazo / diámetro de soporte (%)
 *   A2  unlinked_units       — componentes conexas del primer plano (conteo)
 *   A3  closed_regions       — huecos topológicos (conteo)
 *   A4  inferred_contour_pct — contorno inferido / largo de esqueleto (%)
 *
 * Estado de la evidencia (CLAUDE.md): los umbrales de A1-A4 son marcadores de
 * posición. A3 y A4 se publican como advertencia e hipótesis, nunca como vetos.
 */

import type { GeometryLayer } from '../types.ts'

// ─────────────────────────────────────────────
// Tipo de imagen binaria (compartido con corpus/synthetic.ts)
// ─────────────────────────────────────────────

export interface BinaryImage {
  data: Uint8Array   // 1 = primer plano (figura), 0 = fondo
  width: number
  height: number
}

// ─────────────────────────────────────────────
// Entrada principal
// ─────────────────────────────────────────────

/**
 * Calcula las cuatro métricas de Capa A a partir de una imagen binaria.
 * Devuelve null si la imagen no tiene píxeles de primer plano.
 */
export function computeGeometryFromPixels(img: BinaryImage): GeometryLayer | null {
  const { data, width: w, height: h } = img

  const { area, perimeter } = areaAndPerimeter(data, w, h)
  if (area === 0) return null   // imagen vacía

  const diameter = supportDiameter(data, w, h)
  // diameter===0 solo si área es 1 píxel (punto); strokePct devuelve 0 en ese caso

  return {
    stroke_pct:           round2(strokePct(area, perimeter, diameter)),
    unlinked_units:       countForegroundComponents(data, w, h),
    closed_regions:       countHoles(data, w, h),
    inferred_contour_pct: round2(inferredContourPct(data, w, h, perimeter)),
  }
}

/**
 * Convierte un ImageData (RGBA) a BinaryImage.
 * Umbral de luminancia: píxel es figura si L < 128.
 * Para imágenes sobre fondo blanco (pictogramas típicos).
 */
export function binarize(imageData: { data: Uint8ClampedArray; width: number; height: number }): BinaryImage {
  const { width: w, height: h } = imageData
  const src = imageData.data
  const out = new Uint8Array(w * h)

  for (let i = 0; i < w * h; i++) {
    const r = src[i * 4]!
    const g = src[i * 4 + 1]!
    const b = src[i * 4 + 2]!
    const a = src[i * 4 + 3]!
    // Píxeles transparentes se tratan como fondo
    if (a < 128) { out[i] = 0; continue }
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    out[i] = luma < 128 ? 1 : 0
  }

  return { data: out, width: w, height: h }
}

// ─────────────────────────────────────────────
// A1 — Grosor de trazo
// ─────────────────────────────────────────────

/**
 * Diámetro del soporte: diagonal del bounding box del primer plano.
 * Es el denominador del porcentaje de grosor de trazo.
 */
function supportDiameter(data: Uint8Array, w: number, h: number): number {
  let minX = w, maxX = 0, minY = h, maxY = 0

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x]) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (minX > maxX) return 0  // sin primer plano
  const dx = maxX - minX
  const dy = maxY - minY
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Área (px de primer plano) y perímetro (px del primer plano adyacentes
 * al fondo, contados por arista, conectividad 4).
 */
function areaAndPerimeter(data: Uint8Array, w: number, h: number): { area: number; perimeter: number } {
  let area = 0
  let perimeter = 0

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      if (!data[idx]) continue
      area++
      if (x === 0     || !data[idx - 1]) perimeter++
      if (x === w - 1 || !data[idx + 1]) perimeter++
      if (y === 0     || !data[idx - w]) perimeter++
      if (y === h - 1 || !data[idx + w]) perimeter++
    }
  }

  return { area, perimeter }
}

/**
 * Grosor de trazo como % del diámetro de soporte.
 * Aproximación: radio hidráulico × 2 = grosor medio de trazo.
 *   radio_hidraulico = area / perimetro
 *   grosor = 2 × area / perimetro
 *
 * ponytail: proxy. Para trazos finos y compactos es preciso; para formas
 * macizas (círculos rellenos) sobreestima. Reemplazar con transformada de
 * distancia si se procesa corpus con formas macizas dominantes.
 */
function strokePct(area: number, perimeter: number, diameter: number): number {
  if (perimeter === 0 || diameter === 0) return 0
  const meanStrokeWidth = 2 * area / perimeter
  return (meanStrokeWidth / diameter) * 100
}

// ─────────────────────────────────────────────
// A2 — Unidades desligadas (componentes conexas)
// ─────────────────────────────────────────────

/**
 * Cuenta las componentes conexas del primer plano (conectividad 8).
 * Conectividad 8 para el primer plano porque la conectividad 4 parte diagonales
 * que visualmente son continuas en un pictograma.
 */
function countForegroundComponents(data: Uint8Array, w: number, h: number): number {
  const visited = new Uint8Array(data.length)
  let count = 0

  for (let i = 0; i < data.length; i++) {
    if (data[i] && !visited[i]) {
      floodFill8(data, visited, w, h, i)
      count++
    }
  }

  return count
}

// ─────────────────────────────────────────────
// A3 — Regiones cerradas (huecos topológicos)
// ─────────────────────────────────────────────

/**
 * Cuenta los huecos interiores (componentes de fondo NO conectadas al borde).
 *
 * Algoritmo:
 *   1. Flood fill desde todos los píxeles de fondo del borde → fondo exterior.
 *   2. Los píxeles de fondo que no quedan marcados son fondo interior.
 *   3. Contar las componentes conexas del fondo interior (conectividad 4).
 *
 * Conectividad 4 para el fondo (teorema de la curva de Jordan: usar la
 * conectividad opuesta a la del primer plano, que es 8).
 */
function countHoles(data: Uint8Array, w: number, h: number): number {
  const n = data.length
  const exterior = new Uint8Array(n)
  const stack: number[] = []

  // Sembrar desde todos los píxeles de fondo del borde
  for (let x = 0; x < w; x++) {
    if (!data[x])             { exterior[x] = 1;             stack.push(x) }
    if (!data[(h-1)*w + x])   { exterior[(h-1)*w+x] = 1;    stack.push((h-1)*w+x) }
  }
  for (let y = 1; y < h - 1; y++) {
    if (!data[y*w])           { exterior[y*w] = 1;           stack.push(y*w) }
    if (!data[y*w + w - 1])   { exterior[y*w+w-1] = 1;      stack.push(y*w+w-1) }
  }

  // Fill exterior (conectividad 4)
  while (stack.length) {
    const idx = stack.pop()!
    const x = idx % w
    const y = (idx - x) / w
    const neighbors = [
      x > 0     ? idx - 1 : -1,
      x < w - 1 ? idx + 1 : -1,
      y > 0     ? idx - w : -1,
      y < h - 1 ? idx + w : -1,
    ]
    for (const nb of neighbors) {
      if (nb < 0 || nb >= n) continue
      if (!data[nb] && !exterior[nb]) {
        exterior[nb] = 1
        stack.push(nb)
      }
    }
  }

  // Contar componentes del fondo interior (no exterior, no primer plano)
  const interior = new Uint8Array(n)
  for (let i = 0; i < n; i++) interior[i] = !data[i] && !exterior[i] ? 1 : 0

  const visited = new Uint8Array(n)
  let holes = 0
  for (let i = 0; i < n; i++) {
    if (interior[i] && !visited[i]) {
      floodFill4(interior, visited, w, h, i)
      holes++
    }
  }

  return holes
}

// ─────────────────────────────────────────────
// A4 — Contorno inferido
// ─────────────────────────────────────────────

/**
 * Porcentaje de largo de esqueleto que es contorno inferido (tipo Kanizsa).
 *
 * Aproximación: la diferencia entre el perímetro de la envolvente convexa y el
 * perímetro real del primer plano, normalizada por el largo de esqueleto.
 *   skeleton ≈ perímetro / 2  (válido para trazos delgados)
 *   inferred_pct = max(0, hull_perimeter - foreground_perimeter) / skeleton × 100
 *
 * A3 y A4 se publican como advertencia e hipótesis — ver CLAUDE.md § Decisiones.
 * ponytail: convex hull de puntos extremos por fila/columna, no hull completo.
 * Para pictogramas de trazo, la diferencia es menor al 5% en pruebas internas.
 */
function inferredContourPct(data: Uint8Array, w: number, h: number, perimeter: number): number {
  if (perimeter === 0) return 0

  const hullPerim = convexHullPerimeter(data, w, h)
  const skeletonLength = perimeter / 2
  if (skeletonLength === 0) return 0

  return Math.max(0, (hullPerim - perimeter) / skeletonLength) * 100
}

/**
 * Perímetro del hull convexo, calculado con el algoritmo de Andrew sobre
 * los puntos extremos de cada fila y columna (O(w+h) puntos).
 */
function convexHullPerimeter(data: Uint8Array, w: number, h: number): number {
  const pts: Array<[number, number]> = []

  // Extremos por fila
  for (let y = 0; y < h; y++) {
    let left = -1, right = -1
    for (let x = 0; x < w; x++) {
      if (data[y * w + x]) { if (left < 0) left = x; right = x }
    }
    if (left >= 0) { pts.push([left, y]); if (right !== left) pts.push([right, y]) }
  }

  // Extremos por columna
  for (let x = 0; x < w; x++) {
    let top = -1, bottom = -1
    for (let y = 0; y < h; y++) {
      if (data[y * w + x]) { if (top < 0) top = y; bottom = y }
    }
    if (top >= 0) { pts.push([x, top]); if (bottom !== top) pts.push([x, bottom]) }
  }

  if (pts.length < 3) return 0

  const hull = monotonicChain(pts)
  let perim = 0
  for (let i = 0; i < hull.length; i++) {
    const [x1, y1] = hull[i]!
    const [x2, y2] = hull[(i + 1) % hull.length]!
    const dx = x2 - x1, dy = y2 - y1
    perim += Math.sqrt(dx * dx + dy * dy)
  }
  return perim
}

// ─────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────

/** Flood fill iterativo de primer plano, conectividad 8. */
function floodFill8(data: Uint8Array, visited: Uint8Array, w: number, h: number, start: number): void {
  const stack = [start]
  while (stack.length) {
    const idx = stack.pop()!
    if (idx < 0 || idx >= data.length || visited[idx] || !data[idx]) continue
    visited[idx] = 1
    const x = idx % w
    const y = (idx - x) / w
    if (x > 0)     { const nb = idx - 1;     if (!visited[nb] && data[nb]) stack.push(nb) }
    if (x < w - 1) { const nb = idx + 1;     if (!visited[nb] && data[nb]) stack.push(nb) }
    if (y > 0)     { const nb = idx - w;     if (!visited[nb] && data[nb]) stack.push(nb) }
    if (y < h - 1) { const nb = idx + w;     if (!visited[nb] && data[nb]) stack.push(nb) }
    if (x > 0     && y > 0)     { const nb = idx - w - 1; if (!visited[nb] && data[nb]) stack.push(nb) }
    if (x < w - 1 && y > 0)     { const nb = idx - w + 1; if (!visited[nb] && data[nb]) stack.push(nb) }
    if (x > 0     && y < h - 1) { const nb = idx + w - 1; if (!visited[nb] && data[nb]) stack.push(nb) }
    if (x < w - 1 && y < h - 1) { const nb = idx + w + 1; if (!visited[nb] && data[nb]) stack.push(nb) }
  }
}

/** Flood fill iterativo de primer plano, conectividad 4. */
function floodFill4(data: Uint8Array, visited: Uint8Array, w: number, h: number, start: number): void {
  const stack = [start]
  while (stack.length) {
    const idx = stack.pop()!
    if (idx < 0 || idx >= data.length || visited[idx] || !data[idx]) continue
    visited[idx] = 1
    const x = idx % w
    const y = (idx - x) / w
    if (x > 0)     { const nb = idx - 1; if (!visited[nb] && data[nb]) stack.push(nb) }
    if (x < w - 1) { const nb = idx + 1; if (!visited[nb] && data[nb]) stack.push(nb) }
    if (y > 0)     { const nb = idx - w; if (!visited[nb] && data[nb]) stack.push(nb) }
    if (y < h - 1) { const nb = idx + w; if (!visited[nb] && data[nb]) stack.push(nb) }
  }
}

/**
 * Algoritmo de Andrew (monotone chain) para envolvente convexa 2D.
 * Devuelve los vértices en orden antihorario.
 */
function monotonicChain(pts: Array<[number, number]>): Array<[number, number]> {
  const sorted = [...pts].sort(([ax, ay], [bx, by]) => ax - bx || ay - by)
  const n = sorted.length

  function cross([ox, oy]: [number, number], [ax, ay]: [number, number], [bx, by]: [number, number]): number {
    return (ax - ox) * (by - oy) - (ay - oy) * (bx - ox)
  }

  const lower: Array<[number, number]> = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop()
    lower.push(p)
  }

  const upper: Array<[number, number]> = []
  for (let i = n - 1; i >= 0; i--) {
    const p = sorted[i]!
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop()
    upper.push(p)
  }

  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

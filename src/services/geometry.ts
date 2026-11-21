/**
 * ICAP v2 — Servicio de Capa A (geometría) — entry point browser
 *
 * Carga la imagen desde imageRef usando fetch + Canvas (disponible en browser),
 * convierte a BinaryImage y delega en geometry-algo.ts (testeable en Node).
 *
 * ponytail: sin web worker. Si la imagen es grande y bloquea el hilo
 * principal, mover a Worker — pero para pictogramas (≤ 500×500 px) es
 * imperceptible.
 */

import type { GeometryLayer } from '../types.ts'
import { binarize, computeGeometryFromPixels } from './geometry-algo.ts'

/**
 * Calcula las cuatro métricas de Capa A para la imagen en image_ref.
 * Devuelve null si la imagen no puede cargarse o está vacía.
 *
 * Solo funciona en browser (requiere OffscreenCanvas o HTMLCanvasElement).
 */
export async function computeGeometry(imageRef: string): Promise<GeometryLayer | null> {
  try {
    const imageData = await loadImageData(imageRef)
    const bin = binarize(imageData)
    return computeGeometryFromPixels(bin)
  } catch {
    return null
  }
}

async function loadImageData(
  src: string,
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  // OffscreenCanvas disponible en workers y en navegadores modernos
  if (typeof OffscreenCanvas !== 'undefined') {
    return loadViaOffscreenCanvas(src)
  }
  // Fallback: HTMLCanvasElement (main thread)
  return loadViaHTMLCanvas(src)
}

async function loadViaOffscreenCanvas(
  src: string,
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  const resp = await fetch(src)
  const blob = await resp.blob()
  const bitmap = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height)
}

function loadViaHTMLCanvas(
  src: string,
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = reject
    img.src = src
  })
}

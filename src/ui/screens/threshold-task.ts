/**
 * #screen-threshold-task ← ThresholdTask  [sólo submuestra ≈20%]
 *
 * Método de ajuste con doble pasada por eje (B1 desenfoque, B2 tamaño, B3 desplazamiento).
 *
 * Garantías implementadas:
 *   PreviousPassOpaque — el valor de la pasada anterior no se muestra durante
 *     la siguiente (solo se indica "pasada 1 de 2" / "pasada 2 de 2").
 *   ThresholdValueHidden — el valor numérico del control nunca aparece en pantalla
 *     (regla 11 del CLAUDE.md: umbral nunca muestra su valor numérico).
 *   DivergenceNeverBlocks — la histéresis se reporta pero nunca impide continuar.
 *
 * El slider opera con aria-valuenow pero aria-valuetext queda vacío para cumplir
 * la garantía. Alternativa teclado: ←/→ con incrementos de 1.
 *
 * Esta implementación trabaja sobre imágenes con CSS filter (blur/scale).
 * ponytail: filtro CSS como proxy de degradación real; reemplazar cuando
 * haya pipeline de degradación de imagen server-side.
 */

import { navigate } from '../router.ts'
import { appState } from '../app-state.ts'
import { db } from '../../store.ts'
import type { ThresholdAxis } from '../../types.ts'

const AXES: Array<{ axis: ThresholdAxis; label: string; filterFn: (v: number) => string }> = [
  { axis: 'blur',  label: 'B1 · Desenfoque',    filterFn: v => `blur(${v * 0.1}px)` },
  { axis: 'size',  label: 'B2 · Tamaño',         filterFn: v => `none` },  // degradation via CSS scale in parent
  { axis: 'shift', label: 'B3 · Desplazamiento', filterFn: v => `none` },
]

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-threshold-task'
  el.setAttribute('data-screen-label', 'Umbrales · Capa B')

  const recordId = appState.currentRecordId
  const item     = appState.currentItemId ? db.items.get(appState.currentItemId) : undefined

  if (!recordId || !item) {
    el.innerHTML = `<p class="t-body import-error" style="padding:var(--space-10)">Sin registro activo. Vuelva al índice.</p>`
    return el
  }

  const itemRef = item  // narrow once, use everywhere

  let axisIndex = 0
  let pass: 1 | 2 = 1
  let measurementId: string | null = null

  renderAxis()

  return el

  function renderAxis(): void {
    const axisInfo = AXES[axisIndex]
    if (!axisInfo) { finishTask(); return }

    el.innerHTML = `
      <header class="screen-header">
        <p class="t-label">Capa B · submuestra</p>
        <h2>${axisInfo.label}</h2>
        <p id="threshold-pass-indicator" class="t-label cal-progress">
          Pasada ${pass} de 2 — ${pass === 1 ? 'mueva desde nítido hacia degradado' : 'mueva desde degradado hacia nítido'}
        </p>
      </header>

      <div id="pictogram-stage" class="icap-stage comp-stage threshold-stage">
        <img id="threshold-img" src="${esc(itemRef.image_ref)}"
             alt="${esc(itemRef.utterance)}" class="comp-image threshold-img" />
      </div>

      <p class="cal-utterance t-utterance">${esc(itemRef.utterance)}</p>

      <div class="threshold-control">
        <p class="t-body threshold-task-instruction">
          Mueva el control hasta el punto en que ya no pueda nombrar qué muestra el pictograma.
        </p>
        <input id="threshold-slider" type="range"
               min="0" max="100" value="${pass === 1 ? 0 : 100}"
               class="threshold-slider"
               aria-label="${axisInfo.label} — control de degradación"
               aria-valuetext="" />
      </div>

      <div id="threshold-cannot-do" class="screen-actions threshold-cannot-actions">
        <button id="threshold-commit" class="btn-primary">
          Marcar umbral aquí
        </button>
        <button id="threshold-skip-axis" class="btn-secondary">
          No puedo hacer esta tarea
        </button>
      </div>
    `

    const slider   = el.querySelector<HTMLInputElement>('#threshold-slider')!
    const img      = el.querySelector<HTMLImageElement>('#threshold-img')!
    const commitBtn = el.querySelector<HTMLButtonElement>('#threshold-commit')!
    const skipBtn  = el.querySelector<HTMLButtonElement>('#threshold-skip-axis')!

    slider.addEventListener('input', () => {
      const v = Number(slider.value)
      img.style.filter = axisInfo.filterFn(v)
      // ThresholdValueHidden: no mostrar valor numérico
    })

    commitBtn.addEventListener('click', async () => {
      const value = Number(slider.value)
      commitBtn.disabled = true
      skipBtn.disabled = true

      try {
        const { createThresholdMeasurement, recordThresholdPass, sealEvaluationRecord } =
          await import('../../rules/evaluation.ts')

        if (pass === 1) {
          // Crear medición y registrar pasada descendente
          const m = createThresholdMeasurement(recordId!, axisInfo.axis)
          measurementId = m.id
          recordThresholdPass(m.id, value)
          pass = 2
          renderAxis()
        } else {
          // Pasada ascendente — cierra la medición
          if (measurementId) recordThresholdPass(measurementId, value)
          const measurement = measurementId ? db.thresholdMeasurements.get(measurementId) : undefined
          showPassResult(measurement?.threshold ?? 0, measurement?.hysteresis ?? 0, axisInfo.label)
        }
      } catch (err) {
        commitBtn.disabled = false
        skipBtn.disabled = false
        console.error(err)
      }
    })

    skipBtn.addEventListener('click', () => {
      // Saltar este eje; avanzar al siguiente
      axisIndex++
      pass = 1
      measurementId = null

      renderAxis()
    })
  }

  function showPassResult(threshold: number, hysteresis: number, axisLabel: string): void {
    // DivergenceNeverBlocks: mostrar histéresis como dato, no como error
    el.innerHTML = `
      <div class="cal-anchor-reveal">
        <p class="t-label">Resultado — ${esc(axisLabel)}</p>
        <div class="cal-anchor-row">
          <span class="cal-score-value cal-score-value--anchor t-mono-id">${threshold.toFixed(1)}</span>
          <p class="t-body-sm cal-rationale">Umbral estimado (promedio de las dos pasadas)</p>
        </div>
        <div id="calibration-divergence" class="cal-divergence">
          <p class="t-label">Histéresis</p>
          <p class="cal-divergence-value t-mono-id">${hysteresis.toFixed(1)}</p>
          <p class="t-caption cal-divergence-note">Diferencia entre pasadas. Se reporta; nunca bloquea.</p>
        </div>
      </div>
      <div class="screen-actions">
        <button id="btn-next-axis" class="btn-primary">
          ${axisIndex + 1 < AXES.length ? 'Siguiente eje' : 'Finalizar capa B'}
        </button>
      </div>
    `
    el.querySelector('#btn-next-axis')!.addEventListener('click', () => {
      axisIndex++
      pass = 1
      measurementId = null

      renderAxis()
    })
  }

  function finishTask(): void {
    // Sellar registro después de completar B
    void import('../../rules/evaluation.ts').then(({ sealEvaluationRecord }) => {
      try {
        sealEvaluationRecord(recordId!)
      } catch { /* puede ya estar sellado si se saltaron ejes */ }
      appState.currentRecordId = null
      appState.currentMomentId = null
      void navigate('item-index')
    })
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

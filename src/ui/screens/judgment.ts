/**
 * #screen-judgment ← JudgmentEntry
 *
 * Juicio de las cuatro dimensiones de capa C: C1 semántica, C2 pragmática,
 * C3 cultural, C4 aprendibilidad.
 *
 * Garantías implementadas:
 *   NoForcedMidpoint — ninguna dimensión arranca con valor. El estado inicial
 *     es visiblemente distinto de cualquier estado elegido. No hay default.
 *   AbsenceEquivalence — los tres estados de ausencia tienen el mismo peso
 *     gráfico que la escala 1–5, en la misma fila.
 *   RubricTextStable — el texto de la dimensión (pregunta y etiquetas) no se
 *     modifica al seleccionar un valor. Solo cambia el estado visual del botón.
 *
 * "sin competencia" abre un campo de motivo obligatorio.
 * La rúbrica se muestra completa: pregunta + extremos de escala siempre visibles.
 */

import { navigate } from '../router.ts'
import { appState } from '../app-state.ts'
import { db } from '../../store.ts'
import type { DimensionId, ResponseState } from '../../types.ts'

type DimMeta = {
  id:       DimensionId
  label:    string
  question: string
  low:      string
  high:     string
}

const DIMS: DimMeta[] = [
  {
    id:       'c1_semantic',
    label:    'C1 · Semántica',
    question: '¿Cuántas personas al ver este pictograma producirían espontáneamente la misma palabra o frase?',
    low:      'Muy pocos',
    high:     'Casi todos',
  },
  {
    id:       'c2_pragmatic',
    label:    'C2 · Pragmática',
    question: '¿En qué medida este pictograma comunicaría la intención correcta en el contexto declarado?',
    low:      'No comunica la intención',
    high:     'Comunica perfectamente',
  },
  {
    id:       'c3_cultural',
    label:    'C3 · Cultural',
    question: '¿Qué tan reconocible es este pictograma para personas de la cultura y región declaradas?',
    low:      'Muy poco reconocible',
    high:     'Universalmente reconocible',
  },
  {
    id:       'c4_learnability',
    label:    'C4 · Aprendibilidad',
    question: '¿Qué tan fácil sería aprender y recordar el significado de este pictograma?',
    low:      'Muy difícil de aprender',
    high:     'Se aprende de inmediato',
  },
]

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-judgment'
  el.setAttribute('data-screen-label', 'Juicio · Capa C')

  const recordId = appState.currentRecordId
  const item     = appState.currentItemId ? db.items.get(appState.currentItemId) : undefined

  if (!recordId || !item) {
    el.innerHTML = `<p class="t-body import-error" style="padding:var(--space-10)">Sin registro activo. Vuelva al índice.</p>`
    return el
  }

  // Estado en memoria para esta sesión de pantalla
  const selected   = new Map<DimensionId, { state: ResponseState; score?: number }>()
  const reasons    = new Map<DimensionId, string>()

  el.innerHTML = `
    <header class="screen-header">
      <p class="t-label">Capa C · Interpretativa</p>
      <h2>${esc(item.utterance)}</h2>
      <div class="judgment-item-stage">
        <img src="${esc(item.image_ref)}" alt="${esc(item.utterance)}" class="judgment-thumb" />
      </div>
    </header>

    ${DIMS.map(dim => dimensionBlock(dim)).join('')}

    <div id="judgment-error" class="import-error" role="alert" hidden>
      <p class="t-body-sm"></p>
    </div>

    <div class="screen-actions">
      <button id="judgment-seal" class="btn-primary">
        ${appState.currentItemIsSubsample ? 'Continuar a capa B' : 'Sellar evaluación'}
      </button>
      <button id="judgment-back" class="btn-secondary">
        Volver al índice sin sellar
      </button>
    </div>
  `

  // Cablear botones de cada dimensión (SIN re-renderizar el bloque completo)
  DIMS.forEach(dim => {
    wireDimension(el, dim, selected, reasons)
  })

  const sealBtn  = el.querySelector<HTMLButtonElement>('#judgment-seal')!
  const errorEl  = el.querySelector<HTMLElement>('#judgment-error')!
  const errorMsg = errorEl.querySelector<HTMLElement>('.t-body-sm')!

  el.querySelector('#judgment-back')!.addEventListener('click', () => void navigate('item-index'))

  sealBtn.addEventListener('click', async () => {
    // Validar que las dimensiones "sin competencia" tienen motivo
    for (const dim of DIMS) {
      const s = selected.get(dim.id)
      if (s?.state === 'not_qualified' && !reasons.get(dim.id)?.trim()) {
        errorMsg.textContent = `"${dim.label}": el motivo de falta de competencia es obligatorio.`
        errorEl.hidden = false
        el.querySelector<HTMLElement>(`#field-absence-reason-${dim.id}`)?.focus()
        return
      }
    }
    errorEl.hidden = true
    sealBtn.disabled = true
    sealBtn.textContent = 'Guardando…'

    try {
      const { recordDimensionResponse, sealEvaluationRecord } = await import('../../rules/evaluation.ts')

      // Guardar solo las dimensiones con estado seleccionado
      for (const dim of DIMS) {
        const s = selected.get(dim.id)
        if (!s) continue  // no-respuesta = omitida implícita; no se envía
        const reason = reasons.get(dim.id)?.trim()
        recordDimensionResponse(recordId, dim.id, s.state, s.score, reason || undefined)
      }

      if (appState.currentItemIsSubsample) {
        void navigate('threshold-task')
      } else {
        sealEvaluationRecord(recordId)
        appState.currentRecordId = null
        appState.currentMomentId = null
        void navigate('item-index')
      }
    } catch (err) {
      sealBtn.disabled = false
      sealBtn.textContent = appState.currentItemIsSubsample ? 'Continuar a capa B' : 'Sellar evaluación'
      errorMsg.textContent = err instanceof Error ? err.message : 'Error al guardar.'
      errorEl.hidden = false
    }
  })

  return el
}

// ─────────────────────────────────────────────
// Render estático del bloque de dimensión
// ─────────────────────────────────────────────

function dimensionBlock(dim: DimMeta): string {
  return `
    <div class="judgment-dim" id="judgment-dim-${dim.id}" data-icap-dim="${dim.id}" data-icap-state="pendiente">

      <!-- Rúbrica — texto ESTÁTICO; nunca cambia al seleccionar un valor -->
      <div class="judgment-rubric">
        <p class="t-label judgment-dim-label">${esc(dim.label)}</p>
        <p class="t-body judgment-dim-question">${esc(dim.question)}</p>
      </div>

      <!-- Escala 1–5 + 3 celdas de ausencia — MISMO peso gráfico, misma fila -->
      <div class="judgment-row" role="group" aria-label="${esc(dim.label)}">
        <div id="judgment-scale-${dim.id}" class="judgment-scale">
          ${[1,2,3,4,5].map(v => `
            <button type="button"
                    class="cal-scale-btn judgment-score-btn"
                    data-dim="${dim.id}" data-score="${v}"
                    aria-label="${v}">${v}</button>
          `).join('')}
        </div>
        <div id="judgment-absence-${dim.id}" class="judgment-absence">
          <button type="button" class="judgment-absence-btn" data-dim="${dim.id}" data-absence="not_applicable"
                  aria-label="No aplicable" title="No aplicable">N/A</button>
          <button type="button" class="judgment-absence-btn" data-dim="${dim.id}" data-absence="not_qualified"
                  aria-label="Sin competencia para juzgar" title="Sin competencia para juzgar">S/C</button>
          <button type="button" class="judgment-absence-btn" data-dim="${dim.id}" data-absence="skipped"
                  aria-label="Omitir" title="Omitir">—</button>
        </div>
      </div>

      <!-- Extremos de escala — siempre visibles -->
      <div class="judgment-scale-extremes t-caption">
        <span>${esc(dim.low)}</span>
        <span>${esc(dim.high)}</span>
      </div>

      <!-- Campo de motivo — aparece SOLO si se elige "sin competencia" -->
      <div id="judgment-reason-${dim.id}" class="judgment-reason-block" hidden>
        <label class="t-label" for="field-absence-reason-${dim.id}">
          Motivo de falta de competencia <span aria-hidden="true">(obligatorio)</span>
        </label>
        <textarea id="field-absence-reason-${dim.id}"
                  class="field-text comp-textarea"
                  rows="2"
                  placeholder="Explique brevemente por qué no puede juzgar esta dimensión…"></textarea>
      </div>
    </div>
  `
}

// ─────────────────────────────────────────────
// Cablear interacciones SIN re-renderizar el texto de rúbrica
// ─────────────────────────────────────────────

function wireDimension(
  root: HTMLElement,
  dim: DimMeta,
  selected: Map<DimensionId, { state: ResponseState; score?: number }>,
  reasons: Map<DimensionId, string>,
): void {
  const dimEl      = root.querySelector<HTMLElement>(`#judgment-dim-${dim.id}`)!
  const reasonBlock = root.querySelector<HTMLElement>(`#judgment-reason-${dim.id}`)!
  const reasonTA    = root.querySelector<HTMLTextAreaElement>(`#field-absence-reason-${dim.id}`)!

  const scoreBtns   = dimEl.querySelectorAll<HTMLButtonElement>('.judgment-score-btn')
  const absenceBtns = dimEl.querySelectorAll<HTMLButtonElement>('.judgment-absence-btn')

  function clearAll(): void {
    scoreBtns.forEach(b => b.classList.remove('cal-scale-btn--selected'))
    absenceBtns.forEach(b => b.classList.remove('judgment-absence-btn--selected'))
    reasonBlock.hidden = true
    dimEl.setAttribute('data-icap-state', 'pendiente')
  }

  scoreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const score = Number(btn.dataset['score'])
      clearAll()
      btn.classList.add('cal-scale-btn--selected')
      selected.set(dim.id, { state: 'scored', score })
      dimEl.setAttribute('data-icap-state', 'registrada')
    })
  })

  absenceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const absence = btn.dataset['absence'] as ResponseState
      clearAll()
      btn.classList.add('judgment-absence-btn--selected')
      selected.set(dim.id, { state: absence })
      dimEl.setAttribute('data-icap-state', 'registrada')
      if (absence === 'not_qualified') {
        reasonBlock.hidden = false
        reasonTA.focus()
      }
    })
  })

  reasonTA.addEventListener('input', () => {
    reasons.set(dim.id, reasonTA.value)
  })
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

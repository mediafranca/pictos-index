/**
 * #screen-item-index
 *
 * Índice de ítems de la fuente activa. Muestra todos los pictogramas con su
 * estado de evaluación en la sesión actual. Es el eje del ciclo de tarea.
 *
 * Estados posibles (data-icap-state):
 *   - pendiente:     sin registro en esta sesión
 *   - en-progreso:   registro abierto (in_progress)
 *   - registrada:    registro sellado (sealed)
 *
 * Submuestra B: posición % 5 === 0 (≈20%). Se indica con badge "B".
 * Un ítem no-muestreado no tiene tarea B pero sí tarea C.
 */

import { navigate } from '../router.ts'
import { appState } from '../app-state.ts'
import { db } from '../../store.ts'
import type { EvaluationRecord } from '../../types.ts'

function isSubsample(index: number): boolean {
  return index % 5 === 0
}

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-item-index'
  el.setAttribute('data-screen-label', 'Índice de ítems')

  const sourceId = appState.sourceId
  if (!sourceId) {
    el.innerHTML = `<p class="t-body import-error" style="padding:var(--space-10)">Sin fuente importada. Vuelva al inicio.</p>`
    return el
  }

  const items = db.itemsBySource(sourceId)
  const sessionId = appState.sessionId

  const recordsByItem = new Map<string, EvaluationRecord>()
  if (sessionId) {
    for (const record of db.evaluationRecords.values()) {
      if (record.session_id === sessionId) recordsByItem.set(record.item_id, record)
    }
  }

  const sealedCount    = [...recordsByItem.values()].filter(r => r.status === 'sealed').length
  const subsampleCount = items.filter((_, i) => isSubsample(i)).length

  el.innerHTML = `
    <header class="screen-header">
      <h2>Índice de ítems</h2>
      <div id="index-progress-c" class="index-progress t-caption">
        <span>Evaluados: <span class="t-mono-id">${sealedCount} / ${items.length}</span></span>
        <span class="index-progress-sep">·</span>
        <span>Submuestra B: <span class="t-mono-id">${subsampleCount} ítems</span></span>
      </div>
    </header>

    <div class="index-diag-links">
      <button id="btn-to-aggregate" class="btn-secondary">Agregado</button>
      <button id="btn-to-family"    class="btn-secondary">Informe de familia</button>
    </div>

    <ul id="item-grid" class="item-grid" role="list">
      ${items.map((item, i) => {
        const record = recordsByItem.get(item.id)
        const state  = record?.status === 'sealed'      ? 'registrada'
                     : record?.status === 'in_progress' ? 'en-progreso'
                     : 'pendiente'
        const sub = isSubsample(i)
        return `
          <li id="item-${esc(item.stable_id)}"
              class="item-card item-card--${state}"
              data-icap-state="${state}"
              data-item-id="${esc(item.id)}"
              role="button" tabindex="0"
              aria-label="${esc(item.utterance)} — ${stateLabel(state)}">
            <div class="item-card-image">
              <img src="${esc(item.image_ref)}" alt="${esc(item.utterance)}"
                   class="item-thumb" loading="lazy" />
            </div>
            <p class="item-card-utterance t-body-sm">${esc(item.utterance)}</p>
            <div class="item-card-footer">
              <span class="item-state-chip t-caption item-state--${state}">${stateLabel(state)}</span>
              ${sub ? '<span class="item-subsample-badge t-caption" title="Submuestra capa B">B</span>' : ''}
            </div>
          </li>`
      }).join('')}
    </ul>
  `

  el.querySelector('#btn-to-aggregate')!.addEventListener('click', () => void navigate('aggregate'))
  el.querySelector('#btn-to-family')!.addEventListener('click', () => void navigate('family-report'))

  el.querySelectorAll<HTMLElement>('.item-card').forEach(card => {
    const activate = () => {
      const itemId = card.dataset['itemId']
      if (!itemId) return

      if (card.dataset['icapState'] === 'registrada') {
        appState.currentItemId = itemId
        void navigate('item-ficha')
        return
      }

      const idx = items.findIndex(it => it.id === itemId)
      appState.currentItemId          = itemId
      appState.currentItemIsSubsample = isSubsample(idx)

      // Retomar registro in_progress si existe
      const existing = [...db.evaluationRecords.values()]
        .find(r => r.item_id === itemId && r.session_id === (sessionId ?? '') && r.status === 'in_progress')

      if (existing) {
        appState.currentRecordId = existing.id
        const moment = [...db.comprehensionMoments.values()].find(m => m.record_id === existing.id)
        appState.currentMomentId = moment?.id ?? null
        void navigate(moment?.status === 'phrase_revealed' ? 'judgment' : 'spontaneous-comprehension')
        return
      }

      if (!sessionId) return
      void import('../../rules/evaluation.ts').then(({ openEvaluationRecord }) => {
        try {
          const { record, moment } = openEvaluationRecord(sessionId, itemId, { skipSourceCheck: true })
          appState.currentRecordId = record.id
          appState.currentMomentId = moment.id
          void navigate('spontaneous-comprehension')
        } catch (err) {
          console.error('No se pudo abrir el registro:', err)
        }
      })
    }

    card.addEventListener('click', activate)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() }
    })
  })

  return el
}

function stateLabel(s: string): string {
  return s === 'registrada' ? 'registrada' : s === 'en-progreso' ? 'en progreso' : 'pendiente'
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

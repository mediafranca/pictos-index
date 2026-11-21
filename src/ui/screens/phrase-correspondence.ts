/**
 * #screen-phrase-correspondence ← PhraseCorrespondence
 *
 * La frase objetivo ya está revelada en esta pantalla (legítima).
 * Esta pantalla es el punto de retoma cuando el evaluador vuelve después de
 * que el momento estuvo en 'spontaneous_closed': muestra la comparación y
 * permite registrar la correspondencia para avanzar al juicio.
 *
 * En el flujo normal, la correspondencia se registra desde el inline-reveal
 * de #screen-spontaneous-comprehension. Esta pantalla actúa de fallback.
 */

import { navigate } from '../router.ts'
import { appState } from '../app-state.ts'
import { db } from '../../store.ts'

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-phrase-correspondence'
  el.setAttribute('data-screen-label', 'Correspondencia')

  const itemId   = appState.currentItemId
  const momentId = appState.currentMomentId
  const item     = itemId ? db.items.get(itemId) : undefined
  const moment   = momentId ? db.comprehensionMoments.get(momentId) : undefined

  if (!item || !moment) {
    el.innerHTML = `<p class="t-body import-error" style="padding:var(--space-10)">Sin ítem activo. Vuelva al índice.</p>`
    return el
  }

  // Si ya está phrase_revealed, ir a juicio
  if (moment.status === 'phrase_revealed') {
    void navigate('judgment')
    return el
  }

  const given = moment.spontaneous_skipped ? '(omitida)' : (moment.spontaneous_response ?? '')

  el.innerHTML = `
    <header class="screen-header">
      <p class="t-label">Comprensión · correspondencia</p>
      <h2>Compare su respuesta con la frase objetivo</h2>
    </header>

    <div id="pictogram-stage" class="icap-stage comp-stage">
      <img src="${esc(item.image_ref)}" alt="${esc(item.utterance)}" class="comp-image" />
    </div>

    <div class="comp-reveal-block">
      <div class="comp-reveal-row">
        <p class="t-label">Su respuesta</p>
        <p class="t-body">${moment.spontaneous_skipped ? '<em>(omitida)</em>' : esc(given)}</p>
      </div>
      <div class="comp-reveal-row comp-reveal-target">
        <p class="t-label">Frase objetivo</p>
        <p id="target-phrase" class="t-utterance cal-utterance">${esc(item.utterance)}</p>
      </div>
    </div>

    <div id="widget-correspondence" class="comp-correspondence" role="group" aria-label="Correspondencia">
      <p class="t-label">Correspondencia</p>
      ${CORR_OPTIONS.map(([v, label]) => `
        <label class="comp-corr-option">
          <input type="radio" name="corr" value="${v}" class="radio-input" />
          <span class="comp-corr-label t-body-sm">${label}</span>
        </label>
      `).join('')}
    </div>

    <div id="corr-error" class="import-error" role="alert" hidden>
      <p class="t-body-sm">Seleccione un nivel de correspondencia.</p>
    </div>

    <div class="screen-actions">
      <button id="corr-continue" class="btn-primary">Continuar al juicio</button>
    </div>
  `

  const continueBtn = el.querySelector<HTMLButtonElement>('#corr-continue')!
  const errorEl     = el.querySelector<HTMLElement>('#corr-error')!

  continueBtn.addEventListener('click', async () => {
    const sel = el.querySelector<HTMLInputElement>('input[name="corr"]:checked')
    if (!sel) { errorEl.hidden = false; return }
    errorEl.hidden = true
    continueBtn.disabled = true

    try {
      const { revealTargetPhrase } = await import('../../rules/evaluation.ts')
      revealTargetPhrase(momentId!, Number(sel.value))
      void navigate('judgment')
    } catch (err) {
      continueBtn.disabled = false
      console.error(err)
    }
  })

  return el
}

const CORR_OPTIONS: [number, string][] = [
  [0, 'Sin correspondencia'],
  [1, 'Muy baja'],
  [2, 'Parcial'],
  [3, 'Alta'],
  [4, 'Exacta'],
]

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * #screen-spontaneous-comprehension ← SpontaneousComprehension
 *
 * Dos fases dentro de la misma pantalla, irreversibles:
 *
 *   scoring   — la frase objetivo NO está en el DOM (TargetPhraseHidden).
 *               El evaluador escribe lo que cree que muestra el pictograma.
 *               El campo de texto se RETIRA (no deshabilita) al sellar.
 *
 *   revealed  — la frase objetivo entra al DOM por primera vez.
 *               Se muestran ambas respuestas juntas y se evalúa la correspondencia.
 *               Navega a juicio de capa C.
 *
 * Garantías implementadas:
 *   TargetPhraseHidden   — el utterance no se incluye en el HTML de la fase scoring.
 *   NoSilentRewrite      — #field-spontaneous-answer se elimina del árbol al sellar.
 */

import { navigate } from '../router.ts'
import { appState } from '../app-state.ts'
import { db } from '../../store.ts'

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-spontaneous-comprehension'
  el.setAttribute('data-screen-label', 'Comprensión espontánea')

  const itemId   = appState.currentItemId
  const momentId = appState.currentMomentId
  const item     = itemId ? db.items.get(itemId) : undefined

  if (!item || !momentId) {
    el.innerHTML = `<p class="t-body import-error" style="padding:var(--space-10)">Sin ítem activo. Vuelva al índice.</p>`
    return el
  }

  const moment = db.comprehensionMoments.get(momentId)
  if (!moment) {
    el.innerHTML = `<p class="t-body import-error" style="padding:var(--space-10)">Momento de comprensión no encontrado.</p>`
    return el
  }

  // Si ya está en fase revealed (retomo), ir directo a juicio
  if (moment.status === 'phrase_revealed') {
    void navigate('judgment')
    return el
  }

  // Si ya está sellado (spontaneous_closed), mostrar fase revealed
  if (moment.status === 'spontaneous_closed') {
    renderRevealedPhase(el, item.utterance, moment.spontaneous_response ?? '', moment.spontaneous_skipped, momentId)
    return el
  }

  // ── Fase scoring ──────────────────────────────────────────────────────
  // GARANTÍA TargetPhraseHidden: item.utterance NO aparece en este HTML
  el.innerHTML = `
    <header class="screen-header">
      <p class="t-label">Comprensión espontánea · 1 de 2</p>
      <h2>¿Qué muestra este pictograma?</h2>
      <p class="t-body">Escriba lo primero que le venga a la mente. No hay respuesta incorrecta.</p>
    </header>

    <div id="pictogram-stage" class="icap-stage comp-stage" role="img" aria-label="Pictograma a evaluar">
      <img src="${esc(item.image_ref)}" alt="Pictograma" class="comp-image" />
    </div>

    <div id="block-deferred-phrase" class="icap-deferred cal-deferred-placeholder" aria-hidden="true">
      <p class="t-label cal-deferred-label">Frase objetivo</p>
      <p class="t-body-sm cal-deferred-note">Se revelará después de sellar su respuesta.</p>
    </div>

    <div id="comp-input-block" class="comp-input-block">
      <label class="t-label" for="field-spontaneous-answer">Su respuesta</label>
      <textarea id="field-spontaneous-answer" class="field-text comp-textarea"
        placeholder="Escriba aquí…" autocomplete="off" rows="3"></textarea>
    </div>

    <div id="comp-error" class="import-error" role="alert" hidden>
      <p class="t-body-sm"></p>
    </div>

    <div class="screen-actions">
      <button id="comprehension-seal" class="btn-primary" disabled>
        Sellar respuesta
      </button>
      <button id="comp-skip" class="btn-secondary">
        Omitir (sin respuesta)
      </button>
    </div>
    <p class="comp-seal-warning t-caption">Esta acción es irreversible. Después de sellar verá la frase objetivo.</p>
  `

  const textarea  = el.querySelector<HTMLTextAreaElement>('#field-spontaneous-answer')!
  const sealBtn   = el.querySelector<HTMLButtonElement>('#comprehension-seal')!
  const skipBtn   = el.querySelector<HTMLButtonElement>('#comp-skip')!
  const errorEl   = el.querySelector<HTMLElement>('#comp-error')!
  const errorMsg  = errorEl.querySelector<HTMLElement>('.t-body-sm')!

  textarea.addEventListener('input', () => {
    sealBtn.disabled = textarea.value.trim().length === 0
  })

  sealBtn.addEventListener('click', async () => {
    const response = textarea.value.trim()
    if (!response) return
    sealBtn.disabled = true
    skipBtn.disabled = true
    sealBtn.textContent = 'Sellando…'

    try {
      const { recordSpontaneousResponse } = await import('../../rules/evaluation.ts')
      const updated = recordSpontaneousResponse(momentId, { response, language: 'es' })
      // GARANTÍA NoSilentRewrite: retirar el bloque de entrada del DOM
      el.querySelector('#comp-input-block')?.remove()
      el.querySelector('.comp-seal-warning')?.remove()
      el.querySelector('.screen-actions')?.remove()
      renderRevealedPhase(el, item.utterance, updated.spontaneous_response ?? '', false, momentId)
    } catch (err) {
      sealBtn.disabled = false
      skipBtn.disabled = false
      sealBtn.textContent = 'Sellar respuesta'
      errorMsg.textContent = err instanceof Error ? err.message : 'Error al sellar.'
      errorEl.hidden = false
    }
  })

  skipBtn.addEventListener('click', async () => {
    skipBtn.disabled = true
    sealBtn.disabled = true
    skipBtn.textContent = 'Omitiendo…'

    try {
      const { skipSpontaneousResponse } = await import('../../rules/evaluation.ts')
      skipSpontaneousResponse(momentId)
      el.querySelector('#comp-input-block')?.remove()
      el.querySelector('.comp-seal-warning')?.remove()
      el.querySelector('.screen-actions')?.remove()
      renderRevealedPhase(el, item.utterance, '', true, momentId)
    } catch (err) {
      skipBtn.disabled = false
      sealBtn.disabled = false
      skipBtn.textContent = 'Omitir (sin respuesta)'
      errorMsg.textContent = err instanceof Error ? err.message : 'Error.'
      errorEl.hidden = false
    }
  })

  return el
}

// ─────────────────────────────────────────────
// Fase revealed: la frase objetivo entra al DOM
// ─────────────────────────────────────────────

function renderRevealedPhase(
  container: HTMLElement,
  utterance: string,
  givenResponse: string,
  wasSkipped: boolean,
  momentId: string,
): void {
  // Retirar el placeholder diferido si sigue en el DOM
  container.querySelector('#block-deferred-phrase')?.remove()
  container.querySelector('#comp-error')?.remove()

  // Actualizar encabezado si existe
  const header = container.querySelector('.screen-header')
  if (header) {
    header.querySelector('p.t-label')!.textContent = 'Comprensión espontánea · 2 de 2'
    header.querySelector('h2')!.textContent = 'Compare su respuesta con la frase objetivo'
    header.querySelector('p.t-body')!.textContent =
      'Indique qué tan bien coincidió su respuesta con la frase objetivo.'
  }

  // ── BLOQUE DIFERIDO: la frase entra al DOM aquí por primera vez ──
  const revealBlock = document.createElement('div')
  revealBlock.id = 'comprehension-reveal'
  revealBlock.className = 'icap-deferred comp-reveal-block'
  revealBlock.setAttribute('data-icap-state', 'registrada')

  revealBlock.innerHTML = `
    <div class="comp-reveal-row">
      <p class="t-label">Su respuesta</p>
      <p class="comp-reveal-answer t-body ${wasSkipped ? 'comp-reveal-skipped' : ''}">
        ${wasSkipped ? '(omitida)' : esc(givenResponse)}
      </p>
    </div>
    <div class="comp-reveal-row comp-reveal-target">
      <p class="t-label">Frase objetivo</p>
      <p class="comp-reveal-utterance t-utterance cal-utterance">${esc(utterance)}</p>
    </div>

    <div class="comp-correspondence">
      <p class="t-label">Correspondencia</p>
      <p class="t-body-sm">¿En qué medida coincide su respuesta con la frase objetivo?</p>
      <div id="widget-correspondence" class="comp-corr-scale" role="group" aria-label="Correspondencia">
        ${CORR_OPTIONS.map(([val, label]) => `
          <label class="comp-corr-option">
            <input type="radio" name="correspondence" value="${val}" class="radio-input" />
            <span class="comp-corr-label t-body-sm">${label}</span>
          </label>
        `).join('')}
      </div>
    </div>

    <div id="corr-error" class="import-error" role="alert" hidden>
      <p class="t-body-sm">Seleccione un nivel de correspondencia para continuar.</p>
    </div>

    <div class="screen-actions">
      <button id="comp-continue" class="btn-primary">
        Continuar al juicio
      </button>
    </div>
  `

  container.appendChild(revealBlock)

  const continueBtn = revealBlock.querySelector<HTMLButtonElement>('#comp-continue')!
  const corrErrorEl = revealBlock.querySelector<HTMLElement>('#corr-error')!

  continueBtn.addEventListener('click', async () => {
    const selected = revealBlock.querySelector<HTMLInputElement>('input[name="correspondence"]:checked')
    if (!selected) {
      corrErrorEl.hidden = false
      return
    }
    corrErrorEl.hidden = true
    continueBtn.disabled = true
    continueBtn.textContent = 'Guardando…'

    try {
      const { revealTargetPhrase } = await import('../../rules/evaluation.ts')
      revealTargetPhrase(momentId, Number(selected.value))
      void navigate('judgment')
    } catch (err) {
      continueBtn.disabled = false
      continueBtn.textContent = 'Continuar al juicio'
      corrErrorEl.querySelector('.t-body-sm')!.textContent =
        err instanceof Error ? err.message : 'Error al revelar.'
      corrErrorEl.hidden = false
    }
  })
}

// Opciones de correspondencia (0 = sin correspondencia → 4 = exacta)
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

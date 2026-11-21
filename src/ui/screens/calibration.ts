/**
 * #screen-calibration
 *
 * Calibración previa obligatoria. Presenta N anclas una a una, con dos fases por ancla:
 *
 *   scoring   — el evaluador puntúa a ciegas (ancla NO en DOM)
 *   revealed  — se muestra el ancla + fundamento + divergencia
 *
 * Garantías implementadas aquí:
 *   AnchorsHiddenWhileScoring — el bloque con anchor_score y rationale no se
 *     inserta en el DOM mientras la fase es 'scoring'. No es CSS: es ausencia real.
 *   DivergenceNeverBlocks — la divergencia aparece como dato; el botón de continuar
 *     nunca depende de su valor.
 *
 * La marca de revelación diferida (regla violeta de 2px) aparece aquí y en la
 * pantalla de comprensión espontánea. En ningún otro lugar.
 */

import { t } from '../i18n.ts'
import { navigate } from '../router.ts'
import { appState, completeStep } from '../app-state.ts'
import { db } from '../../store.ts'
import type { DimensionId } from '../../types.ts'

// ─────────────────────────────────────────────
// Metadatos por dimensión (pregunta, etiquetas de extremo)
// ─────────────────────────────────────────────

type DimMeta = { label: string; question: string; low: string; high: string }

const DIM: Record<DimensionId, DimMeta> = {
  c1_semantic:     { label: t('dims.C1'), question: t('judgment.c1_question'), low: t('judgment.c1_low'), high: t('judgment.c1_high') },
  c2_pragmatic:    { label: t('dims.C2'), question: t('judgment.c2_question'), low: t('judgment.c2_low'), high: t('judgment.c2_high') },
  c3_cultural:     { label: t('dims.C3'), question: t('judgment.c3_question'), low: t('judgment.c3_low'), high: t('judgment.c3_high') },
  c4_learnability: { label: t('dims.C4'), question: t('judgment.c4_question'), low: t('judgment.c4_low'), high: t('judgment.c4_high') },
}

// ─────────────────────────────────────────────
// Render principal
// ─────────────────────────────────────────────

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-calibration'
  el.setAttribute('data-screen-label', t('prep.calibration'))

  el.innerHTML = `
    <header class="screen-header">
      <p class="t-label">${t('prep.rail_label')} · 5 de 5</p>
      <h2>${t('prep.calibration')}</h2>
      <p class="t-body">
        Antes de evaluar, vea los siguientes pictogramas y puntúe cada uno.
        Después se revelará el valor de referencia y podrá comparar su juicio.
        La divergencia se reporta y nunca bloquea.
      </p>
    </header>

    <div id="calibration-step-container"></div>
  `

  const container = el.querySelector<HTMLElement>('#calibration-step-container')!
  void setupAndRun(container)

  return el
}

// ─────────────────────────────────────────────
// Setup asíncrono + loop de pasos
// ─────────────────────────────────────────────

async function setupAndRun(container: HTMLElement): Promise<void> {
  const sessionId = appState.sessionId
  if (!sessionId) {
    container.innerHTML = `<p class="t-body import-error">Sin sesión activa. Vuelva al inicio.</p>`
    return
  }

  const sourceId = appState.sourceId
  if (!sourceId) {
    container.innerHTML = `<p class="t-body import-error">Sin fuente importada. Vuelva al inicio.</p>`
    return
  }

  let calId: string
  let steps: Array<{ anchorId: string; caseId: string; imageRef: string; utterance: string; dimension: DimensionId }>

  try {
    const { ensureCalibrationSet, getCalibrationSteps } = await import('../../corpus/calibration-seed.ts')
    const setId = ensureCalibrationSet(sourceId)
    steps = getCalibrationSteps(setId)

    const { startCalibration } = await import('../../rules/calibration.ts')
    const existing = db.calibrationBySession(sessionId)
    const cal = existing ?? startCalibration(sessionId, setId)
    calId = cal.id
  } catch (err) {
    container.innerHTML = `<p class="t-body import-error">${err instanceof Error ? err.message : 'Error al iniciar calibración.'}</p>`
    return
  }

  let step = 0

  function advance(): void {
    step++
    if (step < steps.length) {
      renderStep(container, steps, step, 'scoring', calId, advance)
    }
  }

  renderStep(container, steps, 0, 'scoring', calId, advance)
}

// ─────────────────────────────────────────────
// Render de un paso
// ─────────────────────────────────────────────

function renderStep(
  container: HTMLElement,
  steps: Array<{ anchorId: string; imageRef: string; utterance: string; dimension: DimensionId }>,
  stepIndex: number,
  phase: 'scoring' | 'revealed',
  calId: string,
  onNext: () => void,
): void {
  const step = steps[stepIndex]
  if (!step) return

  const { anchorId, imageRef, utterance, dimension } = step
  const dim = DIM[dimension]
  const total = steps.length
  const isLast = stepIndex === total - 1

  container.innerHTML = ''

  // ── Progreso ──
  const progress = document.createElement('p')
  progress.className = 't-label cal-progress'
  progress.textContent = `${stepIndex + 1} de ${total}`
  container.appendChild(progress)

  // ── Imagen + utterance ──
  const caseEl = document.createElement('div')
  caseEl.id = 'calibration-item'
  caseEl.className = 'cal-case'
  caseEl.innerHTML = `
    <div class="icap-stage cal-stage" role="img" aria-label="${escHtml(utterance)}">
      <img src="${escHtml(imageRef)}" alt="${escHtml(utterance)}" class="cal-image" />
    </div>
    <p class="cal-utterance t-utterance">${escHtml(utterance)}</p>
  `
  container.appendChild(caseEl)

  // ── Pregunta de calibración ──
  const questionEl = document.createElement('div')
  questionEl.className = 'cal-question'
  questionEl.setAttribute('data-icap-dim', dimension)
  questionEl.innerHTML = `
    <p class="t-label">${escHtml(dim.label)}</p>
    <p class="t-body cal-question-text">${escHtml(dim.question)}</p>
  `
  container.appendChild(questionEl)

  if (phase === 'scoring') {
    renderScoringPhase(container, anchorId, calId, dim, stepIndex, total, isLast, onNext)
  } else {
    const responses = db.responsesByCalibration(calId)
    const response = responses.find(r => r.anchor_id === anchorId)
    const anchor = db.calibrationAnchors.get(anchorId)
    renderRevealedPhase(container, response?.given_score ?? 0, anchor?.anchor_score ?? 3, anchor?.rationale ?? '', isLast, calId, onNext)
  }
}

// ─────────────────────────────────────────────
// Fase scoring
// ─────────────────────────────────────────────

function renderScoringPhase(
  container: HTMLElement,
  anchorId: string,
  calId: string,
  dim: DimMeta,
  stepIndex: number,
  total: number,
  isLast: boolean,
  onNext: () => void,
): void {
  let selectedScore: number | null = null

  // Escala Likert 1–5
  const scaleEl = document.createElement('div')
  scaleEl.id = 'judgment-scale-cal'
  scaleEl.className = 'cal-scale'
  scaleEl.setAttribute('role', 'group')
  scaleEl.setAttribute('aria-label', dim.question)

  const scaleBtns: HTMLButtonElement[] = []
  for (let v = 1; v <= 5; v++) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'cal-scale-btn'
    btn.textContent = String(v)
    btn.setAttribute('aria-label', `${v} · ${v === 1 ? dim.low : v === 5 ? dim.high : ''}`)
    btn.dataset['value'] = String(v)
    btn.addEventListener('click', () => {
      selectedScore = v
      scaleBtns.forEach(b => b.classList.toggle('cal-scale-btn--selected', b === btn))
      sealBtn.disabled = false
    })
    scaleBtns.push(btn)
    scaleEl.appendChild(btn)
  }

  const scaleLabels = document.createElement('div')
  scaleLabels.className = 'cal-scale-labels'
  scaleLabels.innerHTML = `<span class="t-caption">${escHtml(dim.low)}</span><span class="t-caption">${escHtml(dim.high)}</span>`
  scaleEl.appendChild(scaleLabels)
  container.appendChild(scaleEl)

  // ── BLOQUE DIFERIDO: AUSENTE del DOM mientras scoring ──
  // (nada se inserta aquí; el bloque se añade en renderRevealedPhase)
  const deferredPlaceholder = document.createElement('div')
  deferredPlaceholder.className = 'cal-deferred-placeholder icap-deferred'
  deferredPlaceholder.setAttribute('aria-hidden', 'true')
  deferredPlaceholder.innerHTML = `
    <p class="t-label cal-deferred-label">${t('comprehension.deferred_label')}</p>
    <p class="t-body-sm cal-deferred-note">${t('calibration.anchor_label')} · ${t('comprehension.deferred_note')}</p>
  `
  container.appendChild(deferredPlaceholder)

  // ── Botón sellar ──
  const actionsEl = document.createElement('div')
  actionsEl.className = 'screen-actions'

  const sealBtn = document.createElement('button')
  sealBtn.id = 'calibration-seal'
  sealBtn.type = 'button'
  sealBtn.className = 'btn-primary'
  sealBtn.disabled = true
  sealBtn.textContent = t('comprehension.seal')

  sealBtn.addEventListener('click', async () => {
    if (selectedScore === null) return
    sealBtn.disabled = true
    sealBtn.textContent = 'Sellando…'

    try {
      const { recordCalibrationResponse } = await import('../../rules/calibration.ts')
      recordCalibrationResponse(calId, anchorId, selectedScore)

      // Redibujar en fase revealed (el ancla ahora puede entrar al DOM)
      const step = { anchorId, imageRef: '', utterance: '', dimension: 'c1_semantic' as DimensionId }
      void step  // solo para el linter
      renderStepRevealed(container, anchorId, calId, dim, selectedScore, isLast, calId, onNext)
    } catch (err) {
      sealBtn.disabled = false
      sealBtn.textContent = t('comprehension.seal')
      console.error(err)
    }
  })

  actionsEl.appendChild(sealBtn)
  container.appendChild(actionsEl)
}

// ─────────────────────────────────────────────
// Fase revealed (ancla entra al DOM por primera vez)
// ─────────────────────────────────────────────

function renderRevealedPhase(
  container: HTMLElement,
  givenScore: number,
  anchorScore: number,
  rationale: string,
  isLast: boolean,
  calId: string,
  onNext: () => void,
): void {
  renderStepRevealed(container, '', calId, { label: '', question: '', low: '', high: '' }, givenScore, isLast, calId, onNext)
}

function renderStepRevealed(
  container: HTMLElement,
  anchorId: string,
  calId: string,
  _dim: DimMeta,
  givenScore: number,
  isLast: boolean,
  _calId: string,
  onNext: () => void,
): void {
  // Quitar escala y botón de sellado
  container.querySelector('#judgment-scale-cal')?.remove()
  container.querySelector('#calibration-seal')?.closest('.screen-actions')?.remove()
  container.querySelector('.cal-deferred-placeholder')?.remove()

  // Leer ancla (ahora sí podemos)
  const anchor = db.calibrationAnchors.get(anchorId)
  const anchorScore = anchor?.anchor_score ?? 3
  const rationale   = anchor?.rationale ?? ''
  const divergence  = Math.abs(givenScore - anchorScore)

  // ── Respuesta del evaluador ──
  const yourScore = document.createElement('div')
  yourScore.className = 'cal-your-score'
  yourScore.innerHTML = `
    <p class="t-label">Su respuesta</p>
    <span class="cal-score-value t-mono-id">${givenScore}</span>
  `
  container.appendChild(yourScore)

  // ── BLOQUE DIFERIDO: entra al DOM aquí por primera vez ──
  const revealBlock = document.createElement('div')
  revealBlock.id = 'block-deferred-anchor'
  revealBlock.className = 'icap-deferred cal-anchor-reveal'
  revealBlock.setAttribute('data-icap-state', 'registrada')
  revealBlock.innerHTML = `
    <p class="t-label cal-deferred-label">${t('calibration.anchor_label')}</p>
    <div class="cal-anchor-row">
      <span class="cal-score-value cal-score-value--anchor t-mono-id">${anchorScore}</span>
      <p class="cal-rationale t-body-sm">${escHtml(rationale)}</p>
    </div>
    <div id="calibration-divergence" class="cal-divergence">
      <p class="t-label">${t('calibration.divergence')}</p>
      <p class="cal-divergence-value t-mono-id">${divergence > 0 ? `+${divergence}` : '0'}</p>
      <p class="t-caption cal-divergence-note">${t('calibration.divergence_note')}</p>
    </div>
  `
  container.appendChild(revealBlock)

  // ── Botón siguiente / completar ──
  const actionsEl = document.createElement('div')
  actionsEl.className = 'screen-actions'

  const nextBtn = document.createElement('button')
  nextBtn.id = 'calibration-reveal'
  nextBtn.type = 'button'
  nextBtn.className = 'btn-primary'
  nextBtn.textContent = isLast ? 'Completar calibración' : 'Siguiente pictograma'

  nextBtn.addEventListener('click', async () => {
    nextBtn.disabled = true
    if (isLast) {
      try {
        const { revealCalibrationAnchors } = await import('../../rules/calibration.ts')
        revealCalibrationAnchors(calId)
        completeStep('calibration')
        void navigate('item-index')
      } catch (err) {
        nextBtn.disabled = false
        console.error(err)
      }
    } else {
      onNext()
    }
  })

  actionsEl.appendChild(nextBtn)
  container.appendChild(actionsEl)
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

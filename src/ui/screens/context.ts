/**
 * #screen-context
 *
 * Contexto de la sesión de evaluación: a quién va dirigida la biblioteca,
 * en qué entorno y con qué modalidad se presentará.
 * Al enviar crea la EvaluationSession y navega a calibración.
 *
 * Persistencia: los valores se guardan en localStorage bajo STORAGE_KEY y se
 * restauran al montar, para que el contexto habitual no tenga que reescribirse.
 */

import { t } from '../i18n.ts'
import { navigate } from '../router.ts'
import { appState, completeStep } from '../app-state.ts'

const STORAGE_KEY = 'icap:evaluation-context:v2'

interface SavedContext {
  target_population: string
  communicative_task: string
  environment: string
  modality: string
  presentation_size_px: string
  label_shown: string
}

function loadSaved(): Partial<SavedContext> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<SavedContext>) : {}
  } catch {
    return {}
  }
}

function saveContext(data: SavedContext): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* non-fatal */ }
}

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-context'
  el.setAttribute('data-screen-label', t('prep.context'))

  const saved = loadSaved()

  el.innerHTML = `
    <header class="screen-header">
      <p class="t-label">${t('prep.rail_label')} · 4 de 5</p>
      <h2>${t('prep.context')}</h2>
      <p class="t-body">El contexto de uso queda fijado en cada registro de evaluación. Puede variarlo en sesiones futuras.</p>
    </header>

    <form id="form-context" class="form-prep" novalidate>

      <fieldset class="form-group">
        <legend class="t-label">Población destinataria</legend>
        <label class="field-label" for="field-population">Descripción de la población</label>
        <input id="field-population" name="target_population" type="text"
          class="field-text" required placeholder="p.ej. Adultos con TEA, nivel 2"
          value="${escAttr(saved.target_population ?? '')}" />
      </fieldset>

      <fieldset class="form-group">
        <legend class="t-label">Tarea comunicativa</legend>
        <label class="field-label" for="field-task">Tipo de tarea</label>
        <select id="field-task" name="communicative_task" class="field-select" required>
          <option value="">—</option>
          ${['solicitud','rechazo','descripcion','narración','pregunta','saludo'].map(v =>
            `<option value="${v}"${saved.communicative_task === v ? ' selected' : ''}>${v}</option>`).join('')}
        </select>
      </fieldset>

      <fieldset class="form-group">
        <legend class="t-label">Entorno de uso</legend>
        <label class="field-label" for="field-environment">Entorno</label>
        <select id="field-environment" name="environment" class="field-select" required>
          <option value="">—</option>
          ${['escuela','hogar','clínica','comunidad','trabajo'].map(v =>
            `<option value="${v}"${saved.environment === v ? ' selected' : ''}>${v}</option>`).join('')}
        </select>
      </fieldset>

      <fieldset class="form-group">
        <legend class="t-label">Modalidad de presentación</legend>
        <label class="field-label" for="field-modality">Modalidad</label>
        <select id="field-modality" name="modality" class="field-select" required>
          <option value="">—</option>
          ${['tablero','pantalla','papel','acceso_barrido'].map(v =>
            `<option value="${v}"${saved.modality === v ? ' selected' : ''}>${v}</option>`).join('')}
        </select>
      </fieldset>

      <fieldset class="form-group" id="field-presentation-size">
        <legend class="t-label">Tamaño de presentación</legend>
        <label class="field-label" for="field-size-px">Tamaño del pictograma (px)</label>
        <input id="field-size-px" name="presentation_size_px" type="number"
          class="field-text field-text--narrow" required min="20" max="1200"
          placeholder="p.ej. 120"
          value="${escAttr(saved.presentation_size_px ?? '')}" />
        <p class="t-caption">${t('threshold.b2_limit')}</p>
      </fieldset>

      <fieldset class="form-group">
        <legend class="t-label">Etiqueta de texto</legend>
        <label class="radio-label">
          <input type="radio" name="label_shown" value="false"
            ${saved.label_shown !== 'true' ? 'checked' : ''} class="radio-input" />
          <span class="radio-text t-body-sm">Sin etiqueta</span>
        </label>
        <label class="radio-label">
          <input type="radio" name="label_shown" value="true"
            ${saved.label_shown === 'true' ? 'checked' : ''} class="radio-input" />
          <span class="radio-text t-body-sm">Con etiqueta de texto</span>
        </label>
      </fieldset>

      <div id="context-error" class="import-error" role="alert" hidden>
        <p class="import-error-msg t-body-sm"></p>
      </div>

      <div class="screen-actions">
        <button id="context-submit" type="submit" class="btn-primary">
          Continuar a calibración
        </button>
      </div>

      <div class="form-clear-row">
        <button type="button" id="btn-clear-context" class="btn-clear t-caption">
          Borrar datos guardados
        </button>
      </div>
    </form>
  `

  const form    = el.querySelector<HTMLFormElement>('#form-context')!
  const errorEl = el.querySelector<HTMLElement>('#context-error')!
  const errorMsg = el.querySelector<HTMLElement>('.import-error-msg')!

  el.querySelector('#btn-clear-context')!.addEventListener('click', () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ok */ }
    form.reset()
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    if (!appState.evaluatorId) {
      errorMsg.textContent = 'Falta completar el perfil del evaluador.'
      errorEl.hidden = false
      return
    }

    const data = new FormData(form)
    const target_population    = (data.get('target_population') as string)?.trim()
    const communicative_task   = (data.get('communicative_task') as string)?.trim()
    const environment          = (data.get('environment') as string)?.trim()
    const modality             = (data.get('modality') as string)?.trim()
    const presentation_size_px = Number(data.get('presentation_size_px'))
    const label_shown          = data.get('label_shown') === 'true'

    if (!target_population || !communicative_task || !environment || !modality || !presentation_size_px) {
      errorMsg.textContent = 'Todos los campos son obligatorios.'
      errorEl.hidden = false
      return
    }

    errorEl.hidden = true

    saveContext({
      target_population,
      communicative_task,
      environment,
      modality,
      presentation_size_px: String(presentation_size_px),
      label_shown: String(label_shown),
    })

    try {
      const { createEvaluationSession } = await import('../../rules/session.ts')
      const session = createEvaluationSession({
        evaluator_id: appState.evaluatorId,
        app_version: '2.0.0',
        context: { target_population, communicative_task, environment, modality, presentation_size_px, label_shown },
      })
      appState.sessionId = session.id
      completeStep('context')
      void navigate('calibration')
    } catch (err) {
      errorMsg.textContent = err instanceof Error ? err.message : 'Error al crear la sesión.'
      errorEl.hidden = false
    }
  })

  return el
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

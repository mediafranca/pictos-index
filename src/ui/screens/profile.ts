/**
 * #screen-profile
 *
 * Formulario de perfil del evaluador: rol, datos etnográficos y consentimiento.
 * Al enviar crea el EvaluatorProfile en el store y navega al contexto.
 *
 * Persistencia: los valores se guardan y restauran desde localStorage bajo la
 * clave STORAGE_KEY para que el evaluador no tenga que rellenarlos en cada sesión.
 */

import { t } from '../i18n.ts'
import { navigate } from '../router.ts'
import { appState, completeStep } from '../app-state.ts'
import type { ConsentScope } from '../../types.ts'

const STORAGE_KEY = 'icap:evaluator-profile:v2'

interface SavedProfile {
  pseudonym: string
  role: string
  age_range: string
  gender: string
  region: string
  primary_language: string
  aac_experience: string
  consent_scope: string
}

function loadSaved(): Partial<SavedProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<SavedProfile>) : {}
  } catch {
    return {}
  }
}

function saveProfile(data: SavedProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // storage full — non-fatal
  }
}

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-profile'
  el.setAttribute('data-screen-label', t('prep.profile'))

  const saved = loadSaved()

  el.innerHTML = `
    <header class="screen-header">
      <p class="t-label">${t('prep.rail_label')} · 3 de 5</p>
      <h2>${t('prep.profile')}</h2>
    </header>

    <form id="form-profile" class="form-prep" novalidate>

      <fieldset class="form-group">
        <legend class="t-label">Identificación (anónima)</legend>
        <label class="field-label" for="field-pseudonym">Seudónimo</label>
        <input id="field-pseudonym" name="pseudonym" type="text"
          class="field-text" required autocomplete="off"
          placeholder="p.ej. evaluador-A7"
          value="${escAttr(saved.pseudonym ?? '')}" />
      </fieldset>

      <fieldset class="form-group" id="field-role">
        <legend class="t-label">Rol</legend>
        ${radioGroup('role', [
          ['usuario',          'Persona usuaria de pictogramas'],
          ['familiar_cuidador','Familiar o cuidador'],
          ['profesional_caa',  'Profesional de CAA'],
          ['investigador',     'Investigador'],
        ], saved.role)}
      </fieldset>

      <fieldset class="form-group">
        <legend class="t-label">Datos etnográficos</legend>

        <label class="field-label" for="field-age-range">Rango de edad</label>
        <select id="field-age-range" name="age_range" class="field-select" required>
          <option value="">—</option>
          ${['<18','18-29','30-39','40-49','50-59','60+'].map(r =>
            `<option value="${r}"${saved.age_range === r ? ' selected' : ''}>${r}</option>`).join('')}
        </select>

        <label class="field-label" for="field-gender">Género</label>
        <select id="field-gender" name="gender" class="field-select" required>
          <option value="">—</option>
          ${['mujer','hombre','no-binario','prefiero-no-decir'].map(g =>
            `<option value="${g}"${saved.gender === g ? ' selected' : ''}>${g}</option>`).join('')}
        </select>

        <label class="field-label" for="field-region">Región (ISO 3166-2)</label>
        <input id="field-region" name="region" type="text"
          class="field-text" required placeholder="p.ej. ES-CAT, AR-B"
          value="${escAttr(saved.region ?? '')}" />

        <label class="field-label" for="field-language">Idioma principal (BCP 47)</label>
        <input id="field-language" name="primary_language" type="text"
          class="field-text" required placeholder="p.ej. es, ca, eu"
          value="${escAttr(saved.primary_language ?? '')}" />
      </fieldset>

      <fieldset class="form-group">
        <legend class="t-label">Experiencia con CAA</legend>
        ${radioGroup('aac_experience', [
          ['ninguna',       'Ninguna'],
          ['usuario',       'Uso personal'],
          ['familiar',      'Familiar o cuidador'],
          ['profesional',   'Profesional'],
          ['investigadora', 'Investigación'],
        ], saved.aac_experience)}
      </fieldset>

      <fieldset class="form-group" id="widget-consent">
        <legend class="t-label">Consentimiento · v1.0</legend>
        <p class="t-body-sm">Los datos registrados en esta sesión se usarán para
          investigación sobre calidad pictográfica. Puede elegir el alcance.</p>
        ${radioGroup('consent_scope', [
          ['private_only',       'Solo para mi uso; no compartir'],
          ['aggregated_public',  'Datos agregados públicos'],
          ['full_public',        'Datos completos públicos'],
        ], saved.consent_scope)}
      </fieldset>

      <div id="profile-error" class="import-error" role="alert" hidden>
        <p class="import-error-msg t-body-sm"></p>
      </div>

      <div class="screen-actions">
        <button id="profile-submit" type="submit" class="btn-primary">
          Continuar a contexto
        </button>
      </div>

      <div class="form-clear-row">
        <button type="button" id="btn-clear-profile" class="btn-clear t-caption">
          Borrar datos guardados
        </button>
      </div>
    </form>
  `

  const form = el.querySelector<HTMLFormElement>('#form-profile')!
  const errorEl = el.querySelector<HTMLElement>('#profile-error')!
  const errorMsg = el.querySelector<HTMLElement>('.import-error-msg')!

  el.querySelector('#btn-clear-profile')!.addEventListener('click', () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ok */ }
    form.reset()
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = new FormData(form)

    const pseudonym        = (data.get('pseudonym') as string)?.trim()
    const role             = data.get('role') as string
    const age_range        = data.get('age_range') as string
    const gender           = data.get('gender') as string
    const region           = data.get('region') as string
    const primary_language = data.get('primary_language') as string
    const aac_experience   = data.get('aac_experience') as string
    const consent_scope    = data.get('consent_scope') as ConsentScope

    if (!pseudonym || !role || !age_range || !gender || !region || !primary_language || !aac_experience || !consent_scope) {
      errorMsg.textContent = 'Todos los campos son obligatorios.'
      errorEl.hidden = false
      return
    }

    errorEl.hidden = true

    // Persistir antes de crear el perfil, así el dato no se pierde si hay error de store
    saveProfile({ pseudonym, role, age_range, gender, region, primary_language, aac_experience, consent_scope })

    try {
      const { createEvaluatorProfile } = await import('../../rules/session.ts')
      const profile = createEvaluatorProfile({
        pseudonym, role, age_range, gender, region, primary_language,
        aac_experience, consent_version: '1.0', consent_scope,
      })
      appState.evaluatorId = profile.id
      completeStep('profile')
      void navigate('context')
    } catch (err) {
      errorMsg.textContent = err instanceof Error ? err.message : 'Error al crear el perfil.'
      errorEl.hidden = false
    }
  })

  return el
}

function radioGroup(name: string, options: [string, string][], selected?: string): string {
  return options.map(([value, label]) => `
    <label class="radio-label">
      <input type="radio" name="${name}" value="${value}" class="radio-input"${selected === value ? ' checked' : ''} />
      <span class="radio-text t-body-sm">${label}</span>
    </label>
  `).join('')
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

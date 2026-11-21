/**
 * #screen-home
 *
 * Punto de entrada de la aplicación. Presenta el instrumento y ofrece
 * el acceso a la importación de fuente. Sin estado: se recarga limpia cada vez.
 */

import { t } from '../i18n.ts'
import { navigate } from '../router.ts'
import { appState, completeStep } from '../app-state.ts'

/** Biblioteca de ejemplo incluida en el repositorio (solo disponible en dev). */
const EXAMPLE_LIBRARY_PATH = '/examples/icap_50_v1_graph_2026-02-11.json'

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-home'
  el.setAttribute('data-screen-label', 'Inicio')

  el.innerHTML = `
    <div class="home-hero">
      <h1 class="home-brand t-brand">${t('brand.name')}</h1>
      <p class="home-expansion t-caption">${t('brand.expansion')}</p>
      <p class="home-tagline">${t('brand.tagline')}</p>
      <p class="home-relation t-body">${t('brand.relation')}</p>
    </div>

    <div class="home-actions">
      <button id="btn-import-source" class="btn-primary">
        ${t('prep.source')}
      </button>
      <a href="#" id="link-methodology" class="btn-secondary">
        ${t('footer.methodology')}
      </a>
    </div>

    <div class="home-examples">
      <p class="t-label">Biblioteca de ejemplo</p>
      <button id="btn-load-example" class="btn-secondary">
        Cargar ICAP 50 v1 · 88 ítems
      </button>
      <p id="example-status" class="t-caption" hidden></p>
    </div>

    <div class="home-note">
      <p class="t-caption">${t('states.empty_library')}</p>
      <p class="t-caption home-partial-note">${t('states.partial_note')}</p>
    </div>
  `

  el.querySelector('#btn-import-source')!.addEventListener('click', () => {
    void navigate('source-import')
  })

  el.querySelector('#link-methodology')!.addEventListener('click', (e) => {
    e.preventDefault()
    void navigate('methodology')
  })

  const exampleBtn = el.querySelector<HTMLButtonElement>('#btn-load-example')!
  const exampleStatus = el.querySelector<HTMLElement>('#example-status')!

  exampleBtn.addEventListener('click', async () => {
    exampleBtn.disabled = true
    exampleBtn.textContent = 'Cargando…'
    exampleStatus.textContent = 'Descargando biblioteca de ejemplo…'
    exampleStatus.hidden = false

    try {
      const resp = await fetch(EXAMPLE_LIBRARY_PATH)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const raw = await resp.json() as unknown

      exampleStatus.textContent = 'Importando ítems…'
      const { importPictosLibrary } = await import('../../ingest.ts')
      const result = await importPictosLibrary(raw)

      appState.sourceId = result.source.id
      appState.reportId = result.report.id
      completeStep('source')

      void navigate('import-report')
    } catch (err) {
      exampleStatus.textContent = err instanceof Error ? err.message : 'Error al cargar el ejemplo.'
      exampleBtn.disabled = false
      exampleBtn.textContent = 'Cargar ICAP 50 v1 · 88 ítems'
    }
  })

  return el
}

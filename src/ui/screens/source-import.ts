/**
 * #screen-source-import
 *
 * Tres modos de carga:
 *   1. Selector dinámico de bibliotecas publicadas en pictos.net (índice remoto)
 *   2. URL manual
 *   3. Archivo local (drag-drop / file input)
 *
 * El índice se carga desde https://pictos.net/libraries/index.json al montar.
 * Las entradas grandes (> LARGE_ITEMS_THRESHOLD) muestran advertencia antes de descargar.
 *
 * Garantía NoSilentImport: no se puede salir sin un informe de validación generado.
 */

import { t } from '../i18n.ts'
import { navigate } from '../router.ts'
import { appState, completeStep } from '../app-state.ts'

const INDEX_URL = 'https://pictos.net/libraries/index.json'
const LIB_BASE  = 'https://pictos.net/libraries/'
/** Aviso de tamaño si la biblioteca tiene más de este número de ítems. */
const LARGE_ITEMS_THRESHOLD = 500

interface LibraryEntry {
  name:     string
  filename: string
  items:    number
  language: string
  location?: string
}

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-source-import'
  el.setAttribute('data-screen-label', t('prep.source'))

  el.innerHTML = `
    <header class="screen-header">
      <p class="t-label">${t('prep.rail_label')} · 1 de 5</p>
      <h2>${t('prep.source')}</h2>
      <p class="t-body">${t('brand.relation')}</p>
    </header>

    <!-- Modo 1: biblioteca publicada -->
    <div class="form-group" id="source-pictos-section">
      <label class="t-label" for="field-pictos-library">Bibliotecas publicadas en pictos.net</label>
      <select id="field-pictos-library" class="field-select" disabled>
        <option value="">Cargando catálogo…</option>
      </select>
      <p id="library-size-warning" class="source-size-warning t-caption" hidden>
        Esta biblioteca es grande y puede tardar varios minutos en descargarse.
      </p>
      <button id="btn-load-pictos" class="btn-primary" disabled>
        Cargar biblioteca
      </button>
    </div>

    <!-- Modo 2: URL manual -->
    <div class="form-group" id="source-url-section">
      <label class="t-label" for="field-source-url">O cargar desde URL (JSON)</label>
      <div class="source-url-row">
        <input id="field-source-url" name="source_url" type="url"
          class="field-text" placeholder="https://…/library.json" />
        <button id="btn-load-url" class="btn-secondary">Cargar</button>
      </div>
    </div>

    <!-- Modo 3: archivo local -->
    <div class="form-group" id="source-file-section">
      <p class="t-label">O subir archivo local</p>
      <div id="widget-source-dropzone" class="dropzone" role="region" aria-label="Zona de carga">
        <input
          id="field-source-file"
          type="file"
          accept=".json,application/json"
          aria-label="Seleccionar archivo JSON de biblioteca"
          class="dropzone-input"
        />
        <label for="field-source-file" class="dropzone-label">
          <span class="dropzone-icon" aria-hidden="true">↑</span>
          <span class="t-body">Arrastre el archivo JSON aquí o</span>
          <span class="dropzone-cta btn-secondary">Seleccionar archivo</span>
        </label>
        <div id="dropzone-filename" class="dropzone-filename t-mono-id" hidden></div>
      </div>
      <button id="import-submit" class="btn-primary" disabled>
        Importar archivo
      </button>
    </div>

    <div id="import-error" class="import-error" role="alert" hidden>
      <p class="import-error-msg t-body-sm"></p>
    </div>

    <p id="import-progress" class="import-progress t-body-sm" hidden>
      Importando…
    </p>
  `

  const errorEl    = el.querySelector<HTMLElement>('#import-error')!
  const errorMsg   = el.querySelector<HTMLElement>('.import-error-msg')!
  const progressEl = el.querySelector<HTMLElement>('#import-progress')!

  function showError(msg: string): void {
    errorMsg.textContent = msg
    errorEl.hidden = false
    progressEl.hidden = true
  }
  function hideError(): void { errorEl.hidden = true }

  async function runImport(raw: unknown, statusEl?: HTMLButtonElement): Promise<void> {
    progressEl.textContent = 'Importando…'
    progressEl.hidden = false
    hideError()
    try {
      const { importPictosLibrary } = await import('../../ingest.ts')
      const result = await importPictosLibrary(raw)
      appState.sourceId = result.source.id
      appState.reportId = result.report.id
      completeStep('source')
      void navigate('import-report')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error desconocido al importar.')
      if (statusEl) {
        statusEl.disabled = false
        statusEl.textContent = statusEl.dataset['label'] ?? 'Cargar'
      }
    }
  }

  // ── Modo 1: catálogo pictos.net ───────────────────────────────────────
  const pictoSelect  = el.querySelector<HTMLSelectElement>('#field-pictos-library')!
  const sizeWarning  = el.querySelector<HTMLElement>('#library-size-warning')!
  const pictoBtn     = el.querySelector<HTMLButtonElement>('#btn-load-pictos')!

  let libraries: LibraryEntry[] = []

  // Poblar el select con el catálogo remoto
  void fetch(INDEX_URL)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json() as Promise<{ libraries: LibraryEntry[] }>
    })
    .then(({ libraries: libs }) => {
      libraries = libs
      pictoSelect.innerHTML = '<option value="">— Seleccionar biblioteca —</option>'
      // Separar locales (examples) del catálogo remoto
      pictoSelect.appendChild(localExampleGroup())
      if (libs.length > 0) {
        const remote = document.createElement('optgroup')
        remote.label = 'pictos.net'
        for (const lib of libs) {
          const opt = document.createElement('option')
          opt.value = lib.filename
          opt.textContent = `${lib.name} · ${lib.language} · ${lib.items} ítems`
          remote.appendChild(opt)
        }
        pictoSelect.appendChild(remote)
      }
      pictoSelect.disabled = false
    })
    .catch(() => {
      // Si falla el índice remoto, mostrar solo el ejemplo local
      pictoSelect.innerHTML = '<option value="">— Seleccionar biblioteca —</option>'
      pictoSelect.appendChild(localExampleGroup())
      pictoSelect.disabled = false
      // Nota no bloqueante; el usuario puede usar los otros modos
    })

  pictoSelect.addEventListener('change', () => {
    const filename = pictoSelect.value
    pictoBtn.disabled = !filename
    // Advertencia de tamaño
    const lib = libraries.find(l => l.filename === filename)
    sizeWarning.hidden = !lib || lib.items <= LARGE_ITEMS_THRESHOLD
  })

  pictoBtn.dataset['label'] = 'Cargar biblioteca'
  pictoBtn.addEventListener('click', async () => {
    const filename = pictoSelect.value
    if (!filename) return

    pictoBtn.disabled = true
    pictoBtn.textContent = 'Descargando…'
    hideError()

    // Los ejemplos locales se sirven desde /examples/
    const url = filename.startsWith('/') ? filename : `${LIB_BASE}${filename}`

    try {
      progressEl.textContent = `Descargando ${filename}…`
      progressEl.hidden = false
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const raw = await resp.json() as unknown
      await runImport(raw, pictoBtn)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al descargar la biblioteca.')
      pictoBtn.disabled = false
      pictoBtn.textContent = 'Cargar biblioteca'
      progressEl.hidden = true
    }
  })

  // ── Modo 2: URL manual ────────────────────────────────────────────────
  const urlInput = el.querySelector<HTMLInputElement>('#field-source-url')!
  const urlBtn   = el.querySelector<HTMLButtonElement>('#btn-load-url')!

  urlBtn.dataset['label'] = 'Cargar'
  urlBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim()
    if (!url) return
    urlBtn.disabled = true
    urlBtn.textContent = 'Descargando…'
    hideError()
    try {
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const raw = await resp.json() as unknown
      await runImport(raw, urlBtn)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al descargar desde la URL.')
      urlBtn.disabled = false
      urlBtn.textContent = 'Cargar'
    }
  })

  // ── Modo 3: archivo local ─────────────────────────────────────────────
  const fileInput  = el.querySelector<HTMLInputElement>('#field-source-file')!
  const dropzone   = el.querySelector<HTMLElement>('#widget-source-dropzone')!
  const filenameEl = el.querySelector<HTMLElement>('#dropzone-filename')!
  const submitBtn  = el.querySelector<HTMLButtonElement>('#import-submit')!

  submitBtn.dataset['label'] = 'Importar archivo'
  let pendingFile: File | null = null

  function onFileSelected(file: File): void {
    pendingFile = file
    filenameEl.textContent = file.name
    filenameEl.hidden = false
    submitBtn.disabled = false
    hideError()
  }

  fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) onFileSelected(fileInput.files[0])
  })

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropzone.classList.add('dropzone--over')
  })
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dropzone--over')
  })
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropzone.classList.remove('dropzone--over')
    const file = e.dataTransfer?.files[0]
    if (file) onFileSelected(file)
  })

  submitBtn.addEventListener('click', async () => {
    if (!pendingFile) return
    submitBtn.disabled = true
    submitBtn.textContent = 'Importando…'
    hideError()
    try {
      const text = await pendingFile.text()
      const raw  = JSON.parse(text) as unknown
      await runImport(raw, submitBtn)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al leer el archivo.')
      submitBtn.disabled = false
      submitBtn.textContent = 'Importar archivo'
    }
  })

  return el
}

/** <optgroup> con el ejemplo local incluido en el repositorio. */
function localExampleGroup(): HTMLOptGroupElement {
  const group = document.createElement('optgroup')
  group.label = 'Ejemplos locales'
  const opt = document.createElement('option')
  opt.value = '/examples/icap_50_v1_graph_2026-02-11.json'
  opt.textContent = 'ICAP-50 v1 (2026-02-11) · 88 ítems'
  group.appendChild(opt)
  return group
}

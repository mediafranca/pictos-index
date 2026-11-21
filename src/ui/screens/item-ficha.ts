/**
 * #screen-item-ficha ← ItemFicha
 *
 * Diagnóstico de solo lectura. Tres bandas separadas por capa:
 *   Capa A — barras contra umbral (A1 veto, A2 perfil, A3 advertencia, A4 hipótesis)
 *   Capa B — valores en unidades físicas + dos pasadas + histéresis
 *   Capa C — tabla con estado por dimensión
 *
 * Garantías implementadas:
 *   VetoesAreNamed — todo bloqueo muestra causa + magnitud
 *   VersionIsVisible — versión + hash siempre visibles
 *   NoSingleAggregate — sin puntaje único
 *
 * La evidencia superada (registros de versiones anteriores) va en sección propia.
 */

import { navigate } from '../router.ts'
import { appState } from '../app-state.ts'
import { db } from '../../store.ts'
import { CONFIG } from '../../config.ts'

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-item-ficha'
  el.setAttribute('data-screen-label', 'Ficha del ítem')

  const itemId = appState.currentItemId
  const item   = itemId ? db.items.get(itemId) : undefined

  if (!item) {
    el.innerHTML = `<p class="t-body import-error" style="padding:var(--space-10)">Sin ítem seleccionado.</p>`
    return el
  }

  const records   = db.recordsByItem(item.id)
  const current   = records.filter(r => r.item_content_hash === item.content_hash)
  const superseded = records.filter(r => r.item_content_hash !== item.content_hash)
  const geo = item.geometry

  // Umbrales de referencia (propuestas sin calibrar)
  const a1Threshold = CONFIG.a1_stroke_min_pct
  const a1Blocked   = geo ? geo.stroke_pct < a1Threshold : false

  el.innerHTML = `
    <header class="screen-header">
      <div id="item-version" class="item-version-row">
        <span class="t-mono-id">${esc(item.stable_id)}</span>
        <span class="t-caption item-version-label">v${esc(item.item_version)}</span>
        <span class="t-mono-id item-hash" title="content_hash">${item.content_hash.slice(0, 8)}</span>
      </div>
      <div id="verdict-band-${esc(item.id)}" class="verdict-band ${a1Blocked ? 'verdict-band--blocked' : 'verdict-band--admissible'}">
        <span class="verdict-status t-label">${a1Blocked ? 'BLOQUEADO' : 'Admisible'}</span>
        ${a1Blocked ? `<span class="verdict-cause t-body-sm">Veto A1 · grosor de trazo ${geo?.stroke_pct.toFixed(1) ?? '—'}% &lt; ${a1Threshold}%</span>` : ''}
      </div>
    </header>

    <div id="pictogram-stage" class="icap-stage comp-stage ficha-stage">
      <img src="${esc(item.image_ref)}" alt="${esc(item.utterance)}" class="comp-image" />
    </div>
    <p class="cal-utterance t-utterance">${esc(item.utterance)}</p>

    <!-- ── Capa A ──────────────────────────────────────── -->
    <div id="block-layer-a" class="ficha-band" data-icap-layer="A">
      <h3 class="t-label ficha-band-title">Capa A · Geométrica</h3>

      ${geo ? `
        <div class="ficha-metric" data-icap-dim="A1">
          <span class="ficha-metric-name t-label">A1 · Grosor de trazo</span>
          <div class="ficha-bar-row">
            <div class="ficha-bar-track">
              <div class="ficha-bar-fill ${a1Blocked ? 'ficha-bar--veto' : 'ficha-bar--ok'}"
                   style="width:${Math.min(geo.stroke_pct * 2, 100)}%"></div>
              <div class="ficha-bar-threshold" style="left:${Math.min(a1Threshold * 2, 100)}%"
                   title="Umbral (propuesta sin calibrar)"></div>
            </div>
            <span class="ficha-metric-value t-mono-id">${geo.stroke_pct.toFixed(1)}%</span>
          </div>
          ${a1Blocked ? '<p class="ficha-veto-note t-caption">Veto duro: trazo por debajo del umbral.</p>' : ''}
        </div>

        <div class="ficha-metric" data-icap-dim="A2">
          <span class="ficha-metric-name t-label">A2 · Unidades desligadas</span>
          <span class="ficha-metric-value t-mono-id">${geo.unlinked_units}</span>
          <span class="t-caption ficha-metric-note">componentes conexas</span>
        </div>

        <div id="block-layer-a-lesser" class="ficha-metrics-lesser">
          <div class="ficha-metric" data-icap-dim="A3">
            <span class="ficha-metric-name t-label">A3 · Regiones cerradas</span>
            <span class="ficha-metric-value t-mono-id">${geo.closed_regions}</span>
            <span class="badge badge-outdated t-caption">advertencia</span>
          </div>
          <div class="ficha-metric" data-icap-dim="A4">
            <span class="ficha-metric-name t-label">A4 · Contorno inferido</span>
            <span class="ficha-metric-value t-mono-id">${geo.inferred_contour_pct.toFixed(1)}%</span>
            <span class="badge badge-outdated t-caption">hipótesis</span>
          </div>
        </div>
      ` : '<p class="t-caption ficha-pending">Geometría no calculada.</p>'}
    </div>

    <!-- ── Capa B ──────────────────────────────────────── -->
    <div id="block-layer-b" class="ficha-band" data-icap-layer="B">
      <h3 class="t-label ficha-band-title">Capa B · Psicofísica</h3>
      ${renderLayerB(item.id)}
    </div>

    <!-- ── Capa C ──────────────────────────────────────── -->
    <div id="block-layer-c" class="ficha-band" data-icap-layer="C">
      <h3 class="t-label ficha-band-title">Capa C · Interpretativa</h3>
      ${renderLayerC(item.id)}
    </div>

    <!-- ── Evidencia superada ──────────────────────────── -->
    ${superseded.length > 0 ? `
      <div id="block-superseded-evidence" class="ficha-band ficha-superseded">
        <h3 class="t-label ficha-band-title">Evidencia de versiones anteriores</h3>
        <p class="t-caption">${superseded.length} registro(s) sobre versiones anteriores del ítem.</p>
      </div>
    ` : ''}

    <div class="screen-actions">
      <button id="btn-ficha-back" class="btn-secondary">Volver al índice</button>
    </div>
  `

  el.querySelector('#btn-ficha-back')!.addEventListener('click', () => void navigate('item-index'))
  return el
}

function renderLayerB(itemId: string): string {
  const records = db.recordsByItem(itemId).filter(r => r.status === 'sealed')
  const measurements = records.flatMap(r => db.thresholdsByRecord(r.id))
  if (measurements.length === 0) return '<p class="t-caption ficha-pending">Sin mediciones de capa B.</p>'
  return measurements.map(m => `
    <div class="ficha-metric" data-icap-dim="${m.axis}">
      <span class="ficha-metric-name t-label">${m.axis === 'blur' ? 'B1 · Desenfoque' : m.axis === 'size' ? 'B2 · Tamaño' : 'B3 · Desplazamiento'}</span>
      ${m.status === 'completed' ? `
        <span class="ficha-metric-value t-mono-id">${m.threshold?.toFixed(1) ?? '—'}</span>
        <span class="t-caption ficha-metric-note">umbral · histéresis ${m.hysteresis?.toFixed(1) ?? '—'}</span>
      ` : `<span class="t-caption">${m.status}</span>`}
    </div>
  `).join('')
}

function renderLayerC(itemId: string): string {
  const DIMS = ['c1_semantic','c2_pragmatic','c3_cultural','c4_learnability'] as const
  const DIM_LABELS: Record<string, string> = {
    c1_semantic:     'C1 · Semántica',
    c2_pragmatic:    'C2 · Pragmática',
    c3_cultural:     'C3 · Cultural',
    c4_learnability: 'C4 · Aprendibilidad',
  }
  const records = db.recordsByItem(itemId).filter(r => r.status === 'sealed')
  if (records.length === 0) return '<p class="t-caption ficha-pending">Sin juicios registrados.</p>'

  return DIMS.map(dim => {
    const responses = records.flatMap(r => db.responsesByRecord(r.id).filter(d => d.dimension === dim))
    if (responses.length === 0) return `
      <div class="ficha-metric" data-icap-dim="${dim}">
        <span class="t-label">${DIM_LABELS[dim]}</span>
        <span class="t-caption ficha-pending">Sin datos</span>
      </div>`
    const scores = responses.filter(r => r.state === 'scored' && r.score !== undefined).map(r => r.score!)
    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null
    return `
      <div class="ficha-metric" data-icap-dim="${dim}">
        <span class="t-label">${DIM_LABELS[dim] ?? dim}</span>
        ${avg !== null ? `<span class="ficha-metric-value t-mono-id">${avg}</span><span class="t-caption ficha-metric-note">promedio de ${scores.length} respuesta(s)</span>` : ''}
        ${responses.filter(r => r.state !== 'scored').map(r =>
          `<span class="badge badge-outdated t-caption">${r.state}</span>`).join('')}
      </div>`
  }).join('')
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * #screen-aggregate ← AggregateView
 *
 * Diagnóstico de solo lectura. Las cinco celdas de cobertura son obligatorias
 * (NeverASingleNumber). Los registros aparecen en sección separada de las
 * estadísticas (EvidenceNeverMixed).
 */

import { navigate } from '../router.ts'
import { appState } from '../app-state.ts'
import { db } from '../../store.ts'

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-aggregate'
  el.setAttribute('data-screen-label', 'Agregado de la fuente')

  const sourceId = appState.sourceId
  if (!sourceId) {
    el.innerHTML = `<p class="t-body import-error" style="padding:var(--space-10)">Sin fuente activa.</p>`
    return el
  }

  const source  = db.sources.get(sourceId)
  const items   = db.itemsBySource(sourceId)
  const records = [...db.evaluationRecords.values()].filter(r => r.source_id === sourceId)
  const sealed  = records.filter(r => r.status === 'sealed')

  // Evaluadores únicos en registros sellados
  const evaluatorIds = new Set(sealed.map(r => {
    const session = db.evaluationSessions.get(r.session_id)
    return session?.evaluator_id ?? ''
  }).filter(Boolean))

  // Protocolos cubiertos
  const protocols = [...new Set(sealed.map(r => r.protocol_version))]
  // Contextos cubiertos
  const contexts  = [...new Set(sealed.map(r => {
    const session = db.evaluationSessions.get(r.session_id)
    return session ? `${session.context.target_population} / ${session.context.environment}` : ''
  }).filter(Boolean))]

  // Registros superados (content_hash distinto del ítem actual)
  const supersededCount = sealed.filter(r => {
    const item = db.items.get(r.item_id)
    return item && item.content_hash !== r.item_content_hash
  }).length

  el.innerHTML = `
    <header class="screen-header">
      <p class="t-label">Diagnóstico · agregado</p>
      <h2>${esc(source?.metadata.author ?? source?.external_id ?? sourceId)}</h2>
    </header>

    <!-- Las 5 celdas de cobertura (NeverASingleNumber) -->
    <div id="aggregate-coverage" class="aggregate-coverage">
      <div class="aggregate-cell">
        <span class="report-stat-value t-mono-id">${items.length}</span>
        <span class="t-label">ítems en la biblioteca</span>
      </div>
      <div class="aggregate-cell">
        <span class="report-stat-value t-mono-id">${new Set(sealed.map(r => r.item_id)).size}</span>
        <span class="t-label">ítems con al menos un registro</span>
      </div>
      <div class="aggregate-cell">
        <span class="report-stat-value t-mono-id">${evaluatorIds.size}</span>
        <span class="t-label">evaluadores</span>
      </div>
      <div class="aggregate-cell">
        <span class="report-stat-value t-mono-id">${sealed.length}</span>
        <span class="t-label">registros sellados</span>
      </div>
      <div class="aggregate-cell">
        <span class="report-stat-value t-mono-id">${supersededCount}</span>
        <span class="t-label">registros superados (versión anterior)</span>
      </div>
    </div>

    <div class="aggregate-meta">
      <div class="ficha-metric">
        <span class="t-label">Protocolos cubiertos</span>
        <span class="t-mono-id t-caption">${protocols.join(', ') || '—'}</span>
      </div>
      <div class="ficha-metric">
        <span class="t-label">Contextos cubiertos</span>
        <ul class="t-caption aggregate-contexts">
          ${contexts.length ? contexts.map(c => `<li>${esc(c)}</li>`).join('') : '<li>—</li>'}
        </ul>
      </div>
    </div>

    <!-- Registros — sección SEPARADA de las estadísticas (EvidenceNeverMixed) -->
    <div id="aggregate-records" class="ficha-band">
      <h3 class="t-label ficha-band-title">Registros sellados (${sealed.length})</h3>
      ${sealed.length === 0
        ? '<p class="t-caption ficha-pending">Sin registros sellados aún.</p>'
        : `<ul class="findings-list">
            ${sealed.slice(0, 50).map(r => {
              const item = db.items.get(r.item_id)
              return `<li class="finding-row">
                <span class="t-mono-id">${esc(r.id.slice(0, 8))}</span>
                <span class="t-body-sm">${esc(item?.utterance ?? r.item_id)}</span>
                <span class="t-caption">${r.protocol_version}</span>
              </li>`
            }).join('')}
            ${sealed.length > 50 ? `<li class="t-caption">… y ${sealed.length - 50} más.</li>` : ''}
          </ul>`}
    </div>

    <div class="screen-actions">
      <button id="btn-agg-back" class="btn-secondary">Volver al índice</button>
    </div>
  `

  el.querySelector('#btn-agg-back')!.addEventListener('click', () => void navigate('item-index'))
  return el
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * #screen-family-report ← FamilyReportView
 *
 * Diagnóstico de solo lectura — propiedades D de la biblioteca completa.
 *
 * Garantías implementadas:
 *   NoSingleAggregate  — sin puntaje único
 *   PairDistributionReported — distribución completa de pares, no solo la cola
 *
 * El plano de familia (D1 × D2) es la figura de portada. Cuando no hay datos
 * calculados aún, se explica que son deterministas y se calculan en la ingesta.
 */

import { navigate } from '../router.ts'
import { appState } from '../app-state.ts'
import { db } from '../../store.ts'

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-family-report'
  el.setAttribute('data-screen-label', 'Informe de familia')

  const sourceId = appState.sourceId
  if (!sourceId) {
    el.innerHTML = `<p class="t-body import-error" style="padding:var(--space-10)">Sin fuente activa.</p>`
    return el
  }

  const source = db.sources.get(sourceId)
  const familyReport = [...db.familyReports.values()].find(f => f.source_id === sourceId)
  const pairs = familyReport ? db.pairsByFamily(familyReport.id) : []

  el.innerHTML = `
    <header class="screen-header">
      <p class="t-label">Diagnóstico · familia</p>
      <h2>Informe de familia</h2>
      <p class="t-body">Propiedades de capa D: confusabilidad y consistencia sobre la biblioteca completa. Se calculan determinísticamente en la ingesta.</p>
    </header>

    ${familyReport ? `
      <!-- ── Plano D1 × D2 ── (figura de portada) -->
      <div id="family-plane" class="ficha-band" data-icap-layer="D">
        <h3 class="t-label ficha-band-title">Plano de confusabilidad × consistencia</h3>
        <div class="family-plane-stats">
          <div class="aggregate-cell" data-icap-dim="D1">
            <span class="report-stat-value t-mono-id">${familyReport.pair_median_r.toFixed(3)}</span>
            <span class="t-label">D1 · mediana r de pares</span>
          </div>
          <div class="aggregate-cell" data-icap-dim="D1">
            <span class="report-stat-value t-mono-id">${familyReport.pair_p90_r.toFixed(3)}</span>
            <span class="t-label">D1 · p90 r de pares</span>
          </div>
          <div class="aggregate-cell" data-icap-dim="D1">
            <span class="report-stat-value t-mono-id">${familyReport.critical_r_cutoff.toFixed(3)}</span>
            <span class="t-label">D1 · corte crítico (derivado de la distribución)</span>
          </div>
        </div>
        <div class="family-plane-stats" style="margin-top:var(--space-4)">
          <div class="aggregate-cell" data-icap-dim="D2">
            <span class="report-stat-value t-mono-id">${familyReport.cv_stroke_pct.toFixed(1)}%</span>
            <span class="t-label">D2 · CV grosor de trazo</span>
          </div>
          <div class="aggregate-cell" data-icap-dim="D2">
            <span class="report-stat-value t-mono-id">${familyReport.cv_head_pct.toFixed(1)}%</span>
            <span class="t-label">D2 · CV área de cabeza</span>
          </div>
          <div class="aggregate-cell" data-icap-dim="D2">
            <span class="report-stat-value t-mono-id">${familyReport.cv_entropy_pct.toFixed(1)}%</span>
            <span class="t-label">D2 · CV entropía</span>
          </div>
        </div>
      </div>

      <!-- ── Distribución de pares (PairDistributionReported) ── -->
      <div id="pair-distribution" class="ficha-band">
        <h3 class="t-label ficha-band-title">Distribución de pares (${pairs.length} pares)</h3>
        ${pairs.length === 0
          ? '<p class="t-caption ficha-pending">Sin pares calculados.</p>'
          : renderPairHistogram(pairs, familyReport.critical_r_cutoff)}
      </div>

      <!-- ── D3 Fragilidad ── -->
      <div id="family-fragility" class="ficha-band" data-icap-dim="D3">
        <h3 class="t-label ficha-band-title">D3 · Fragilidad</h3>
        <p class="t-caption">Ordenamiento diagnóstico — sin criterio de corte. Se reporta como perfil.</p>
        ${pairs.length > 0 ? `
          <ul class="findings-list">
            ${pairs.sort((a, b) => b.r - a.r).slice(0, 10).map(p => {
              const ia = db.items.get(p.item_a_id)
              const ib = db.items.get(p.item_b_id)
              const blocked = p.r >= familyReport.critical_r_cutoff
              return `<li class="finding-row">
                <span class="t-mono-id">${p.r.toFixed(3)}</span>
                <span class="t-body-sm">${esc(ia?.utterance ?? '?')} — ${esc(ib?.utterance ?? '?')}</span>
                ${blocked ? '<span class="badge badge-error t-caption">veto D1</span>' : ''}
              </li>`
            }).join('')}
          </ul>
        ` : ''}
      </div>
    ` : `
      <div class="ficha-band">
        <p class="t-body ficha-pending">
          El informe de familia no está disponible. Las métricas D se calculan automáticamente en la ingesta;
          si no aparecen, la fuente importada aún no pasó por el análisis de familia.
        </p>
      </div>
    `}

    <div class="screen-actions">
      <button id="btn-family-back" class="btn-secondary">Volver al índice</button>
    </div>
  `

  el.querySelector('#btn-family-back')!.addEventListener('click', () => void navigate('item-index'))
  return el
}

function renderPairHistogram(
  pairs: Array<{ r: number }>,
  cutoff: number,
): string {
  // Histograma simple en 10 bins de 0 a 1
  const bins = Array.from({ length: 10 }, (_, i) => ({ min: i * 0.1, max: (i + 1) * 0.1, count: 0 }))
  for (const p of pairs) {
    const idx = Math.min(Math.floor(p.r * 10), 9)
    bins[idx]!.count++
  }
  const maxCount = Math.max(...bins.map(b => b.count), 1)

  return `
    <div class="pair-histogram" role="img" aria-label="Histograma de correlaciones entre pares">
      ${bins.map(bin => {
        const pct = (bin.count / maxCount * 100).toFixed(0)
        const isCritical = bin.min >= cutoff
        return `
          <div class="pair-bin ${isCritical ? 'pair-bin--critical' : ''}">
            <div class="pair-bin-bar" style="height:${pct}%" title="${bin.count} pares"></div>
            <span class="pair-bin-label t-caption">${bin.min.toFixed(1)}</span>
          </div>`
      }).join('')}
    </div>
    <p class="t-caption" style="margin-top:var(--space-2)">
      Corte crítico: r ≥ <span class="t-mono-id">${cutoff.toFixed(3)}</span>
      — derivado de la distribución, no fijo.
    </p>
  `
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

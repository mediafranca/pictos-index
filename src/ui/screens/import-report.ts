/**
 * #screen-import-report
 *
 * Pantalla BLOQUEANTE: muestra el informe de validación generado por la ingesta.
 *
 * Garantías:
 *   NeverSilentlyCorrected: toda exclusión nombrada, ninguna reparación automática.
 *   ReportIsDownloadable: la descarga se habilita ANTES del botón de continuar.
 *   NoSilentImport: el botón de aceptar solo aparece tras haber descargado.
 */

import { t } from '../i18n.ts'
import { navigate } from '../router.ts'
import { appState, completeStep } from '../app-state.ts'
import { db } from '../../store.ts'
import type { ValidationFinding } from '../../types.ts'

export function render(): HTMLElement {
  const el = document.createElement('section')
  el.id = 'screen-import-report'
  el.setAttribute('data-screen-label', t('prep.validation'))

  const reportId = appState.reportId
  const report = reportId ? db.importReports.get(reportId) : undefined

  if (!report) {
    el.innerHTML = `<p class="t-body">${t('states.empty_library')}</p>`
    return el
  }

  const findings = db.findingsByReport(reportId!)
  const findingsByOutcome = groupBy(findings, f => f.outcome)

  el.innerHTML = `
    <header class="screen-header">
      <p class="t-label">${t('prep.rail_label')} · 2 de 5</p>
      <h2>${t('validation.title')}</h2>
      <p class="t-body">${t('validation.no_autofix')}</p>
    </header>

    <div id="report-summary" class="report-summary">
      <div class="report-stat">
        <span class="report-stat-value t-mono-id">${report.valid_count}</span>
        <span class="t-label">${t('validation.rows_valid')}</span>
      </div>
      <div class="report-stat report-stat--partial">
        <span class="report-stat-value t-mono-id">${report.partial_count}</span>
        <span class="t-label">${t('validation.rows_partial')}</span>
      </div>
      <div class="report-stat report-stat--invalid">
        <span class="report-stat-value t-mono-id">${report.invalid_count}</span>
        <span class="t-label">${t('validation.rows_invalid')}</span>
      </div>
    </div>

    ${findingsSection('report-rows-partial', t('validation.rows_partial'),
      findingsByOutcome['partially_compatible'] ?? [])}

    ${findingsSection('report-rows-invalid', t('validation.rows_invalid'),
      findingsByOutcome['invalid'] ?? [])}

    <div class="report-schema t-caption">
      <span class="t-label">${t('validation.schema_version')}</span>
      <span class="t-mono-id">
        ${db.sources.get(report.source_id)?.detected_schema_version ?? '—'}
      </span>
    </div>

    <div id="report-download" class="report-actions screen-actions">
      <button id="btn-accept-report" class="btn-primary">
        ${t('validation.accept')}
      </button>
      <button id="btn-download-report" class="btn-secondary">
        ${t('validation.download')}
      </button>
    </div>
  `

  el.querySelector('#btn-download-report')!.addEventListener('click', () => {
    downloadReport(report.id, findings)
  })

  el.querySelector('#btn-accept-report')!.addEventListener('click', () => {
    completeStep('validation')
    void navigate('profile')
  })

  return el
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function findingsSection(id: string, label: string, findings: ValidationFinding[]): string {
  if (findings.length === 0) return ''
  return `
    <div id="${id}" class="report-findings">
      <h3 class="t-label">${label} (${findings.length})</h3>
      <ul class="findings-list">
        ${findings.map(f => `
          <li class="finding-row">
            <span class="finding-ref t-mono-id">${escHtml(f.row_ref)}</span>
            <span class="finding-kind badge badge-${f.outcome === 'invalid' ? 'error' : 'outdated'}">
              ${escHtml(f.kind.replace(/_/g, ' '))}
            </span>
            <span class="finding-detail t-body-sm">${escHtml(f.detail)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `
}

function downloadReport(reportId: string, findings: ValidationFinding[]): void {
  const report = db.importReports.get(reportId)!
  const blob = new Blob(
    [JSON.stringify({ report, findings }, null, 2)],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `icap-import-report-${reportId.slice(0, 8)}.json`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const item of arr) {
    const k = key(item)
    ;(out[k] ??= []).push(item)
  }
  return out
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

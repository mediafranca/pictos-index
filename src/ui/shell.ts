/**
 * ICAP v2 — App shell
 *
 * Renderiza las regiones permanentes: #site-header (con wordmark y prep-rail)
 * y #site-footer. El #screen-root es el slot dinámico que el router rellena.
 *
 * El prep-rail avanza pero no retrocede; escucha 'icap:screen-change' para
 * actualizarse cuando el router cambia de pantalla.
 */

import { t } from './i18n.ts'
import { initRouter, type ScreenName } from './router.ts'
import { isNavigable } from './app-state.ts'

type PrepStep = 'source' | 'validation' | 'profile' | 'context' | 'calibration'

const PREP_STEPS: Array<{ id: PrepStep; label: string; screen: ScreenName }> = [
  { id: 'source',      label: t('prep.source'),      screen: 'source-import' },
  { id: 'validation',  label: t('prep.validation'),  screen: 'import-report' },
  { id: 'profile',     label: t('prep.profile'),      screen: 'profile' },
  { id: 'context',     label: t('prep.context'),      screen: 'context' },
  { id: 'calibration', label: t('prep.calibration'),  screen: 'calibration' },
]

/** Pantallas que pertenecen al prep-rail (y hasta cuál paso las habilitan) */
const SCREEN_STEP: Partial<Record<ScreenName, PrepStep>> = {
  'source-import':  'source',
  'import-report':  'validation',
  'profile':        'profile',
  'context':        'context',
  'calibration':    'calibration',
}

export function renderShell(root: HTMLElement): void {
  root.innerHTML = `
    <header id="site-header" role="banner">
      <div id="brand-area">
        <a href="#" id="brand-link" aria-label="${t('brand.name')} — ${t('brand.tagline')}">
          <span class="t-brand">${t('brand.name')}</span>
          <span class="t-brand-tagline">${t('brand.tagline')}</span>
        </a>
      </div>
      <nav id="prep-rail" aria-label="${t('prep.rail_label')}">
        ${PREP_STEPS.map((s, i) => `
          <div id="prep-step-${s.id}" class="prep-step" data-step="${s.id}" data-index="${i}" aria-current="false">
            <span class="prep-step-dot"></span>
            <span class="prep-step-label t-label">${s.label}</span>
          </div>
        `).join('')}
      </nav>
      <div id="diagnostics-entry" hidden>
        <a href="#" class="t-label diagnostics-link">${t('prep.diagnostics_available')}</a>
      </div>
    </header>

    <main id="screen-root" tabindex="-1"></main>

    <footer id="site-footer" role="contentinfo">
      <div id="footer-credits" class="t-caption">
        ${t('brand.network')}
      </div>
      <nav id="footer-links" aria-label="Recursos">
        <a href="#" data-nav="methodology" class="footer-link t-caption">${t('footer.methodology')}</a>
        <a href="#" data-nav="thresholds" class="footer-link t-caption">${t('footer.schema')}</a>
        <a href="#" data-nav="export" class="footer-link t-caption">${t('footer.repository')}</a>
      </nav>
      <div id="footer-versions" class="t-mono-id">
        <span>${t('footer.schema')} 2.0</span>
      </div>
    </footer>
  `

  const screenRoot = root.querySelector<HTMLElement>('#screen-root')!
  initRouter(screenRoot)

  // Prep-rail: escucha cambios de pantalla para actualizar el estado visual
  const rail = root.querySelector<HTMLElement>('#prep-rail')!
  rail.addEventListener('icap:screen-change', (e) => {
    const { screen } = (e as CustomEvent<{ screen: ScreenName }>).detail
    updatePrepRail(rail, screen)
  })

  // Hacer cada paso del rail navegable cuando corresponda
  PREP_STEPS.forEach(step => {
    const stepEl = rail.querySelector<HTMLElement>(`#prep-step-${step.id}`)!
    stepEl.setAttribute('role', 'button')
    stepEl.setAttribute('tabindex', '0')
    stepEl.addEventListener('click', () => {
      if (isNavigable(step.id)) {
        void import('./router.ts').then(m => m.navigate(step.screen))
      }
    })
    stepEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (isNavigable(step.id)) {
          void import('./router.ts').then(m => m.navigate(step.screen))
        }
      }
    })
  })

  // Footer nav
  root.querySelectorAll<HTMLAnchorElement>('[data-nav]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      const screen = a.dataset['nav'] as ScreenName
      if (screen) void import('./router.ts').then(m => m.navigate(screen))
    })
  })

  // Brand link → home
  root.querySelector('#brand-link')!.addEventListener('click', (e) => {
    e.preventDefault()
    void import('./router.ts').then(m => m.navigate('home'))
  })
}

/** Marca el paso actual en el prep-rail; no retroced. */
function updatePrepRail(rail: HTMLElement, screen: ScreenName): void {
  const currentStep = SCREEN_STEP[screen]
  if (!currentStep) return  // pantallas fuera del prep-rail no actualizan el indicador

  const steps = rail.querySelectorAll<HTMLElement>('.prep-step')
  const currentIndex = PREP_STEPS.findIndex(s => s.id === currentStep)

  steps.forEach((el, i) => {
    el.removeAttribute('aria-current')
    el.classList.remove('prep-step--done', 'prep-step--current', 'prep-step--pending')
    if (i < currentIndex) {
      el.classList.add('prep-step--done')
    } else if (i === currentIndex) {
      el.classList.add('prep-step--current')
      el.setAttribute('aria-current', 'step')
    } else {
      el.classList.add('prep-step--pending')
    }
  })
}

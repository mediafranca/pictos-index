/**
 * ICAP v2 — Router
 *
 * navigate(screen) monta la pantalla correspondiente en #screen-root y
 * actualiza el prep-rail. Cada pantalla es una función que devuelve un HTMLElement.
 *
 * No hay history API: la navegación dentro de la tarea de evaluación es
 * lineal y bloqueante; un hash de URL no aporta nada aquí.
 */

export type ScreenName =
  | 'home'
  | 'source-import'
  | 'import-report'
  | 'profile'
  | 'context'
  | 'calibration'
  | 'item-index'
  | 'spontaneous-comprehension'
  | 'phrase-correspondence'
  | 'judgment'
  | 'threshold-task'
  | 'item-ficha'
  | 'family-report'
  | 'aggregate'
  | 'methodology'
  | 'thresholds'
  | 'export'

let screenRoot: HTMLElement | null = null

export function initRouter(root: HTMLElement): void {
  screenRoot = root
}

/**
 * Navega a una pantalla. Destruye la pantalla anterior (sin persistir nada),
 * monta la nueva en #screen-root y actualiza el prep-rail.
 */
export async function navigate(screen: ScreenName): Promise<void> {
  if (!screenRoot) return

  // Lazy import para no bloquear el primer render
  const module = await screenModule(screen)
  const el = module.render()

  screenRoot.innerHTML = ''
  screenRoot.appendChild(el)

  // Actualizar el prep-rail si hay uno montado
  document.getElementById('prep-rail')?.dispatchEvent(
    new CustomEvent('icap:screen-change', { detail: { screen } }),
  )

  // Scroll al inicio al cambiar de pantalla
  window.scrollTo({ top: 0 })
}

async function screenModule(screen: ScreenName): Promise<{ render(): HTMLElement }> {
  switch (screen) {
    case 'home':                    return import('./screens/home.ts')
    case 'source-import':           return import('./screens/source-import.ts')
    case 'import-report':           return import('./screens/import-report.ts')
    case 'profile':                 return import('./screens/profile.ts')
    case 'context':                 return import('./screens/context.ts')
    case 'calibration':             return import('./screens/calibration.ts')
    case 'item-index':              return import('./screens/item-index.ts')
    case 'spontaneous-comprehension': return import('./screens/spontaneous-comprehension.ts')
    case 'phrase-correspondence':   return import('./screens/phrase-correspondence.ts')
    case 'judgment':                return import('./screens/judgment.ts')
    case 'threshold-task':          return import('./screens/threshold-task.ts')
    case 'item-ficha':              return import('./screens/item-ficha.ts')
    case 'family-report':           return import('./screens/family-report.ts')
    case 'aggregate':               return import('./screens/aggregate.ts')
    case 'methodology':             return import('./screens/methodology.ts')
    case 'thresholds':              return import('./screens/thresholds.ts')
    case 'export':                  return import('./screens/export.ts')
  }
}

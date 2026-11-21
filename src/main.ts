/**
 * ICAP v2 — Entry point
 *
 * Monta el app-shell y navega a la pantalla de inicio.
 * Toda la lógica de dominio es importada bajo demanda por cada pantalla.
 */

import '../styles/variables.css'
import './ui/shell.css'
import { renderShell } from './ui/shell.ts'
import { navigate } from './ui/router.ts'

const root = document.getElementById('app-shell')
if (!root) throw new Error('No se encontró #app-shell en el DOM.')

renderShell(root)
void navigate('home')

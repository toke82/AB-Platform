import { getPublishedCode } from '@/lib/db/scripts'

export const dynamic = 'force-dynamic'

interface Params {
  params: { id: string }
}

/**
 * GET /p/:id.js
 *
 * Endpoint público — devuelve JavaScript puro.
 * - Content-Type: application/javascript
 * - CORS abierto: cualquier dominio puede cargar el script
 * - El código se envuelve en IIFE para no contaminar el scope global
 * - Cache de 60s (ajustable según necesidades)
 */
export async function GET(_req: Request, { params }: Params) {
  // El id puede venir como "abc123.js" — limpiar la extensión
  const id = params.id.replace(/\.js$/, '')

  const code = await getPublishedCode(id)

  if (code === null) {
    return new Response('// Script not found or not published\n', {
      status: 404,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  // Envolver en IIFE:
  // 1. Aísla el scope: no contamina window con variables locales del script
  // 2. try/catch: errores del script no rompen la página host
  // 3. 'use strict': previene bugs silenciosos
  const wrapped = `(function() {
  'use strict';
  try {
${code}
  } catch (e) {
    console.error('[AB Platform] Script error:', e);
  }
})();`

  return new Response(wrapped, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
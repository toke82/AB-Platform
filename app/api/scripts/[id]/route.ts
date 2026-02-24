import { NextResponse } from 'next/server'
import { getScript, saveDraft } from '@/lib/db/scripts'
import type { SaveDraftRequest } from '@/lib/types'

interface Params {
  params: { id: string }
}

// GET /api/scripts/:id
export async function GET(_req: Request, { params }: Params) {
  const script = await getScript(params.id)
  if (!script) {
    return NextResponse.json({ error: 'Script not found' }, { status: 404 })
  }
  return NextResponse.json(script)
}

// PUT /api/scripts/:id — save draft
export async function PUT(req: Request, { params }: Params) {
  let body: SaveDraftRequest

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.code !== 'string') {
    return NextResponse.json({ error: '`code` is required' }, { status: 400 })
  }

  try {
    const updated = await saveDraft(params.id, body)
    return NextResponse.json({
      id: updated.id,
      updated_at: updated.updated_at,
      status: updated.status,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}
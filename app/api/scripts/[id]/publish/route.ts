import { NextResponse } from 'next/server'
import { publishScript, getScript } from '@/lib/db/scripts'

interface Params {
  params: { id: string }
}

// POST /api/scripts/:id/publish
export async function POST(_req: Request, { params }: Params) {
  // Verify that the script exists before publishing
  const existing = await getScript(params.id)
  if (!existing) {
    return NextResponse.json({ error: 'Script not found' }, { status: 404 })
  }

  try {
    const published = await publishScript(params.id)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

    return NextResponse.json({
      id: published.id,
      public_url: `${appUrl}/p/${published.id}.js`,
      published_at: published.published_at,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to publish script' }, { status: 500 })
  }
}
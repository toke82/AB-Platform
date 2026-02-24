import { NextResponse } from 'next/server'
import { createScript, listScripts } from '@/lib/db/scripts'

// GET /api/scripts — list all scripts
export async function GET() {
  try {
    const scripts = await listScripts()
    return NextResponse.json(scripts)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 })
  }
}

// POST /api/scripts — create a blank script
export async function POST() {
  try {
    const script = await createScript()
    return NextResponse.json(script, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create script' }, { status: 500 })
  }
}
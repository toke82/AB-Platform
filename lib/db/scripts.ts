/**
 * lib/db/scripts.ts
 *
 * Single source of queries to Supabase.
 * API Routes only parse request/response — data logic lives here.
 * Import ONLY from API Routes (server-side), never from client components.
 */

import { getServiceClient } from '@/lib/supabase'
import type { Script, SaveDraftRequest } from '@/lib/types'

function db() {
  return getServiceClient()
}

export async function listScripts(): Promise<Script[]> {
  const { data, error } = await db()
    .from('scripts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getScript(id: string): Promise<Script | null> {
  const { data, error } = await db()
    .from('scripts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createScript(): Promise<Script> {
  const { data, error } = await db()
    .from('scripts')
    .insert({ title: 'Untitled Script', code: '', status: 'draft' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function saveDraft(id: string, payload: SaveDraftRequest): Promise<Script> {
  const { data, error } = await db()
    .from('scripts')
    .update({
      ...(payload.title !== undefined && { title: payload.title }),
      code: payload.code,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function publishScript(id: string): Promise<Script> {
  const { data, error } = await db()
    .from('scripts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Devuelve SOLO el código de un script publicado.
 * Si no existe o no está publicado, devuelve null.
 */
export async function getPublishedCode(id: string): Promise<string | null> {
  const { data } = await db()
    .from('scripts')
    .select('code')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  return data?.code ?? null
}
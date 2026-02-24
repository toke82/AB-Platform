'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Script, PublishResponse } from '@/lib/types'
import PublishDialog from '@/components/PublishDialog'
import styles from './page.module.css'

const ScriptEditor = dynamic(() => import('@/components/ScriptEditor'), { ssr: false })

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function EditorPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string)
  const router = useRouter()

  const [script, setScript] = useState<Script | null>(null)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<PublishResponse | null>(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    if (!id) {
      return
    }

    setLoading(true)

    fetch(`/api/scripts/${id}`)
      .then((r) => {
        if (!r.ok) { router.push('/'); return null }
        return r.json()
      })
      .then((data: Script | null) => {
        if (!data) return
        setScript(data)
        setCode(data.code)
        setTitle(data.title)
      })
      .catch(() => {
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  const handleSave = useCallback(async () => {
    setSaveState('saving')
    try {
      const res = await fetch(`/api/scripts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, title }),
      })
      if (!res.ok) throw new Error()
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
    }
  }, [id, code, title])

  const handlePublish = async () => {
    await handleSave()
    setPublishing(true)
    try {
      const res = await fetch(`/api/scripts/${id}/publish`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data: PublishResponse = await res.json()
      setPublishResult(data)
      setScript((prev) => prev ? { ...prev, status: 'published', published_at: data.published_at } : prev)
    } catch {
      alert('Failed to publish. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  if (loading) {
    return <div className={styles.loading}>Loading editor…</div>
  }

  if (!script) return null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push('/')}>
          ← Back
        </button>

        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Script title"
          maxLength={100}
        />

        <div className={styles.headerActions}>
          <span className={`${styles.badge} ${styles[script.status]}`}>
            {script.status}
          </span>

          {saveState === 'saving' && <span className={styles.saveHint}>Saving…</span>}
          {saveState === 'saved' && <span className={`${styles.saveHint} ${styles.saved}`}>Saved ✓</span>}
          {saveState === 'error' && <span className={`${styles.saveHint} ${styles.error}`}>Error saving</span>}

          <button className={styles.btnSecondary} onClick={handleSave} disabled={saveState === 'saving'}>
            Save Draft
          </button>
          <button className={styles.btnPrimary} onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </header>

      <div className={styles.editorWrapper}>
        <ScriptEditor value={code} onChange={setCode} />
      </div>

      {publishResult && (
        <PublishDialog
          url={publishResult.public_url}
          onClose={() => setPublishResult(null)}
        />
      )}
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Script } from '@/lib/types'
import ScriptList from '@/components/ScriptList'
import styles from './page.module.css'

export default function HomePage() {
  const router = useRouter()
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then(setScripts)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    setCreating(true)
    const res = await fetch('/api/scripts', { method: 'POST' })
    const script: Script = await res.json()
    router.push(`/editor/${script.id}`)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoDot} />
            <span>AB Platform</span>
          </div>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : '+ New Script'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Scripts</h1>

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : scripts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No scripts yet.</p>
            <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>
              Create your first script
            </button>
          </div>
        ) : (
          <ScriptList scripts={scripts} />
        )}
      </main>
    </div>
  )
}
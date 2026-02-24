'use client'

import { useRouter } from 'next/navigation'
import type { Script } from '@/lib/types'
import styles from './ScriptList.module.css'

interface Props {
  scripts: Script[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ScriptList({ scripts }: Props) {
  const router = useRouter()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return (
    <div className={styles.list}>
      {scripts.map((script) => (
        <div
          key={script.id}
          className={styles.item}
          onClick={() => router.push(`/editor/${script.id}`)}
        >
          <div className={styles.itemLeft}>
            <span className={`${styles.badge} ${styles[script.status]}`}>
              {script.status}
            </span>
            <div>
              <p className={styles.itemTitle}>{script.title || 'Untitled'}</p>
              <p className={styles.itemMeta}>
                Updated {formatDate(script.updated_at)}
                {script.published_at && ` · Published ${formatDate(script.published_at)}`}
              </p>
            </div>
          </div>

          {script.status === 'published' && (
            <code
              className={styles.url}
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(`${appUrl}/p/${script.id}.js`)
              }}
              title="Click to copy"
            >
              /p/{script.id}.js
            </code>
          )}
        </div>
      ))}
    </div>
  )
}
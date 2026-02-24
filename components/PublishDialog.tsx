'use client'

import { useState } from 'react'
import styles from './PublishDialog.module.css'

interface Props {
  url: string
  onClose: () => void
}

export default function PublishDialog({ url, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scriptTag = `<script src="${url}"></script>`

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.title}>Script published!</h2>
          <p className={styles.subtitle}>
            Your script is live. Inject it in any webpage with a script tag.
          </p>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Public URL</label>
          <div className={styles.codeRow}>
            <code className={styles.code}>{url}</code>
            <button className={styles.copyBtn} onClick={() => copy(url)}>
              Copy
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Script tag</label>
          <div className={styles.codeRow}>
            <code className={styles.code}>{scriptTag}</code>
            <button className={styles.copyBtn} onClick={() => copy(scriptTag)}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
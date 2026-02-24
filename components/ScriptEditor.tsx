'use client'

import Editor from '@monaco-editor/react'

interface Props {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export default function ScriptEditor({ value, onChange, readOnly = false }: Props) {
  return (
    <Editor
      height="100%"
      defaultLanguage="javascript"
      value={value}
      theme="vs-dark"
      onChange={(val) => onChange(val ?? '')}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        readOnly,
        automaticLayout: true,
        padding: { top: 16 },
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        tabSize: 2,
      }}
    />
  )
}
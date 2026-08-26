import { useRef, useState, type ChangeEvent } from 'react'
import {
  exportFilename,
  jsonTemplate,
  parseJsonLog,
  serializeEntries,
} from '../jsonData'
import type { FoodEntry } from '../types'

type Props = {
  entries: FoodEntry[]
  onImport: (incoming: FoodEntry[]) => { added: number; skipped: number }
  onImported?: () => void
}

function decodeText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes)
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes)
  }
  const start = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0
  return new TextDecoder('utf-8').decode(bytes.subarray(start))
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

export function DataPanel({ entries, onImport, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [paste, setPaste] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function applyRaw(raw: string) {
    const result = parseJsonLog(raw)
    if (!result.ok) {
      setMessage('')
      setError(result.error)
      return
    }
    const { added, skipped } = onImport(result.entries)
    const extraSkip = skipped + result.skipped
    const parts = [`Imported ${added} item${added === 1 ? '' : 's'}`]
    if (extraSkip > 0) {
      parts.push(`skipped ${extraSkip} duplicate or invalid`)
    }
    setError('')
    setMessage(parts.join(', ') + '.')
    setPaste('')
    onImported?.()
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    void file
      .arrayBuffer()
      .then((buffer) => applyRaw(decodeText(buffer)))
      .catch(() => {
        setError('Could not read that file.')
        setMessage('')
      })
  }

  function handleExport() {
    if (entries.length === 0) {
      setError('Nothing to export yet.')
      setMessage('')
      return
    }
    const blob = new Blob([serializeEntries(entries)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = exportFilename()
    link.click()
    URL.revokeObjectURL(url)
    setError('')
    setMessage(`Exported ${entries.length} item${entries.length === 1 ? '' : 's'}.`)
  }

  async function handleCopyTemplate() {
    const template = jsonTemplate()
    const copied = await copyText(template)
    if (!paste.trim()) setPaste(template)
    setError('')
    setMessage(copied ? 'Template copied.' : 'Could not copy. Template inserted below.')
  }

  return (
    <div className="data-io">
      <p className="muted">
        Import JSON grouped by day, then by meal. Duplicate rows are skipped.
      </p>
      <div className="io-actions">
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleFile}
        />
        <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>
          Import file
        </button>
        <button type="button" className="ghost" onClick={handleExport}>
          Export
        </button>
      </div>
      <label className="paste-label">
        Or paste JSON
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={6}
          placeholder={jsonTemplate()}
        />
      </label>
      <div className="io-actions">
        <button type="button" className="ghost" onClick={() => void handleCopyTemplate()}>
          Copy template
        </button>
        <button
          type="button"
          className="ghost"
          disabled={!paste.trim()}
          onClick={() => applyRaw(paste)}
        >
          Import pasted
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="muted">{message}</p> : null}
    </div>
  )
}

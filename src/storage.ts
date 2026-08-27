import { parseJsonLog, serializeEntries } from './jsonData'
import type { FoodEntry } from './types'

export async function loadEntries(): Promise<FoodEntry[]> {
  const response = await fetch('/api/meals')
  if (!response.ok) {
    throw new Error(`Could not load meals (${response.status}).`)
  }
  const text = await response.text()
  const parsed = parseJsonLog(text, { allowEmpty: true })
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }
  return parsed.entries
}

export async function saveEntries(entries: FoodEntry[]): Promise<void> {
  const response = await fetch('/api/meals', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: serializeEntries(entries, { includeIds: true }),
  })
  if (!response.ok) {
    throw new Error(`Could not save meals (${response.status}).`)
  }
}

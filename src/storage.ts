import type { FoodEntry } from './types'

const KEY = 'daily-health.entries.v1'

export function loadEntries(): FoodEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isFoodEntry).map((entry) => ({
      ...entry,
      time: typeof entry.time === 'string' ? entry.time : '',
      createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : entry.date,
    }))
  } catch {
    return []
  }
}

export function saveEntries(entries: FoodEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

function isFoodEntry(value: unknown): value is FoodEntry {
  if (typeof value !== 'object' || value === null) return false
  const e = value as Record<string, unknown>
  return (
    typeof e.id === 'string' &&
    typeof e.date === 'string' &&
    typeof e.meal === 'string' &&
    typeof e.food === 'string' &&
    typeof e.quantity === 'string' &&
    typeof e.calories === 'number' &&
    typeof e.protein === 'number' &&
    typeof e.carbs === 'number' &&
    typeof e.fat === 'number'
  )
}

import { parseFlexibleDate, parseFlexibleTime, todayISO } from './dates'
import { groupByDay, newId } from './nutrition'
import type { FoodEntry } from './types'

export type JsonImportResult =
  | { ok: true; entries: FoodEntry[]; skipped: number }
  | { ok: false; error: string }

export function entryFingerprint(entry: {
  date: string
  time: string
  meal: string
  food: string
  quantity: string
}): string {
  return `${entry.date}|${entry.time}|${entry.meal}|${entry.food}|${entry.quantity}`
}

export function parseJsonLog(raw: string): JsonImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(normalizeJsonText(raw))
  } catch (error) {
    const detail = error instanceof Error ? error.message : ''
    return {
      ok: false,
      error: detail
        ? `That file is not valid JSON (${detail}).`
        : 'That file is not valid JSON.',
    }
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      error: 'JSON must be an array of days, each with meals and entries.',
    }
  }

  const entries: FoodEntry[] = []
  let skipped = 0

  for (const day of parsed) {
    if (!isRecord(day) || !Array.isArray(day.meals)) {
      skipped += 1
      continue
    }
    const date = parseFlexibleDate(day.date)
    if (!date) {
      skipped += 1
      continue
    }

    for (const mealGroup of day.meals) {
      if (!isRecord(mealGroup) || !Array.isArray(mealGroup.entries)) {
        skipped += 1
        continue
      }
      const meal = asText(mealGroup.meal)
      if (!meal) {
        skipped += 1
        continue
      }
      const time = parseFlexibleTime(mealGroup.time)

      for (const item of mealGroup.entries) {
        if (!isRecord(item)) {
          skipped += 1
          continue
        }
        const food = asText(item.food)
        if (!food) {
          skipped += 1
          continue
        }
        entries.push({
          id: newId(),
          date,
          time,
          meal,
          food,
          quantity: asText(item.quantity),
          calories: asNumber(item.calories),
          protein: asNumber(item.protein),
          carbs: asNumber(item.carbs),
          fat: asNumber(item.fat),
          createdAt: new Date().toISOString(),
        })
      }
    }
  }

  if (entries.length === 0) {
    return { ok: false, error: 'No valid food items found in this JSON.' }
  }

  return { ok: true, entries, skipped }
}

function toExportFood(entry: FoodEntry) {
  return {
    food: entry.food,
    quantity: entry.quantity,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
  }
}

export function serializeEntries(entries: FoodEntry[]): string {
  const days = [...groupByDay(entries)].sort((a, b) => a.date.localeCompare(b.date))
  const payload = days.map((day) => ({
    date: day.date,
    meals: day.meals.map((meal) => ({
      meal: meal.meal,
      time: meal.time,
      entries: meal.entries.map(toExportFood),
    })),
  }))
  return `${JSON.stringify(payload, null, 2)}\n`
}

export function exportFilename(): string {
  return `daily-health-${todayISO()}.json`
}

export function jsonTemplate(): string {
  return `${JSON.stringify(
    [
      {
        date: todayISO(),
        meals: [
          {
            meal: 'Lunch',
            time: '13:00',
            entries: [
              {
                food: 'Food name',
                quantity: '100 g',
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
              },
            ],
          },
        ],
      },
    ],
    null,
    2,
  )}\n`
}

function normalizeJsonText(raw: string): string {
  let text = raw.replace(/^\uFEFF/, '')
  if (text.includes('\0')) text = text.replace(/\0/g, '')
  text = text.trim()
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fenced?.[1]) text = fenced[1].trim()
  return text
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value.trim().replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

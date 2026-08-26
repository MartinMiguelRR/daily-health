import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadEntries, saveEntries } from './storage'
import { entryFingerprint } from './jsonData'
import { mealLabel, newId } from './nutrition'
import type { FoodEntry } from './types'

export type EntryDraft = {
  date: string
  time: string
  meal: string
  food: string
  quantity: string
  calories: string
  protein: string
  carbs: string
  fat: string
}

function parseNum(value: string): number {
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function useEntries() {
  const [entries, setEntries] = useState<FoodEntry[]>(() => loadEntries())

  useEffect(() => {
    saveEntries(entries)
  }, [entries])

  const addEntry = useCallback((draft: EntryDraft) => {
    const entry: FoodEntry = {
      id: newId(),
      date: draft.date,
      time: draft.time,
      meal: draft.meal.trim(),
      food: draft.food.trim(),
      quantity: draft.quantity.trim(),
      calories: parseNum(draft.calories),
      protein: parseNum(draft.protein),
      carbs: parseNum(draft.carbs),
      fat: parseNum(draft.fat),
      createdAt: new Date().toISOString(),
    }
    setEntries((prev) => [entry, ...prev])
    return entry
  }, [])

  const updateEntry = useCallback((id: string, draft: EntryDraft) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              date: draft.date,
              time: draft.time,
              meal: draft.meal.trim(),
              food: draft.food.trim(),
              quantity: draft.quantity.trim(),
              calories: parseNum(draft.calories),
              protein: parseNum(draft.protein),
              carbs: parseNum(draft.carbs),
              fat: parseNum(draft.fat),
            }
          : entry,
      ),
    )
  }, [])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const updateDay = useCallback((from: string, to: string) => {
    const next = to.trim()
    if (!next || next === from) return
    setEntries((prev) =>
      prev.map((entry) => (entry.date === from ? { ...entry, date: next } : entry)),
    )
  }, [])

  const removeDay = useCallback((date: string) => {
    setEntries((prev) => prev.filter((entry) => entry.date !== date))
  }, [])

  const updateMeal = useCallback(
    (
      date: string,
      meal: string,
      time: string,
      patch: { meal: string; time: string },
    ) => {
      const nextMeal = patch.meal.trim()
      if (!nextMeal) return
      setEntries((prev) =>
        prev.map((entry) =>
          entry.date === date && mealLabel(entry) === meal && entry.time === time
            ? { ...entry, meal: nextMeal, time: patch.time }
            : entry,
        ),
      )
    },
    [],
  )

  const removeMeal = useCallback((date: string, meal: string, time: string) => {
    setEntries((prev) =>
      prev.filter(
        (entry) =>
          !(
            entry.date === date &&
            mealLabel(entry) === meal &&
            entry.time === time
          ),
      ),
    )
  }, [])

  const importEntries = useCallback((incoming: FoodEntry[]) => {
    const existing = new Set(entries.map(entryFingerprint))
    const fresh: FoodEntry[] = []
    let skipped = 0
    for (const entry of incoming) {
      const key = entryFingerprint(entry)
      if (existing.has(key)) {
        skipped += 1
        continue
      }
      existing.add(key)
      fresh.push(entry)
    }
    if (fresh.length > 0) {
      setEntries((prev) => [...fresh, ...prev])
    }
    return { added: fresh.length, skipped }
  }, [entries])

  const mealLabels = useMemo(() => {
    const seen = new Set<string>()
    const labels: string[] = []
    for (const entry of entries) {
      const meal = entry.meal.trim()
      if (meal && !seen.has(meal)) {
        seen.add(meal)
        labels.push(meal)
      }
    }
    return labels
  }, [entries])

  return {
    entries,
    addEntry,
    updateEntry,
    removeEntry,
    updateDay,
    removeDay,
    updateMeal,
    removeMeal,
    importEntries,
    mealLabels,
  }
}

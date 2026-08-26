import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { EntryDraft } from '../useEntries'
import type { FoodEntry } from '../types'
import { DataPanel } from './DataPanel'

const SUGGESTED_MEALS = ['Breakfast', 'Lunch', 'Snack', 'Dinner']

type Props = {
  draft: EntryDraft
  mealLabels: string[]
  editingId: string | null
  entries: FoodEntry[]
  onChange: (draft: EntryDraft) => void
  onSubmit: () => void
  onCancelEdit: () => void
  onImport: (incoming: FoodEntry[]) => { added: number; skipped: number }
}

export function EntryForm({
  draft,
  mealLabels,
  editingId,
  entries,
  onChange,
  onSubmit,
  onCancelEdit,
  onImport,
}: Props) {
  const [error, setError] = useState('')
  const [jsonOpen, setJsonOpen] = useState(false)

  const meals = useMemo(() => {
    const set = new Set([...SUGGESTED_MEALS, ...mealLabels])
    return [...set]
  }, [mealLabels])

  useEffect(() => {
    setError('')
  }, [draft.food, draft.meal, draft.date])

  useEffect(() => {
    if (editingId) setJsonOpen(false)
  }, [editingId])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.date) {
      setError('Pick a date.')
      return
    }
    if (!draft.meal.trim()) {
      setError('Add a meal label.')
      return
    }
    if (!draft.food.trim()) {
      setError('Add a food name.')
      return
    }
    onSubmit()
  }

  function set<K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) {
    onChange({ ...draft, [key]: value })
  }

  return (
    <form className="panel form" onSubmit={handleSubmit} autoComplete="off">
      <div className="panel-head">
        <h2>{editingId ? 'Edit item' : 'New item'}</h2>
        <div className="head-actions">
          {editingId ? (
            <button type="button" className="text-btn" onClick={onCancelEdit}>
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className={`json-toggle${jsonOpen ? ' on' : ''}`}
              aria-expanded={jsonOpen}
              onClick={() => setJsonOpen((open) => !open)}
            >
              JSON
            </button>
          )}
        </div>
      </div>

      <div className="grid-2">
        <label>
          Date
          <input
            type="date"
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
            required
          />
        </label>
        <label>
          Time
          <input
            type="time"
            value={draft.time}
            onChange={(e) => set('time', e.target.value)}
          />
        </label>
      </div>

      <label>
        Meal
          <input
            list="meal-labels"
            value={draft.meal}
            onChange={(e) => set('meal', e.target.value)}
            placeholder="Lunch"
            autoComplete="off"
            required
          />
        <datalist id="meal-labels">
          {meals.map((meal) => (
            <option key={meal} value={meal} />
          ))}
        </datalist>
      </label>

      <label>
        Food
          <input
            value={draft.food}
            onChange={(e) => set('food', e.target.value)}
            placeholder="Boiled white rice"
            autoComplete="off"
            required
          />
      </label>

      <label>
        Quantity
        <input
          value={draft.quantity}
          onChange={(e) => set('quantity', e.target.value)}
          placeholder="150 g"
        />
      </label>

      <div className="grid-4">
        <label>
          kcal
          <input
            inputMode="decimal"
            value={draft.calories}
            onChange={(e) => set('calories', e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          Protein
          <input
            inputMode="decimal"
            value={draft.protein}
            onChange={(e) => set('protein', e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          Carbs
          <input
            inputMode="decimal"
            value={draft.carbs}
            onChange={(e) => set('carbs', e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          Fat
          <input
            inputMode="decimal"
            value={draft.fat}
            onChange={(e) => set('fat', e.target.value)}
            placeholder="0"
          />
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="submit" className="primary">
        {editingId ? 'Save changes' : 'Add item'}
      </button>

      {jsonOpen && !editingId ? (
        <DataPanel
          entries={entries}
          onImport={onImport}
          onImported={() => setJsonOpen(false)}
        />
      ) : null}
    </form>
  )
}

export function entryToDraft(entry: FoodEntry): EntryDraft {
  return {
    date: entry.date,
    time: entry.time,
    meal: entry.meal,
    food: entry.food,
    quantity: entry.quantity,
    calories: String(entry.calories),
    protein: String(entry.protein),
    carbs: String(entry.carbs),
    fat: String(entry.fat),
  }
}

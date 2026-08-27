import { useMemo, useState } from 'react'
import { EntryForm, entryToDraft } from './components/EntryForm'
import { Overview } from './components/Overview'
import { Timeline } from './components/Timeline'
import { shiftMonth, shiftWeek, todayISO } from './dates'
import type { EntryDraft } from './useEntries'
import { useEntries } from './useEntries'
import type { FoodEntry, PeriodKind, View } from './types'

function emptyDraft(date = todayISO()): EntryDraft {
  return {
    date,
    time: '',
    meal: '',
    food: '',
    quantity: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  }
}

export default function App() {
  const {
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
    ready,
    error,
  } = useEntries()
  const [view, setView] = useState<View>('timeline')
  const [draft, setDraft] = useState<EntryDraft>(() => emptyDraft())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [kind, setKind] = useState<PeriodKind>('week')
  const [anchor, setAnchor] = useState(todayISO)

  const lastMeal = useMemo(() => mealLabels[0] ?? '', [mealLabels])

  function handleSubmit() {
    if (editingId) {
      updateEntry(editingId, draft)
      setEditingId(null)
      setDraft({
        ...emptyDraft(draft.date),
        time: draft.time,
        meal: draft.meal,
      })
      return
    }
    addEntry(draft)
    setDraft({
      ...emptyDraft(draft.date),
      time: draft.time,
      meal: draft.meal || lastMeal,
    })
  }

  function handleEdit(entry: FoodEntry) {
    setEditingId(entry.id)
    setDraft(entryToDraft(entry))
    setView('timeline')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setDraft(emptyDraft(draft.date))
  }

  function handleDeleteDay(date: string) {
    const editing = entries.find((entry) => entry.id === editingId)
    if (editing?.date === date) handleCancelEdit()
    removeDay(date)
  }

  function handleDeleteMeal(date: string, meal: string, time: string) {
    const editing = entries.find((entry) => entry.id === editingId)
    if (
      editing?.date === date &&
      (editing.meal.trim() || 'Unlabeled') === meal &&
      editing.time === time
    ) {
      handleCancelEdit()
    }
    removeMeal(date, meal, time)
  }

  function handleShift(delta: number) {
    setAnchor((current) =>
      kind === 'week' ? shiftWeek(current, delta) : shiftMonth(current, delta),
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <p className="eyebrow">Local log</p>
            <h1>Daily Health</h1>
          </div>
        </div>
        <nav className="seg">
          <button
            type="button"
            className={view === 'timeline' ? 'on' : ''}
            onClick={() => setView('timeline')}
          >
            Timeline
          </button>
          <button
            type="button"
            className={view === 'overview' ? 'on' : ''}
            onClick={() => setView('overview')}
          >
            Overview
          </button>
        </nav>
      </header>

      {error ? <p className="store-error">{error}</p> : null}
      {!ready ? <p className="muted store-status">Loading meals…</p> : null}

      {view === 'timeline' ? (
        <main className="layout">
          <div className="sidebar">
            <EntryForm
              draft={draft}
              mealLabels={mealLabels}
              editingId={editingId}
              entries={entries}
              onChange={setDraft}
              onSubmit={handleSubmit}
              onCancelEdit={handleCancelEdit}
              onImport={importEntries}
            />
          </div>
          <Timeline
            entries={entries}
            editingId={editingId}
            onEdit={handleEdit}
            onDelete={removeEntry}
            onUpdateDay={updateDay}
            onDeleteDay={handleDeleteDay}
            onUpdateMeal={updateMeal}
            onDeleteMeal={handleDeleteMeal}
          />
        </main>
      ) : (
        <main className="layout overview-wrap">
          <Overview
            entries={entries}
            kind={kind}
            anchor={anchor}
            onKind={(next) => {
              setKind(next)
              setAnchor(todayISO())
            }}
            onShift={handleShift}
            onToday={() => setAnchor(todayISO())}
          />
        </main>
      )}
    </div>
  )
}

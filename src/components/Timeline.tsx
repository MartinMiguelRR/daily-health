import { useEffect, useMemo, useState } from 'react'
import { formatDayHeading, formatMonthTitle, isToday, monthKey } from '../dates'
import { groupByDay } from '../nutrition'
import type { DayGroup, FoodEntry, MealGroup } from '../types'
import { MacroPills } from './MacroPills'
import { RowMenu } from './RowMenu'

type Props = {
  entries: FoodEntry[]
  editingId: string | null
  onEdit: (entry: FoodEntry) => void
  onDelete: (id: string) => void
  onUpdateDay: (from: string, to: string) => void
  onDeleteDay: (date: string) => void
  onUpdateMeal: (date: string, meal: string, time: string, patch: { meal: string; time: string }) => void
  onDeleteMeal: (date: string, meal: string, time: string) => void
}

const PAGE_SIZE = 14

export function Timeline({
  entries,
  editingId,
  onEdit,
  onDelete,
  onUpdateDay,
  onDeleteDay,
  onUpdateMeal,
  onDeleteMeal,
}: Props) {
  const days = useMemo(() => groupByDay(entries), [entries])
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({})
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const visibleDays = days.slice(0, visibleCount)
  const hiddenCount = days.length - visibleDays.length

  useEffect(() => {
    if (!editingId) return
    const entry = entries.find((item) => item.id === editingId)
    if (!entry) return
    const index = days.findIndex((day) => day.date === entry.date)
    if (index >= 0) {
      setVisibleCount((count) => (count > index ? count : index + 1))
    }
    setOpenDays((prev) =>
      prev[entry.date] === true ? prev : { ...prev, [entry.date]: true },
    )
  }, [editingId, entries, days])

  function isOpen(date: string) {
    return openDays[date] === true
  }

  function toggle(date: string) {
    setOpenDays((prev) => ({ ...prev, [date]: !prev[date] }))
  }

  function handleUpdateDay(from: string, to: string) {
    if (from !== to) {
      setOpenDays((prev) => ({ ...prev, [to]: true }))
    }
    onUpdateDay(from, to)
  }

  if (days.length === 0) {
    return (
      <section className="panel empty">
        <h2>No meals yet</h2>
        <p>
          Add your first item, or import JSON. Entries group by day, then by
          meal.
        </p>
      </section>
    )
  }

  return (
    <div className="timeline">
      {visibleDays.map((day, index) => {
        const previous = visibleDays[index - 1]
        const showMonth = !previous || monthKey(previous.date) !== monthKey(day.date)
        return (
          <div key={day.date} className="day-block">
            {showMonth ? (
              <p className="month-label">{formatMonthTitle(day.date)}</p>
            ) : null}
            <DayCard
              day={day}
              open={isOpen(day.date)}
              editingId={editingId}
              onToggle={() => toggle(day.date)}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateDay={handleUpdateDay}
              onDeleteDay={onDeleteDay}
              onUpdateMeal={onUpdateMeal}
              onDeleteMeal={onDeleteMeal}
            />
          </div>
        )
      })}
      {hiddenCount > 0 ? (
        <button
          type="button"
          className="ghost load-more"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Older days · {hiddenCount} more
        </button>
      ) : null}
    </div>
  )
}

function DayCard({
  day,
  open,
  editingId,
  onToggle,
  onEdit,
  onDelete,
  onUpdateDay,
  onDeleteDay,
  onUpdateMeal,
  onDeleteMeal,
}: {
  day: DayGroup
  open: boolean
  editingId: string | null
  onToggle: () => void
  onEdit: (entry: FoodEntry) => void
  onDelete: (id: string) => void
  onUpdateDay: (from: string, to: string) => void
  onDeleteDay: (date: string) => void
  onUpdateMeal: (date: string, meal: string, time: string, patch: { meal: string; time: string }) => void
  onDeleteMeal: (date: string, meal: string, time: string) => void
}) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [dateDraft, setDateDraft] = useState(day.date)

  function saveDay() {
    if (!dateDraft) return
    onUpdateDay(day.date, dateDraft)
    setMode('view')
  }

  return (
    <article className={`panel day${open ? '' : ' collapsed'}`}>
      <header className="day-head">
        {mode === 'edit' ? (
          <div className="group-edit">
            <label>
              Date
              <input
                type="date"
                value={dateDraft}
                onChange={(e) => setDateDraft(e.target.value)}
              />
            </label>
            <div className="item-actions">
              <button type="button" onClick={saveDay}>
                Save
              </button>
              <button type="button" onClick={() => setMode('view')}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="day-toggle"
              aria-expanded={open}
              onClick={onToggle}
            >
              <div className="day-copy">
                <h2>{formatDayHeading(day.date)}</h2>
                <p className="muted">
                  {isToday(day.date) ? 'Today · ' : ''}
                  {day.mealCount} meal{day.mealCount === 1 ? '' : 's'} ·{' '}
                  {day.itemCount} item{day.itemCount === 1 ? '' : 's'}
                </p>
              </div>
            </button>
            <MacroPills macros={day.totals} />
            <RowMenu
              onEdit={() => {
                setDateDraft(day.date)
                setMode('edit')
              }}
              onDelete={() => onDeleteDay(day.date)}
            />
          </>
        )}
      </header>

      {open ? (
        <ol className="meals">
          {day.meals.map((meal) => (
            <MealBlock
              key={`${day.date}-${meal.meal}-${meal.time}`}
              date={day.date}
              meal={meal}
              editingId={editingId}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateMeal={onUpdateMeal}
              onDeleteMeal={onDeleteMeal}
            />
          ))}
        </ol>
      ) : null}
    </article>
  )
}

function MealBlock({
  date,
  meal,
  editingId,
  onEdit,
  onDelete,
  onUpdateMeal,
  onDeleteMeal,
}: {
  date: string
  meal: MealGroup
  editingId: string | null
  onEdit: (entry: FoodEntry) => void
  onDelete: (id: string) => void
  onUpdateMeal: (date: string, meal: string, time: string, patch: { meal: string; time: string }) => void
  onDeleteMeal: (date: string, meal: string, time: string) => void
}) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [open, setOpen] = useState(false)
  const [mealDraft, setMealDraft] = useState(meal.meal)
  const [timeDraft, setTimeDraft] = useState(meal.time)

  useEffect(() => {
    if (!editingId) return
    if (meal.entries.some((entry) => entry.id === editingId)) {
      setOpen(true)
    }
  }, [editingId, meal.entries])

  function saveMeal() {
    if (!mealDraft.trim()) return
    onUpdateMeal(date, meal.meal, meal.time, { meal: mealDraft, time: timeDraft })
    setMode('view')
  }

  return (
    <li className={open ? '' : 'collapsed'}>
      {mode === 'edit' ? (
        <div className="group-edit meal-edit">
          <label>
            Meal
            <input
              value={mealDraft}
              onChange={(e) => setMealDraft(e.target.value)}
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={timeDraft}
              onChange={(e) => setTimeDraft(e.target.value)}
            />
          </label>
          <div className="item-actions">
            <button type="button" onClick={saveMeal}>
              Save
            </button>
            <button type="button" onClick={() => setMode('view')}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="meal-head">
          <button
            type="button"
            className="meal-toggle"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <div className="meal-title">
              <h3>{meal.meal}</h3>
              {meal.time ? <time>{meal.time}</time> : null}
              {!open ? (
                <span className="muted">
                  {meal.entries.length} item
                  {meal.entries.length === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>
          </button>
          <MacroPills macros={meal.totals} size="sm" />
          <RowMenu
            onEdit={() => {
              setMealDraft(meal.meal)
              setTimeDraft(meal.time)
              setMode('edit')
            }}
            onDelete={() => onDeleteMeal(date, meal.meal, meal.time)}
          />
        </div>
      )}
      {open ? (
        <ul className="items">
          {meal.entries.map((entry) => (
            <ItemRow
              key={entry.id}
              entry={entry}
              editing={editingId === entry.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function ItemRow({
  entry,
  editing,
  onEdit,
  onDelete,
}: {
  entry: FoodEntry
  editing: boolean
  onEdit: (entry: FoodEntry) => void
  onDelete: (id: string) => void
}) {
  return (
    <li className={editing ? 'editing' : undefined}>
      <div className="item-copy">
        <strong>{entry.food}</strong>
        <span>{entry.quantity || '—'}</span>
      </div>
      <MacroPills macros={entry} size="sm" />
      <RowMenu onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} />
    </li>
  )
}

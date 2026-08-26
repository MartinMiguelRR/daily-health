import { addDays, eachDay, parseISODate, shiftMonth, startOfMonth, endOfMonth } from './dates'
import type {
  DayGroup,
  FoodEntry,
  Macros,
  MealGroup,
  OverviewStats,
  PeriodCompare,
  PeriodKind,
  TrendSeries,
} from './types'

export const emptyMacros = (): Macros => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
})

export function addMacros(a: Macros, b: Pick<FoodEntry, keyof Macros>): Macros {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  }
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function formatKcal(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

export function formatMacro(n: number): string {
  const rounded = round1(n)
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function calorieShare(macros: Macros): {
  protein: number
  carbs: number
  fat: number
} {
  const p = macros.protein * 4
  const c = macros.carbs * 4
  const f = macros.fat * 9
  const total = p + c + f
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 }
  return {
    protein: Math.round((p / total) * 100),
    carbs: Math.round((c / total) * 100),
    fat: Math.round((f / total) * 100),
  }
}

function mealSortKey(meal: MealGroup): number {
  if (meal.time) {
    const [h, m] = meal.time.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }
  const first = meal.entries[0]
  return first ? Date.parse(first.createdAt) : 0
}

export function mealLabel(entry: Pick<FoodEntry, 'meal'>): string {
  return entry.meal.trim() || 'Unlabeled'
}

export function mealSittingKey(entry: Pick<FoodEntry, 'meal' | 'time'>): string {
  return `${mealLabel(entry)}\0${entry.time}`
}

export function groupByDay(entries: FoodEntry[]): DayGroup[] {
  const byDate = new Map<string, FoodEntry[]>()
  for (const entry of entries) {
    const list = byDate.get(entry.date) ?? []
    list.push(entry)
    byDate.set(entry.date, list)
  }

  const days: DayGroup[] = []
  for (const [date, dayEntries] of byDate) {
    const bySitting = new Map<string, FoodEntry[]>()
    for (const entry of dayEntries) {
      const key = mealSittingKey(entry)
      const list = bySitting.get(key) ?? []
      list.push(entry)
      bySitting.set(key, list)
    }

    const meals: MealGroup[] = []
    for (const mealEntries of bySitting.values()) {
      const first = mealEntries[0]
      if (!first) continue
      meals.push({
        meal: mealLabel(first),
        time: first.time,
        entries: mealEntries.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        totals: mealEntries.reduce(addMacros, emptyMacros()),
      })
    }

    meals.sort((a, b) => {
      const byTime = mealSortKey(a) - mealSortKey(b)
      if (byTime !== 0) return byTime
      return a.meal.localeCompare(b.meal)
    })

    days.push({
      date,
      meals,
      itemCount: dayEntries.length,
      mealCount: meals.length,
      totals: dayEntries.reduce(addMacros, emptyMacros()),
    })
  }

  days.sort((a, b) => b.date.localeCompare(a.date))
  return days
}

export function buildOverview(
  entries: FoodEntry[],
  kind: PeriodKind,
  start: string,
  end: string,
): OverviewStats {
  const inPeriod = entries.filter((e) => e.date >= start && e.date <= end)
  const days = groupByDay(inPeriod)
  const byDate = new Map(days.map((d) => [d.date, d]))

  const daysInPeriod =
    Math.round(
      (parseISODate(end).getTime() - parseISODate(start).getTime()) / 86_400_000,
    ) + 1

  const totals = inPeriod.reduce(addMacros, emptyMacros())
  const daysLogged = days.length
  const divisor = daysLogged || 1

  const foodMap = new Map<string, { calories: number; times: number }>()
  for (const entry of inPeriod) {
    const key = entry.food.trim()
    const current = foodMap.get(key) ?? { calories: 0, times: 0 }
    current.calories += entry.calories
    current.times += 1
    foodMap.set(key, current)
  }

  const topFoods = [...foodMap.entries()]
    .map(([food, v]) => ({ food, ...v }))
    .sort((a, b) => b.calories - a.calories)
    .slice(0, 8)

  const ranked = [...days].sort((a, b) => b.totals.calories - a.totals.calories)

  const daily = []
  let cursor = start
  while (cursor <= end) {
    const day = byDate.get(cursor)
    daily.push({
      date: cursor,
      totals: day?.totals ?? emptyMacros(),
      mealCount: day?.mealCount ?? 0,
    })
    cursor = addDays(cursor, 1)
  }

  return {
    kind,
    start,
    end,
    daysInPeriod,
    daysLogged,
    itemCount: inPeriod.length,
    mealCount: days.reduce((sum, d) => sum + d.mealCount, 0),
    totals,
    averages: {
      calories: totals.calories / divisor,
      protein: totals.protein / divisor,
      carbs: totals.carbs / divisor,
      fat: totals.fat / divisor,
    },
    calorieSplit: calorieShare(totals),
    topFoods,
    highestDay: ranked[0]
      ? { date: ranked[0].date, calories: ranked[0].totals.calories }
      : null,
    lowestDay: ranked.length
      ? {
          date: ranked[ranked.length - 1].date,
          calories: ranked[ranked.length - 1].totals.calories,
        }
      : null,
    daily,
  }
}

export function proteinDensity(macros: Pick<Macros, 'calories' | 'protein'>): number | null {
  if (macros.calories <= 0) return null
  return (macros.protein / macros.calories) * 100
}

export function formatDensity(n: number): string {
  return round1(n).toFixed(1)
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

export function previousRange(
  kind: PeriodKind,
  start: string,
): { start: string; end: string } {
  if (kind === 'week') {
    const prevStart = addDays(start, -7)
    return { start: prevStart, end: addDays(prevStart, 6) }
  }
  const prev = shiftMonth(start, -1)
  return { start: startOfMonth(prev), end: endOfMonth(prev) }
}

export function comparePeriods(
  current: OverviewStats,
  previous: OverviewStats,
): PeriodCompare {
  return {
    previousStart: previous.start,
    previousEnd: previous.end,
    previousDaysLogged: previous.daysLogged,
    previousAvgCalories: previous.averages.calories,
    previousAvgProtein: previous.averages.protein,
    daysLoggedDelta: current.daysLogged - previous.daysLogged,
    caloriesPct: pctChange(current.averages.calories, previous.averages.calories),
    proteinPct: pctChange(current.averages.protein, previous.averages.protein),
  }
}

export function buildTrend(
  entries: FoodEntry[],
  end: string,
  window: 7 | 14,
): TrendSeries {
  const start = addDays(end, -(window - 1))
  const inWindow = entries.filter((e) => e.date >= start && e.date <= end)
  const byDate = new Map(
    groupByDay(inWindow).map((day) => [day.date, day.totals]),
  )
  const points = eachDay(start, end).map((date) => {
    const totals = byDate.get(date)
    return {
      date,
      calories: totals?.calories ?? 0,
      protein: totals?.protein ?? 0,
      logged: Boolean(totals),
    }
  })
  const logged = points.filter((point) => point.logged)
  const rollingCalories = points.map((_, index) => {
    const slice = points
      .slice(Math.max(0, index - (window - 1)), index + 1)
      .filter((point) => point.logged)
    if (slice.length === 0) return 0
    return slice.reduce((sum, point) => sum + point.calories, 0) / slice.length
  })
  const rollingProtein = points.map((_, index) => {
    const slice = points
      .slice(Math.max(0, index - (window - 1)), index + 1)
      .filter((point) => point.logged)
    if (slice.length === 0) return 0
    return slice.reduce((sum, point) => sum + point.protein, 0) / slice.length
  })

  return {
    window,
    start,
    end,
    points,
    rollingCalories,
    rollingProtein,
    avgCalories: logged.length
      ? logged.reduce((sum, point) => sum + point.calories, 0) / logged.length
      : 0,
    avgProtein: logged.length
      ? logged.reduce((sum, point) => sum + point.protein, 0) / logged.length
      : 0,
    daysLogged: logged.length,
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

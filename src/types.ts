export type FoodEntry = {
  id: string
  date: string
  time: string
  meal: string
  food: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
  createdAt: string
}

export type Macros = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type MealGroup = {
  meal: string
  time: string
  entries: FoodEntry[]
  totals: Macros
}

export type DayGroup = {
  date: string
  meals: MealGroup[]
  itemCount: number
  mealCount: number
  totals: Macros
}

export type PeriodKind = 'week' | 'month'

export type OverviewStats = {
  kind: PeriodKind
  start: string
  end: string
  daysInPeriod: number
  daysLogged: number
  itemCount: number
  mealCount: number
  totals: Macros
  averages: Macros
  calorieSplit: { protein: number; carbs: number; fat: number }
  topFoods: { food: string; calories: number; times: number }[]
  highestDay: { date: string; calories: number } | null
  lowestDay: { date: string; calories: number } | null
  daily: { date: string; totals: Macros; mealCount: number }[]
}

export type TrendPoint = {
  date: string
  calories: number
  protein: number
  logged: boolean
}

export type TrendSeries = {
  window: 7 | 14
  start: string
  end: string
  points: TrendPoint[]
  rollingCalories: number[]
  rollingProtein: number[]
  avgCalories: number
  avgProtein: number
  daysLogged: number
}

export type PeriodCompare = {
  previousStart: string
  previousEnd: string
  previousDaysLogged: number
  previousAvgCalories: number
  previousAvgProtein: number
  daysLoggedDelta: number
  caloriesPct: number | null
  proteinPct: number | null
}

export type View = 'timeline' | 'overview'

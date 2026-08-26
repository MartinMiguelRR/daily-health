const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function parseFlexibleDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (dmy) {
    const day = pad(Number(dmy[1]))
    const month = pad(Number(dmy[2]))
    return `${dmy[3]}-${month}-${day}`
  }
  return null
}

export function parseFlexibleTime(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return ''
  return `${pad(Number(match[1]))}:${match[2]}`
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function startOfWeek(iso: string): string {
  const d = parseISODate(iso)
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + mondayOffset)
  return toISODate(d)
}

export function endOfWeek(iso: string): string {
  return addDays(startOfWeek(iso), 6)
}

export function startOfMonth(iso: string): string {
  const d = parseISODate(iso)
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1))
}

export function endOfMonth(iso: string): string {
  const d = parseISODate(iso)
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

export function eachDay(start: string, end: string): string[] {
  const days: string[] = []
  let cursor = start
  while (cursor <= end) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}

export function formatDayHeading(iso: string): string {
  const d = parseISODate(iso)
  return `${WEEKDAY_LONG[d.getDay()]} ${d.getDate()}`
}

export function formatDayShort(iso: string): string {
  const d = parseISODate(iso)
  return `${WEEKDAY_LONG[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}

export function formatPeriodRange(start: string, end: string): string {
  const a = parseISODate(start)
  const b = parseISODate(end)
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${MONTH_LONG[a.getMonth()]} ${a.getFullYear()}`
  }
  if (a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} ${MONTH_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]} ${a.getFullYear()}`
  }
  return `${a.getDate()} ${MONTH_SHORT[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]} ${b.getFullYear()}`
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function formatMonthTitle(iso: string): string {
  const d = parseISODate(iso)
  return `${MONTH_LONG[d.getMonth()]} ${d.getFullYear()}`
}

export function shiftWeek(iso: string, delta: number): string {
  return addDays(iso, delta * 7)
}

export function shiftMonth(iso: string, delta: number): string {
  const d = parseISODate(iso)
  d.setMonth(d.getMonth() + delta)
  return toISODate(d)
}

export function isToday(iso: string): boolean {
  return iso === todayISO()
}

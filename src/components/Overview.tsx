import { useState } from 'react'
import {
  endOfMonth,
  endOfWeek,
  formatDayShort,
  formatMonthTitle,
  formatPeriodRange,
  startOfMonth,
  startOfWeek,
  todayISO,
} from '../dates'
import {
  buildOverview,
  buildTrend,
  calorieShare,
  comparePeriods,
  formatDensity,
  formatKcal,
  formatMacro,
  previousRange,
  proteinDensity,
} from '../nutrition'
import type { FoodEntry, PeriodKind } from '../types'
import { MacroBar, MacroPills } from './MacroPills'

type Props = {
  entries: FoodEntry[]
  kind: PeriodKind
  anchor: string
  onKind: (kind: PeriodKind) => void
  onShift: (delta: number) => void
  onToday: () => void
}

function formatSigned(n: number): string {
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : String(n)
}

function formatPct(n: number | null): string {
  if (n === null) return '—'
  if (n === 0) return '0%'
  return `${n > 0 ? '+' : ''}${n}%`
}

function Sparkline({
  values,
  logged,
  color,
}: {
  values: number[]
  logged: boolean[]
  color: string
}) {
  const width = 320
  const height = 72
  const max = Math.max(1, ...values)
  const count = values.length
  const xAt = (index: number) =>
    count <= 1 ? width / 2 : (index / (count - 1)) * width
  const yAt = (value: number) => height - 6 - (value / max) * (height - 12)
  const line = values.map((value, index) => `${xAt(index)},${yAt(value)}`).join(' ')

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={line}
      />
      {values.map((value, index) =>
        logged[index] ? (
          <circle
            key={index}
            cx={xAt(index)}
            cy={yAt(value)}
            r="3.2"
            fill={color}
          />
        ) : null,
      )}
    </svg>
  )
}

export function Overview({ entries, kind, anchor, onKind, onShift, onToday }: Props) {
  const [trendWindow, setTrendWindow] = useState<7 | 14>(7)
  const start = kind === 'week' ? startOfWeek(anchor) : startOfMonth(anchor)
  const end = kind === 'week' ? endOfWeek(anchor) : endOfMonth(anchor)
  const stats = buildOverview(entries, kind, start, end)
  const maxKcal = Math.max(1, ...stats.daily.map((d) => d.totals.calories))
  const split = calorieShare(stats.totals)
  const density = proteinDensity(stats.totals)
  const prev = previousRange(kind, start)
  const prevStats = buildOverview(entries, kind, prev.start, prev.end)
  const compare = comparePeriods(stats, prevStats)
  const today = todayISO()
  const trendEnd = end > today ? today : end
  const trend = buildTrend(entries, trendEnd, trendWindow)
  const loggedFlags = trend.points.map((point) => point.logged)
  const showCompare = stats.daysLogged > 0 || prevStats.daysLogged > 0
  const previousLabel = kind === 'week' ? 'last week' : 'last month'

  return (
    <div className="overview">
      <section className="panel period-nav">
        <div className="seg">
          <button
            type="button"
            className={kind === 'week' ? 'on' : ''}
            onClick={() => onKind('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={kind === 'month' ? 'on' : ''}
            onClick={() => onKind('month')}
          >
            Month
          </button>
        </div>
        <div className="period-title">
          <button type="button" className="icon-btn" onClick={() => onShift(-1)} aria-label="Previous">
            ‹
          </button>
          <div>
            <h2>{kind === 'month' ? formatMonthTitle(anchor) : 'Week'}</h2>
            <p>{formatPeriodRange(start, end)}</p>
          </div>
          <button type="button" className="icon-btn" onClick={() => onShift(1)} aria-label="Next">
            ›
          </button>
        </div>
        <button type="button" className="ghost" onClick={onToday}>
          This {kind}
        </button>
      </section>

      {stats.daysLogged === 0 ? (
        <section className="panel empty">
          <h2>Nothing logged in this {kind}</h2>
          <p>Add meals in the timeline and they will roll up here.</p>
        </section>
      ) : (
        <>
          <section className="stat-grid">
            <article className="panel stat">
              <p className="label">Days logged</p>
              <p className="value">
                {stats.daysLogged}
                <small> / {stats.daysInPeriod}</small>
              </p>
            </article>
            <article className="panel stat">
              <p className="label">Meals</p>
              <p className="value">{stats.mealCount}</p>
              <p className="hint">{stats.itemCount} food items</p>
            </article>
            <article className="panel stat">
              <p className="label">Total kcal</p>
              <p className="value">{formatKcal(stats.totals.calories)}</p>
            </article>
            <article className="panel stat">
              <p className="label">Avg / logged day</p>
              <p className="value">{formatKcal(stats.averages.calories)}</p>
              <p className="hint">kcal</p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Macros</h2>
              <p className="muted">Averages per logged day</p>
            </div>
            <MacroPills macros={stats.averages} />
            <MacroBar protein={split.protein} carbs={split.carbs} fat={split.fat} />
            <ul className="split-legend">
              <li>
                <span className="dot protein" /> Protein {split.protein}%
              </li>
              <li>
                <span className="dot carbs" /> Carbs {split.carbs}%
              </li>
              <li>
                <span className="dot fat" /> Fat {split.fat}%
              </li>
            </ul>
            <p className="muted totals-line">
              Period totals · {formatMacro(stats.totals.protein)} g P ·{' '}
              {formatMacro(stats.totals.carbs)} g C · {formatMacro(stats.totals.fat)} g F
            </p>
            <div className="density">
              <p className="label">Protein density</p>
              <p className="value">
                {density === null ? '—' : formatDensity(density)}
                {density !== null ? <small> g / 100 kcal</small> : null}
              </p>
            </div>
          </section>
        </>
      )}

      {showCompare ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Vs {previousLabel}</h2>
            <p className="muted">{formatPeriodRange(prev.start, prev.end)}</p>
          </div>
          {prevStats.daysLogged === 0 ? (
            <p className="muted">No days logged in the previous {kind} to compare.</p>
          ) : (
            <table className="compare-table">
              <thead>
                <tr>
                  <th />
                  <th>This {kind}</th>
                  <th>Previous</th>
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Days logged</th>
                  <td>{stats.daysLogged}</td>
                  <td>{prevStats.daysLogged}</td>
                  <td>{formatSigned(compare.daysLoggedDelta)}</td>
                </tr>
                <tr>
                  <th scope="row">Avg kcal</th>
                  <td>{stats.daysLogged ? formatKcal(stats.averages.calories) : '—'}</td>
                  <td>{formatKcal(prevStats.averages.calories)}</td>
                  <td>{stats.daysLogged ? formatPct(compare.caloriesPct) : '—'}</td>
                </tr>
                <tr>
                  <th scope="row">Avg protein</th>
                  <td>
                    {stats.daysLogged ? `${formatMacro(stats.averages.protein)} g` : '—'}
                  </td>
                  <td>{formatMacro(prevStats.averages.protein)} g</td>
                  <td>{stats.daysLogged ? formatPct(compare.proteinPct) : '—'}</td>
                </tr>
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {trend.daysLogged > 0 ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Trend</h2>
            <div className="seg">
              <button
                type="button"
                className={trendWindow === 7 ? 'on' : ''}
                onClick={() => setTrendWindow(7)}
              >
                7 days
              </button>
              <button
                type="button"
                className={trendWindow === 14 ? 'on' : ''}
                onClick={() => setTrendWindow(14)}
              >
                14 days
              </button>
            </div>
          </div>
          <p className="muted trend-copy">
            Rolling average of logged days ending {formatDayShort(trend.end)}. Empty days
            stay out of the average so a thin log does not look like a full one.
          </p>
          <div className="trend-grid">
            <article className="trend-card">
              <p className="label">Calories</p>
              <p className="value">
                {formatKcal(trend.avgCalories)}
                <small> avg kcal</small>
              </p>
              <Sparkline
                values={trend.rollingCalories}
                logged={loggedFlags}
                color="var(--kcal)"
              />
            </article>
            <article className="trend-card">
              <p className="label">Protein</p>
              <p className="value protein-value">
                {formatMacro(trend.avgProtein)}
                <small> avg g</small>
              </p>
              <Sparkline
                values={trend.rollingProtein}
                logged={loggedFlags}
                color="var(--protein)"
              />
            </article>
          </div>
          <p className="muted trend-meta">
            {trend.daysLogged} logged {trend.daysLogged === 1 ? 'day' : 'days'} in this
            window · dots mark days with meals
          </p>
        </section>
      ) : null}

      {stats.daysLogged === 0 ? null : (
        <>
          <section className="panel">
            <div className="panel-head">
              <h2>Daily calories</h2>
            </div>
            <div className={`bars ${kind}`}>
              {stats.daily.map((day) => (
                <div key={day.date} className="bar-col">
                  <div className="bar-track">
                    <div
                      className={day.totals.calories ? 'bar fill' : 'bar empty'}
                      style={{
                        height: `${(day.totals.calories / maxKcal) * 100}%`,
                      }}
                      title={`${formatDayShort(day.date)}: ${formatKcal(day.totals.calories)} kcal`}
                    />
                  </div>
                  {kind === 'week' ? (
                    <span>{formatDayShort(day.date).slice(0, 3)}</span>
                  ) : null}
                  <em>{String(Number(day.date.slice(-2)))}</em>
                </div>
              ))}
            </div>
          </section>

          <section className={stats.daysLogged > 1 ? 'two-col' : undefined}>
            {stats.daysLogged > 1 ? (
            <article className="panel">
              <h2>Range</h2>
              <dl className="range-list">
                <div>
                  <dt>Highest day</dt>
                  <dd>
                    {stats.highestDay
                      ? `${formatDayShort(stats.highestDay.date)} · ${formatKcal(stats.highestDay.calories)} kcal`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Lowest logged day</dt>
                  <dd>
                    {stats.lowestDay
                      ? `${formatDayShort(stats.lowestDay.date)} · ${formatKcal(stats.lowestDay.calories)} kcal`
                      : '—'}
                  </dd>
                </div>
              </dl>
            </article>
            ) : null}
            <article className="panel">
              <h2>Top foods</h2>
              {stats.topFoods.length === 0 ? (
                <p className="muted">No items yet.</p>
              ) : (
                <ol className="top-foods">
                  {stats.topFoods.map((food) => (
                    <li key={food.food}>
                      <span>
                        {food.food}
                        <em>
                          {' '}
                          {food.times}×
                        </em>
                      </span>
                      <strong>{formatKcal(food.calories)} kcal</strong>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  )
}

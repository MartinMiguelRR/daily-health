import { formatKcal, formatMacro } from '../nutrition'
import type { Macros } from '../types'

type Props = {
  macros: Macros
  size?: 'sm' | 'md'
}

export function MacroPills({ macros, size = 'md' }: Props) {
  return (
    <ul className={`macros ${size === 'sm' ? 'macros-sm' : ''}`}>
      <li>
        <span className="dot kcal" />
        <strong>{formatKcal(macros.calories)}</strong>
        <em>kcal</em>
      </li>
      <li>
        <span className="dot protein" />
        <strong>{formatMacro(macros.protein)}</strong>
        <em>P</em>
      </li>
      <li>
        <span className="dot carbs" />
        <strong>{formatMacro(macros.carbs)}</strong>
        <em>C</em>
      </li>
      <li>
        <span className="dot fat" />
        <strong>{formatMacro(macros.fat)}</strong>
        <em>F</em>
      </li>
    </ul>
  )
}

export function MacroBar({
  protein,
  carbs,
  fat,
}: {
  protein: number
  carbs: number
  fat: number
}) {
  const total = protein + carbs + fat || 1
  return (
    <div className="macro-bar" aria-hidden="true">
      <span style={{ width: `${(protein / total) * 100}%` }} className="protein" />
      <span style={{ width: `${(carbs / total) * 100}%` }} className="carbs" />
      <span style={{ width: `${(fat / total) * 100}%` }} className="fat" />
    </div>
  )
}

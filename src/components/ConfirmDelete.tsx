import { useState } from 'react'

type Props = {
  onConfirm: () => void
}

export function ConfirmDelete({ onConfirm }: Props) {
  const [armed, setArmed] = useState(false)

  return (
    <button
      type="button"
      className={armed ? 'danger' : undefined}
      onClick={(event) => {
        event.stopPropagation()
        if (armed) {
          onConfirm()
          setArmed(false)
          return
        }
        setArmed(true)
      }}
      onBlur={() => setArmed(false)}
    >
      {armed ? 'Confirm' : 'Delete'}
    </button>
  )
}

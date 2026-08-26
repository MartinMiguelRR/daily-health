import { useEffect, useRef, useState } from 'react'
import { ConfirmDelete } from './ConfirmDelete'

type Props = {
  onEdit: () => void
  onDelete: () => void
}

export function RowMenu({ onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function hide(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', hide)
    return () => document.removeEventListener('pointerdown', hide)
  }, [open])

  return (
    <div
      className={`row-menu${open ? ' open' : ''}`}
      ref={ref}
      onClick={(event) => event.stopPropagation()}
    >
      {open ? (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
          >
            Edit
          </button>
          <ConfirmDelete
            onConfirm={() => {
              setOpen(false)
              onDelete()
            }}
          />
        </>
      ) : null}
      <button
        type="button"
        className="more-btn"
        aria-expanded={open}
        aria-label="More actions"
        onClick={() => setOpen((value) => !value)}
      >
        ⋯
      </button>
    </div>
  )
}

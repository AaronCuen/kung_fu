import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

type ModalProps = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  size?: 'small' | 'medium' | 'large'
}

export function Modal({ open, title, description, children, onClose, size = 'medium' }: ModalProps) {
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.classList.add('modal-open')
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-modal="true" className={`modal modal--${size}`} role="dialog">
        <header className="modal__header">
          <div><p className="section-kicker">Kung Fu</p><h2>{title}</h2>{description && <p>{description}</p>}</div>
          <button aria-label="Cerrar" className="icon-button icon-button--soft" onClick={onClose} type="button"><Icon name="close" size={19} /></button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  )
}

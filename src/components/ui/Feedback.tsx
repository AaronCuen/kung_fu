import { Icon } from './Icon'

export function LoadingState({ label = 'Cargando información…' }: { label?: string }) {
  return <div className="feedback-state"><span className="spinner" /><p>{label}</p></div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="feedback-state feedback-state--error">
      <span className="feedback-state__icon"><Icon name="close" size={22} /></span>
      <div><strong>No pudimos cargar esta información</strong><p>{message}</p></div>
      {onRetry && <button className="button button--secondary button--compact" onClick={onRetry} type="button">Reintentar</button>}
    </div>
  )
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="feedback-state feedback-state--empty">
      <span className="feedback-state__icon"><Icon name="receipt" size={24} /></span>
      <div><strong>{title}</strong><p>{message}</p></div>
    </div>
  )
}

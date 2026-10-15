import type { ReactNode } from 'react'

type StatusBadgeProps = {
  children: ReactNode
  tone?: 'red' | 'gold' | 'green' | 'neutral'
  dot?: boolean
}

export function StatusBadge({ children, tone = 'neutral', dot = false }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {dot && <span className="status-badge__dot" />}
      {children}
    </span>
  )
}

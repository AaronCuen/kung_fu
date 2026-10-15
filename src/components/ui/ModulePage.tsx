import type { ReactNode } from 'react'

type ModulePageProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  action?: ReactNode
}

export function ModulePage({ eyebrow, title, description, children, action }: ModulePageProps) {
  return (
    <section className="module-page">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="eyebrow"><span />{eyebrow}</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        {action && <div className="page-header__action">{action}</div>}
      </header>
      {children}
    </section>
  )
}

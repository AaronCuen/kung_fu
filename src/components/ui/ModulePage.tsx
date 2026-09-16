import type { ReactNode } from 'react'

type ModulePageProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function ModulePage({ eyebrow, title, description, children }: ModulePageProps) {
  return (
    <section className="module-page">
      <header className="page-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </header>
      {children}
    </section>
  )
}

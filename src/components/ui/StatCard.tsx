import { Icon, type IconName } from './Icon'

type StatCardProps = {
  label: string
  value: string
  detail: string
  icon: IconName
  tone?: 'red' | 'gold' | 'green'
}

export function StatCard({ label, value, detail, icon, tone = 'red' }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon"><Icon name={icon} size={21} /></div>
      <div>
        <p className="stat-card__label">{label}</p>
        <strong className="stat-card__value">{value}</strong>
        <p className="stat-card__detail">{detail}</p>
      </div>
    </article>
  )
}

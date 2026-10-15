import { Icon, type IconName } from './Icon'

type StructureCardProps = {
  title: string
  description: string
  items: string[]
  icon?: IconName
  action?: string
}

export function StructureCard({ title, description, items, icon = 'orders', action }: StructureCardProps) {
  return (
    <article className="structure-card">
      <div className="structure-card__icon"><Icon name={icon} size={21} /></div>
      <h2>{title}</h2>
      <p>{description}</p>
      <ul>
        {items.map((item) => <li key={item}><Icon name="check" size={14} />{item}</li>)}
      </ul>
      {action && <button className="card-link" type="button">{action}<Icon name="arrow" size={16} /></button>}
    </article>
  )
}

type StructureCardProps = {
  title: string
  description: string
  items: string[]
}

export function StructureCard({ title, description, items }: StructureCardProps) {
  return (
    <article className="structure-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </article>
  )
}

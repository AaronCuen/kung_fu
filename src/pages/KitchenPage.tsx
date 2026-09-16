import { ModulePage } from '../components/ui/ModulePage'
import { StructureCard } from '../components/ui/StructureCard'

export function KitchenPage() {
  return (
    <ModulePage
      eyebrow="Pantalla de tablet"
      title="Cocina"
      description="Tablero destinado a mostrar las comandas en el orden en que llegan."
    >
      <div className="card-grid">
        <StructureCard
          title="Fila de preparación"
          description="Las comandas nuevas aparecerán en tiempo real."
          items={['Orden de llegada', 'Datos necesarios de la cuenta', 'Detalle de platos y cantidades']}
        />
        <StructureCard
          title="Estados confirmados"
          description="El tablero solo contemplará los estados definidos hasta ahora."
          items={['Preparando', 'Lista', 'Cancelada']}
        />
      </div>
    </ModulePage>
  )
}

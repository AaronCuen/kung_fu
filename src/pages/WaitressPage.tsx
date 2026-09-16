import { ModulePage } from '../components/ui/ModulePage'
import { StructureCard } from '../components/ui/StructureCard'

export function WaitressPage() {
  return (
    <ModulePage
      eyebrow="Área operativa"
      title="Mesera"
      description="Espacio reservado para abrir cuentas y enviar nuevas comandas."
    >
      <div className="card-grid">
        <StructureCard
          title="Cuentas"
          description="Entrada de los tres tipos de servicio confirmados."
          items={['Para comer aquí: número de mesa', 'Para llevar: nombre y teléfono', 'Para recoger: nombre']}
        />
        <StructureCard
          title="Comandas"
          description="Cada solicitud quedará vinculada a una cuenta."
          items={['Nueva comanda', 'Historial por cuenta', 'Envío a cocina en tiempo real']}
        />
      </div>
    </ModulePage>
  )
}

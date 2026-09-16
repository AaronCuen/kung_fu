import { ModulePage } from '../components/ui/ModulePage'
import { StructureCard } from '../components/ui/StructureCard'

export function ReceptionPage() {
  return (
    <ModulePage
      eyebrow="Área operativa"
      title="Recepción / Caja"
      description="Vista central para consultar la operación y atender las cuentas."
    >
      <div className="card-grid">
        <StructureCard
          title="Cuentas"
          description="Consulta de las cuentas y comandas del restaurante."
          items={['Búsqueda de cuenta', 'Detalle de comandas', 'Estado general de atención']}
        />
        <StructureCard
          title="Caja"
          description="Lugar preparado para cobros y movimientos diarios."
          items={['Pagos', 'Movimientos del día', 'Acceso al corte diario']}
        />
      </div>
    </ModulePage>
  )
}

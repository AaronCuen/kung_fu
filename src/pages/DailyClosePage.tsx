import { ModulePage } from '../components/ui/ModulePage'
import { StructureCard } from '../components/ui/StructureCard'

export function DailyClosePage() {
  return (
    <ModulePage
      eyebrow="Control diario"
      title="Corte del día"
      description="Módulo reservado para revisar el cierre y todos los movimientos de la jornada."
    >
      <div className="card-grid">
        <StructureCard
          title="Resumen"
          description="Concentrará la información diaria de la operación."
          items={['Cuentas atendidas', 'Pagos registrados', 'Total del día']}
        />
        <StructureCard
          title="Movimientos"
          description="Historial consultable antes de realizar el corte."
          items={['Movimientos de caja', 'Cambios de comandas', 'Registro de fechas y horas']}
        />
      </div>
    </ModulePage>
  )
}

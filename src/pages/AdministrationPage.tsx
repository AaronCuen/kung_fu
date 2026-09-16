import { ModulePage } from '../components/ui/ModulePage'
import { StructureCard } from '../components/ui/StructureCard'

export function AdministrationPage() {
  return (
    <ModulePage
      eyebrow="Acceso administrativo"
      title="Usuarios y permisos"
      description="Área exclusiva para administrar accesos sin depender de roles rígidos."
    >
      <div className="card-grid">
        <StructureCard
          title="Usuarios"
          description="La administración será la única responsable de estas acciones."
          items={['Crear usuarios', 'Editar usuarios', 'Desactivar usuarios']}
        />
        <StructureCard
          title="Permisos"
          description="Cada usuario tendrá los accesos que se le asignen."
          items={['Asignar permisos', 'Cambiar permisos', 'Control de módulos disponibles']}
        />
      </div>
    </ModulePage>
  )
}

import { Icon } from '../components/ui/Icon'
import { useAuth } from '../auth/AuthContext'

export function NoAccessPage() {
  const { logout } = useAuth()
  return (
    <main className="standalone-state">
      <span className="standalone-state__icon"><Icon name="admin" size={28} /></span>
      <h1>Sin permisos asignados</h1>
      <p>Tu usuario está activo, pero todavía no tiene acceso a ningún módulo. Pide al administrador que configure tus permisos.</p>
      <button className="button button--primary" onClick={logout} type="button">Cerrar sesión</button>
    </main>
  )
}

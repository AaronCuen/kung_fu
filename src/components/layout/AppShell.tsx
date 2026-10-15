import type { CSSProperties } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Icon, type IconName } from '../ui/Icon'

const navigation: { to: string; label: string; shortLabel: string; description: string; icon: IconName; permissions: string[] }[] = [
  { to: '/mesera', label: 'Mesera', shortLabel: 'Mesera', description: 'Cuentas y comandas', icon: 'orders', permissions: ['cuentas.ver_propias', 'cuentas.ver_todas'] },
  { to: '/recepcion', label: 'Recepción / Caja', shortLabel: 'Caja', description: 'Operación y cobros', icon: 'cash', permissions: ['cuentas.ver_todas'] },
  { to: '/cocina', label: 'Cocina', shortLabel: 'Cocina', description: 'Comandas en tiempo real', icon: 'chef', permissions: ['comandas.ver_cocina'] },
  { to: '/corte-del-dia', label: 'Corte del día', shortLabel: 'Corte', description: 'Movimientos y control', icon: 'receipt', permissions: ['reportes.ver'] },
  { to: '/administracion', label: 'Administración', shortLabel: 'Admin', description: 'Panel de gestión', icon: 'admin', permissions: [] },
]

export function AppShell() {
  const { user, hasAnyPermission, logout } = useAuth()
  const navigate = useNavigate()
  const visibleNavigation = navigation.filter((item) => item.to === '/administracion'
    ? user?.rol === 'ADMIN'
    : hasAnyPermission(...item.permissions))
  const initials = user?.nombre.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'KF'
  const roleLabels = { ADMIN: 'Administrador', MESERA: 'Mesera', COCINA: 'Cocina', RECEPCIONISTA: 'Recepcionista' }
  const handleLogout = () => {
    logout()
    navigate('/iniciar-sesion', { replace: true })
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido-principal">Saltar al contenido</a>

      <header className="mobile-header">
        <div className="brand brand--mobile">
          <span className="brand-mark" aria-hidden="true">功</span>
          <div><strong>Kung Fu</strong><span>Comandas</span></div>
        </div>
        <button className="icon-button" aria-label="Cerrar sesión" onClick={handleLogout} type="button">
          <Icon name="logout" size={20} />
        </button>
      </header>

      <aside className="sidebar">
        <div className="sidebar__ornament" aria-hidden="true" />
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">功</span>
          <div className="brand-copy">
            <strong>Kung Fu</strong>
            <span>Comandas</span>
          </div>
        </div>

        <nav aria-label="Áreas del sistema">
          <p className="nav-title">Operación</p>
          <ul className="nav-list" style={{ '--nav-count': visibleNavigation.length } as CSSProperties}>
            {visibleNavigation.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                  to={item.to}
                >
                  <span className="nav-link__icon"><Icon name={item.icon} size={20} /></span>
                  <span className="nav-link__copy">
                    <span className="nav-link__label nav-link__label--full">{item.label}</span>
                    <span className="nav-link__label nav-link__label--short">{item.shortLabel}</span>
                    <small>{item.description}</small>
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-user">
          <span className="user-avatar">{initials}</span>
          <span className="sidebar-user__copy">
            <strong>{user?.nombre}</strong>
            <small>{user ? roleLabels[user.rol] : ''}</small>
          </span>
          <button aria-label="Cerrar sesión" className="sidebar-user__logout" onClick={handleLogout} type="button">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content" id="contenido-principal">
        <Outlet />
      </main>
    </div>
  )
}

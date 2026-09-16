import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { to: '/mesera', label: 'Mesera', description: 'Cuentas y comandas' },
  { to: '/recepcion', label: 'Recepción / Caja', description: 'Operación y cobros' },
  { to: '/cocina', label: 'Cocina', description: 'Comandas en tiempo real' },
  { to: '/corte-del-dia', label: 'Corte del día', description: 'Movimientos y control' },
  { to: '/administracion', label: 'Administración', description: 'Usuarios y permisos' },
]

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">功</span>
          <div>
            <strong>Kung Fu</strong>
            <span>Comandas</span>
          </div>
        </div>

        <nav aria-label="Áreas del sistema">
          <p className="nav-title">Áreas del sistema</p>
          <ul className="nav-list">
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                  to={item.to}
                >
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-note">
          <span className="status-dot" aria-hidden="true" />
          Estructura inicial
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { AdminRoute, AuthenticatedRoute, HomeRedirect, PermissionRoute } from '../components/auth/RouteGuards'
import { AdministrationPage } from '../pages/AdministrationPage'
import { DailyClosePage } from '../pages/DailyClosePage'
import { KitchenPage } from '../pages/KitchenPage'
import { LoginPage } from '../pages/LoginPage'
import { NoAccessPage } from '../pages/NoAccessPage'
import { ReceptionPage } from '../pages/ReceptionPage'
import { WaitressPage } from '../pages/WaitressPage'

const protect = (element: ReactNode, permissions: string[]) => (
  <PermissionRoute anyOf={permissions}>{element}</PermissionRoute>
)

export function App() {
  return (
    <Routes>
      <Route path="/iniciar-sesion" element={<LoginPage />} />
      <Route path="/sin-acceso" element={<AuthenticatedRoute><NoAccessPage /></AuthenticatedRoute>} />
      <Route element={<AuthenticatedRoute><AppShell /></AuthenticatedRoute>}>
        <Route index element={<HomeRedirect />} />
        <Route path="/mesera" element={protect(<WaitressPage />, ['cuentas.ver_propias', 'cuentas.ver_todas'])} />
        <Route path="/recepcion" element={protect(<ReceptionPage />, ['cuentas.ver_todas'])} />
        <Route path="/cocina" element={protect(<KitchenPage />, ['comandas.ver_cocina'])} />
        <Route path="/corte-del-dia" element={protect(<DailyClosePage />, ['reportes.ver'])} />
        <Route path="/administracion" element={<AdminRoute><AdministrationPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

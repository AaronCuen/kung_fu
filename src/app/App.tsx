import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { LoginPage } from '../pages/LoginPage'
import { AdministrationPage } from '../pages/AdministrationPage'
import { DailyClosePage } from '../pages/DailyClosePage'
import { KitchenPage } from '../pages/KitchenPage'
import { WaitressPage } from '../pages/WaitressPage'
import { ReceptionPage } from '../pages/ReceptionPage'

export function App() {
  return (
    <Routes>
      <Route path="/iniciar-sesion" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/mesera" replace />} />
        <Route path="/mesera" element={<WaitressPage />} />
        <Route path="/recepcion" element={<ReceptionPage />} />
        <Route path="/cocina" element={<KitchenPage />} />
        <Route path="/corte-del-dia" element={<DailyClosePage />} />
        <Route path="/administracion" element={<AdministrationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/mesera" replace />} />
    </Routes>
  )
}

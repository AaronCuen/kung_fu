import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getHomePath } from '../../auth/routing'

export function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoring } = useAuth()
  const location = useLocation()
  if (isRestoring) return <div className="app-loading"><span className="spinner" /><p>Preparando tu espacio…</p></div>
  if (!isAuthenticated) return <Navigate replace state={{ from: location }} to="/iniciar-sesion" />
  return children
}

export function PermissionRoute({ children, anyOf }: { children: ReactNode; anyOf: string[] }) {
  const { user, hasAnyPermission } = useAuth()
  if (!hasAnyPermission(...anyOf)) return <Navigate replace to={getHomePath(user)} />
  return children
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user?.rol !== 'ADMIN') return <Navigate replace to={getHomePath(user)} />
  return children
}

export function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate replace to={getHomePath(user)} />
}

import type { User } from '../types/api'

export function getHomePath(user: User | null) {
  const permissions = new Set(user?.permisos ?? [])
  if (permissions.has('cuentas.ver_propias')) return '/mesera'
  if (permissions.has('cuentas.ver_todas')) return '/recepcion'
  if (permissions.has('comandas.ver_cocina')) return '/cocina'
  if (permissions.has('reportes.ver')) return '/corte-del-dia'
  if (permissions.has('usuarios.ver') || permissions.has('catalogo.ver') || permissions.has('mesas.ver')) return '/administracion'
  return '/sin-acceso'
}

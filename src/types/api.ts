export type UserRole = 'ADMIN' | 'MESERA' | 'COCINA' | 'RECEPCIONISTA'
export type AccountType = 'MESA' | 'RECOGER' | 'ENTREGA'
export type AccountStatus = 'ABIERTA' | 'PAGADA' | 'CANCELADA'
export type CommandStatus = 'PREPARANDO' | 'LISTA' | 'CANCELADA'
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'
export type ProductConfiguration = 'NORMAL' | 'COMBO'

export interface User {
  id_usuario: number
  nombre: string
  usuario: string
  rol: UserRole
  activo: boolean
  permisos: string[]
  fecha_creacion?: string
}

export interface Permission {
  id_permiso: number
  codigo: string
  descripcion: string
}

export interface AuthResponse {
  usuario: User
  token: string
}

export interface LoginInput {
  usuario: string
  password: string
}

export interface SetupAdminInput extends LoginInput {
  nombre: string
}

export interface Category {
  id_categoria: number
  nombre: string
  activo?: boolean
}

export interface Product {
  id_producto: number
  id_categoria: number
  numero: number | null
  nombre: string
  descripcion: string | null
  configuracion: ProductConfiguration
  precio: number | string
  activo?: boolean
  categoria?: string
  presentaciones: ProductPresentation[]
  combo: ComboConfiguration | null
}

export interface ProductPresentation {
  id_presentacion: number
  id_producto: number
  nombre: string
  cantidad_piezas: number | null
  precio: number | string
}

export interface ComboOption {
  id_opcion: number
  id_producto: number
  nombre: string
}

export interface ComboConfiguration {
  id_producto: number
  cantidad_incluida: number
  cantidad_maxima: number
  precio_seleccion_extra: number | string
  opciones: ComboOption[]
}

export interface Extra {
  id_extra: number
  nombre: string
  precio: number | string
}

export interface RestaurantTable {
  id_mesa: number
  numero: number
  activa: boolean
}

export interface AccountTotals {
  total: number
  pagado: number
  pendiente: number
}

export interface Account {
  id_cuenta: number
  tipo: AccountType
  id_mesa: number | null
  numero_mesa?: number | null
  nombre_cliente: string | null
  telefono: string | null
  direccion: string | null
  id_usuario_creador: number
  creador_nombre?: string
  estado: AccountStatus
  fecha_apertura: string
  fecha_cierre: string | null
  total?: number
  pagado?: number
  pendiente?: number
}

export interface CreateAccountInput {
  tipo: AccountType
  id_mesa?: number
  nombre_cliente?: string
  telefono?: string
  direccion?: string
}

export interface CommandDetail {
  id_detalle?: number
  id_comanda?: number
  id_producto: number
  id_presentacion?: number | null
  producto: string
  cantidad: number
  precio_unitario: number | string
  nombre_presentacion?: string | null
  cargo_combo: number | string
  notas: string | null
  extras: Extra[]
  selecciones_combo: Array<{ id_detalle_opcion?: number; id_opcion: number | null; nombre: string; cantidad: number }>
}

export interface CreateCommandDetailInput {
  id_producto: number
  id_presentacion?: number
  cantidad: number
  notas?: string
  extras?: number[]
  selecciones_combo?: Array<{ id_opcion: number; cantidad: number }>
}

export interface Command {
  id_comanda: number
  id_cuenta: number
  numero_comanda: number
  estado: CommandStatus
  fecha_creacion: string
  fecha_lista: string | null
  fecha_cancelacion: string | null
  tipo?: AccountType
  nombre_cliente?: string | null
  telefono?: string | null
  direccion?: string | null
  numero_mesa?: number | null
  detalles: CommandDetail[]
}

export interface Payment {
  id_pago: number
  id_cuenta?: number
  monto: number | string
  metodo_pago: PaymentMethod
  fecha_pago: string
  id_usuario?: number
  usuario?: string
}

export interface AccountDetail extends Account {
  comandas: Command[]
  pagos: Payment[]
  totales: AccountTotals
}

export interface PaymentResponse {
  id_pago: number
  monto: number
  metodo_pago: PaymentMethod
  cuenta_pagada: boolean
  totales: AccountTotals
}

export interface DailySummary {
  fecha: string
  pagos: {
    efectivo: number
    tarjeta: number
    transferencia: number
    total: number
  }
  cuentas: {
    abiertas: number
    pagadas: number
    canceladas: number
  }
  comandas: {
    creadas: number
    canceladas: number
  }
  cerrado: boolean
  corte: Pick<DailyCut, 'id_corte' | 'fecha_corte' | 'id_usuario' | 'estado' | 'veces_reabierta' | 'fecha_ultima_reapertura' | 'id_usuario_ultima_reapertura' | 'usuario_ultima_reapertura'> | null
}

export interface DailyCut {
  id_corte: number
  fecha_operativa: string
  total_efectivo: number | string
  total_tarjeta: number | string
  total_transferencia: number | string
  total_general: number | string
  id_usuario: number
  usuario?: string
  fecha_corte: string
  estado: 'CERRADA' | 'REABIERTA'
  veces_reabierta: number
  fecha_ultima_reapertura: string | null
  id_usuario_ultima_reapertura: number | null
  usuario_ultima_reapertura?: string | null
}

export interface Movement {
  id_movimiento: number
  tipo: string
  entidad: string | null
  id_referencia: number | null
  id_cuenta: number | null
  id_comanda: number | null
  id_usuario: number | null
  usuario: string | null
  detalle: Record<string, unknown> | null
  fecha: string
}

export interface MessageResponse {
  message: string
}


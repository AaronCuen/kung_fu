export const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function formatCurrency(value: number | string | null | undefined) {
  return currency.format(Number(value || 0))
}

export function formatTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export function accountName(account: { tipo: string; numero_mesa?: number | null; nombre_cliente?: string | null }) {
  if (account.tipo === 'MESA') return `Mesa ${account.numero_mesa ?? '—'}`
  return account.nombre_cliente || (account.tipo === 'RECOGER' ? 'Pedido para recoger' : 'Entrega')
}

export function accountTypeLabel(type: string) {
  return { MESA: 'En mesa', RECOGER: 'Para recoger', ENTREGA: 'A domicilio' }[type] || type
}

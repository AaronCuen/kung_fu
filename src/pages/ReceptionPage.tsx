import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { Icon } from '../components/ui/Icon'
import { ModulePage } from '../components/ui/ModulePage'
import { StatCard } from '../components/ui/StatCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { AccountDetailsModal } from '../features/accounts/AccountDetailsModal'
import { CreateAccountModal } from '../features/accounts/CreateAccountModal'
import { api, getErrorMessage } from '../lib/api'
import { accountName, accountTypeLabel, formatCurrency, formatTime } from '../lib/format'
import type { Account } from '../types/api'

export function ReceptionPage() {
  const { hasPermission } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'TODAS' | 'ABIERTA' | 'PAGADA'>('ABIERTA')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)

  const loadAccounts = useCallback(async () => {
    setLoading(true); setError(null)
    try { setAccounts(await api.get<Account[]>('/accounts')) }
    catch (cause) { setError(getErrorMessage(cause)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadAccounts() }, [loadAccounts])

  const visibleAccounts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return accounts.filter((account) => {
      if (filter !== 'TODAS' && account.estado !== filter) return false
      if (!normalized) return true
      return `${account.id_cuenta} ${accountName(account)} ${account.telefono || ''}`.toLowerCase().includes(normalized)
    })
  }, [accounts, filter, query])

  const openAccounts = accounts.filter((account) => account.estado === 'ABIERTA')
  const paidAccounts = accounts.filter((account) => account.estado === 'PAGADA')
  const pendingTotal = openAccounts.reduce((sum, account) => sum + Number(account.pendiente || 0), 0)
  const salesTotal = paidAccounts.reduce((sum, account) => sum + Number(account.pagado || 0), 0)

  return (
    <ModulePage
      eyebrow="Recepción y caja"
      title="Control de cuentas"
      description="Consulta la operación, encuentra una cuenta y registra el cobro."
      action={hasPermission('cuentas.crear') ? <button className="button button--primary" onClick={() => setCreateOpen(true)} type="button"><Icon name="plus" size={18} />Nueva cuenta</button> : undefined}
    >
      <div className="stats-grid">
        <StatCard label="Cuentas abiertas" value={String(openAccounts.length)} detail="Pendientes de cerrar" icon="receipt" />
        <StatCard label="Cobrado" value={formatCurrency(salesTotal)} detail={`${paidAccounts.length} cuentas pagadas`} icon="cash" tone="gold" />
        <StatCard label="Saldo pendiente" value={formatCurrency(pendingTotal)} detail="En cuentas abiertas" icon="clock" tone="red" />
        <StatCard label="Cuentas totales" value={String(accounts.length)} detail="Registros visibles" icon="orders" tone="green" />
      </div>

      <section className="panel content-section" aria-labelledby="accounts-title">
        <div className="panel__header">
          <div><p className="section-kicker">Operación</p><h2 id="accounts-title">Cuentas</h2></div>
          <div className="toolbar">
            <label className="search-field"><span className="sr-only">Buscar cuenta</span><Icon name="search" size={18} /><input onChange={(event) => setQuery(event.target.value)} placeholder="Cuenta, cliente o teléfono" type="search" value={query} /></label>
            <select aria-label="Filtrar por estado" className="compact-select" onChange={(event) => setFilter(event.target.value as typeof filter)} value={filter}><option value="ABIERTA">Abiertas</option><option value="PAGADA">Pagadas</option><option value="TODAS">Todas</option></select>
          </div>
        </div>

        {loading ? <LoadingState label="Cargando cuentas…" /> : error ? <ErrorState message={error} onRetry={loadAccounts} /> : !visibleAccounts.length ? <EmptyState title="Sin resultados" message="No hay cuentas que coincidan con el filtro." /> : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Cuenta</th><th>Cliente</th><th>Tipo</th><th>Hora</th><th>Estado</th><th>Pendiente</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{visibleAccounts.map((account) => <tr key={account.id_cuenta}><td data-label="Cuenta"><strong>#{String(account.id_cuenta).padStart(3, '0')}</strong></td><td data-label="Cliente">{accountName(account)}</td><td data-label="Tipo" className="muted-cell">{accountTypeLabel(account.tipo)}</td><td data-label="Hora" className="numeric-cell">{formatTime(account.fecha_apertura)}</td><td data-label="Estado"><StatusBadge dot tone={account.estado === 'ABIERTA' ? 'red' : account.estado === 'PAGADA' ? 'green' : 'neutral'}>{account.estado}</StatusBadge></td><td data-label="Pendiente" className="numeric-cell"><strong>{formatCurrency(account.pendiente)}</strong></td><td><button className="icon-button icon-button--soft" aria-label={`Ver cuenta ${account.id_cuenta}`} onClick={() => setSelectedAccountId(account.id_cuenta)} type="button"><Icon name="arrow" size={17} /></button></td></tr>)}</tbody></table></div>
        )}
      </section>

      <CreateAccountModal onClose={() => setCreateOpen(false)} onCreated={(account) => { setCreateOpen(false); setSelectedAccountId(account.id_cuenta); void loadAccounts() }} open={createOpen} />
      <AccountDetailsModal accountId={selectedAccountId} onChanged={loadAccounts} onClose={() => setSelectedAccountId(null)} open={selectedAccountId !== null} />
    </ModulePage>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { Icon, type IconName } from '../components/ui/Icon'
import { ModulePage } from '../components/ui/ModulePage'
import { StatusBadge } from '../components/ui/StatusBadge'
import { AccountDetailsModal } from '../features/accounts/AccountDetailsModal'
import { CreateAccountModal } from '../features/accounts/CreateAccountModal'
import { api, getErrorMessage } from '../lib/api'
import { accountName, accountTypeLabel, formatCurrency, formatTime } from '../lib/format'
import type { Account } from '../types/api'

const serviceTypes: { title: string; detail: string; icon: IconName }[] = [
  { title: 'En mesa', detail: 'Asignar número de mesa', icon: 'dine-in' },
  { title: 'Para recoger', detail: 'Registrar nombre', icon: 'takeaway' },
  { title: 'A domicilio', detail: 'Nombre, teléfono y dirección', icon: 'delivery' },
]

export function WaitressPage() {
  const { user, hasPermission } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const canCreate = hasPermission('cuentas.crear')

  const loadAccounts = useCallback(async () => {
    setLoading(true); setError(null)
    try { setAccounts(await api.get<Account[]>('/accounts?estado=ABIERTA')) }
    catch (cause) { setError(getErrorMessage(cause)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadAccounts() }, [loadAccounts])

  return (
    <ModulePage
      eyebrow="Área de mesera"
      title={`Hola, ${user?.nombre.split(' ')[0] || 'bienvenida'}`}
      description="Abre una cuenta o continúa atendiendo las que ya están en curso."
      action={canCreate ? <button className="button button--primary" onClick={() => setCreateOpen(true)} type="button"><Icon name="plus" size={18} />Nueva cuenta</button> : undefined}
    >
      {canCreate && <section aria-labelledby="service-title">
        <div className="section-heading"><div><p className="section-kicker">Inicio rápido</p><h2 id="service-title">¿Cómo será el servicio?</h2></div></div>
        <div className="service-grid">
          {serviceTypes.map((service) => <button className="service-card" key={service.title} onClick={() => setCreateOpen(true)} type="button"><span className="service-card__icon"><Icon name={service.icon} size={24} /></span><span><strong>{service.title}</strong><small>{service.detail}</small></span><Icon className="service-card__arrow" name="arrow" size={18} /></button>)}
        </div>
      </section>}

      <section className="content-section" aria-labelledby="active-accounts-title">
        <div className="section-heading section-heading--inline"><div><p className="section-kicker">En curso</p><h2 id="active-accounts-title">Cuentas abiertas</h2></div><button className="button button--ghost button--compact" disabled={loading} onClick={() => void loadAccounts()} type="button">Actualizar</button></div>
        {loading ? <LoadingState label="Cargando cuentas…" /> : error ? <ErrorState message={error} onRetry={loadAccounts} /> : !accounts.length ? <EmptyState title="No hay cuentas abiertas" message="Cuando abras una cuenta aparecerá aquí." /> : (
          <div className="account-list">
            {accounts.map((account) => <article className="account-row" key={account.id_cuenta}><span className="account-row__number">#{String(account.id_cuenta).padStart(3, '0')}</span><div className="account-row__main"><div><h3>{accountName(account)}</h3><p>{accountTypeLabel(account.tipo)} · {formatTime(account.fecha_apertura)}</p></div><StatusBadge dot tone="red">Abierta</StatusBadge></div><strong className="account-row__total">{formatCurrency(account.total)}</strong><button className="icon-button icon-button--soft" aria-label={`Abrir ${accountName(account)}`} onClick={() => setSelectedAccountId(account.id_cuenta)} type="button"><Icon name="arrow" size={18} /></button></article>)}
          </div>
        )}
      </section>

      <CreateAccountModal onClose={() => setCreateOpen(false)} onCreated={(account) => { setCreateOpen(false); setSelectedAccountId(account.id_cuenta); void loadAccounts() }} open={createOpen} />
      <AccountDetailsModal accountId={selectedAccountId} onChanged={loadAccounts} onClose={() => setSelectedAccountId(null)} open={selectedAccountId !== null} />
    </ModulePage>
  )
}

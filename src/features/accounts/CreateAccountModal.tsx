import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, getErrorMessage } from '../../lib/api'
import type { Account, AccountType, CreateAccountInput, RestaurantTable } from '../../types/api'
import { ErrorState, LoadingState } from '../../components/ui/Feedback'
import { Icon } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (account: Account) => void
}

const services: { type: AccountType; label: string; detail: string; icon: 'dine-in' | 'takeaway' | 'delivery' }[] = [
  { type: 'MESA', label: 'En mesa', detail: 'Selecciona una mesa', icon: 'dine-in' },
  { type: 'RECOGER', label: 'Recoger', detail: 'Registra el nombre', icon: 'takeaway' },
  { type: 'ENTREGA', label: 'Domicilio', detail: 'Datos de entrega', icon: 'delivery' },
]

export function CreateAccountModal({ open, onClose, onCreated }: Props) {
  const [type, setType] = useState<AccountType>('MESA')
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [tableId, setTableId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loadingTables, setLoadingTables] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTables = useCallback(async () => {
    setLoadingTables(true)
    setError(null)
    try {
      const response = await api.get<RestaurantTable[]>('/tables')
      setTables(response.filter((table) => table.activa))
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setLoadingTables(false)
    }
  }, [])

  useEffect(() => {
    if (open) void loadTables()
  }, [loadTables, open])

  const reset = () => {
    setType('MESA'); setTableId(''); setName(''); setPhone(''); setAddress(''); setError(null)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const body: CreateAccountInput = { tipo: type }
    if (type === 'MESA') body.id_mesa = Number(tableId)
    if (type !== 'MESA') body.nombre_cliente = name
    if (type === 'ENTREGA') { body.telefono = phone; body.direccion = address }

    setSubmitting(true)
    setError(null)
    try {
      const created = await api.post<Account>('/accounts', body)
      onCreated(created)
      reset()
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal description="Elige el servicio y registra solamente los datos necesarios." onClose={handleClose} open={open} title="Nueva cuenta">
      <form className="stack-form" onSubmit={handleSubmit}>
        <div className="choice-grid">
          {services.map((service) => (
            <button className={`choice-card${type === service.type ? ' is-selected' : ''}`} key={service.type} onClick={() => setType(service.type)} type="button">
              <Icon name={service.icon} size={21} /><span><strong>{service.label}</strong><small>{service.detail}</small></span>
            </button>
          ))}
        </div>

        {loadingTables && type === 'MESA' ? <LoadingState label="Cargando mesas…" /> : (
          <div className="form-grid">
            {type === 'MESA' && (
              <label className="form-field form-field--full"><span>Mesa</span><select onChange={(event) => setTableId(event.target.value)} required value={tableId}><option value="">Selecciona una mesa</option>{tables.map((table) => <option key={table.id_mesa} value={table.id_mesa}>Mesa {table.numero}</option>)}</select></label>
            )}
            {type !== 'MESA' && <label className="form-field form-field--full"><span>Nombre del cliente</span><input onChange={(event) => setName(event.target.value)} placeholder="Nombre" required value={name} /></label>}
            {type === 'ENTREGA' && <><label className="form-field"><span>Teléfono</span><input onChange={(event) => setPhone(event.target.value)} placeholder="Teléfono" required type="tel" value={phone} /></label><label className="form-field"><span>Dirección</span><input onChange={(event) => setAddress(event.target.value)} placeholder="Dirección completa" required value={address} /></label></>}
          </div>
        )}

        {error && <ErrorState message={error} onRetry={type === 'MESA' ? loadTables : undefined} />}
        <div className="form-actions"><button className="button button--secondary" onClick={handleClose} type="button">Cancelar</button><button className="button button--primary" disabled={submitting || (type === 'MESA' && !tableId)} type="submit">{submitting ? 'Creando…' : 'Crear cuenta'}<Icon name="arrow" size={17} /></button></div>
      </form>
    </Modal>
  )
}

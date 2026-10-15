import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Feedback'
import { Icon } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { api, getErrorMessage } from '../../lib/api'
import { accountName, accountTypeLabel, formatCurrency, formatTime } from '../../lib/format'
import type { AccountDetail, CommandStatus, Extra, MessageResponse, PaymentMethod, PaymentResponse, Product } from '../../types/api'

type Props = {
  accountId: number | null
  open: boolean
  onClose: () => void
  onChanged: () => void
}

type CartItem = { quantity: number; notes: string; extraIds: number[]; presentationId: number | null; comboSelections: Record<number, number> }

const statusTone = (status: CommandStatus) => status === 'LISTA' ? 'green' : status === 'CANCELADA' ? 'neutral' : 'red'

export function AccountDetailsModal({ accountId, open, onClose, onChanged }: Props) {
  const { hasPermission } = useAuth()
  const [account, setAccount] = useState<AccountDetail | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [cart, setCart] = useState<Record<number, CartItem>>({})
  const [showComposer, setShowComposer] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCreateCommand = hasPermission('comandas.crear')
  const canPay = hasPermission('pagos.registrar')
  const canCancelCommand = hasPermission('comandas.cancelar')
  const canCancelAccount = hasPermission('cuentas.cancelar')

  const loadAccount = useCallback(async () => {
    if (!accountId) return
    setLoading(true)
    setError(null)
    try {
      const detail = await api.get<AccountDetail>(`/accounts/${accountId}`)
      setAccount(detail)
      setPaymentAmount(String(detail.totales.pendiente || ''))
      if (canCreateCommand) {
        const [productRows, extraRows] = await Promise.all([
          api.get<Product[]>('/products'),
          api.get<Extra[]>('/extras'),
        ])
        setProducts(productRows)
        setExtras(extraRows)
      }
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [accountId, canCreateCommand])

  useEffect(() => {
    if (open) void loadAccount()
    else { setAccount(null); setCart({}); setShowComposer(false); setError(null) }
  }, [loadAccount, open])

  const cartProducts = useMemo(() => products.filter((product) => cart[product.id_producto]), [cart, products])
  const extrasById = useMemo(() => new Map(extras.map((extra) => [extra.id_extra, extra])), [extras])
  const cartTotal = cartProducts.reduce((sum, product) => {
    const item = cart[product.id_producto]
    const extrasTotal = item.extraIds.reduce((extraSum, extraId) => extraSum + Number(extrasById.get(extraId)?.precio || 0), 0)
    const presentationPrice = product.presentaciones.find((presentation) => presentation.id_presentacion === item.presentationId)?.precio
    const selectedComboCount = Object.values(item.comboSelections).reduce((count, quantity) => count + quantity, 0)
    const comboCharge = product.combo
      ? Math.max(0, selectedComboCount - product.combo.cantidad_incluida) * Number(product.combo.precio_seleccion_extra)
      : 0
    return sum + (Number(presentationPrice ?? product.precio) + extrasTotal + comboCharge) * item.quantity
  }, 0)

  const changeQuantity = (product: Product, delta: number) => {
    setCart((current) => {
      const quantity = (current[product.id_producto]?.quantity || 0) + delta
      if (quantity <= 0) {
        const next = { ...current }
        delete next[product.id_producto]
        return next
      }
      return { ...current, [product.id_producto]: { quantity, notes: current[product.id_producto]?.notes || '', extraIds: current[product.id_producto]?.extraIds || [], presentationId: current[product.id_producto]?.presentationId || null, comboSelections: current[product.id_producto]?.comboSelections || {} } }
    })
  }

  const toggleExtra = (productId: number, extraId: number) => {
    setCart((current) => {
      const item = current[productId]
      if (!item) return current
      const extraIds = item.extraIds.includes(extraId)
        ? item.extraIds.filter((selectedId) => selectedId !== extraId)
        : [...item.extraIds, extraId]
      return { ...current, [productId]: { ...item, extraIds } }
    })
  }

  const changeComboSelection = (product: Product, optionId: number, delta: number) => {
    setCart((current) => {
      const item = current[product.id_producto]
      if (!item || !product.combo) return current
      const total = Object.values(item.comboSelections).reduce((sum, quantity) => sum + quantity, 0)
      const quantity = Math.max(0, (item.comboSelections[optionId] || 0) + delta)
      if (delta > 0 && total >= product.combo.cantidad_maxima) return current
      const comboSelections = { ...item.comboSelections }
      if (quantity === 0) delete comboSelections[optionId]
      else comboSelections[optionId] = quantity
      return { ...current, [product.id_producto]: { ...item, comboSelections } }
    })
  }

  const saveCommand = async () => {
    if (!accountId || !cartProducts.length) return
    const incompleteCombo = cartProducts.find((product) => product.combo && Object.values(cart[product.id_producto].comboSelections).reduce((sum, quantity) => sum + quantity, 0) < product.combo.cantidad_incluida)
    if (incompleteCombo?.combo) {
      setError(`${incompleteCombo.nombre} necesita ${incompleteCombo.combo.cantidad_incluida} elecciones.`)
      return
    }
    setSaving(true); setError(null)
    try {
      await api.post(`/accounts/${accountId}/commands`, {
        detalles: cartProducts.map((product) => ({ id_producto: product.id_producto, id_presentacion: cart[product.id_producto].presentationId || undefined, cantidad: cart[product.id_producto].quantity, notas: cart[product.id_producto].notes || undefined, extras: cart[product.id_producto].extraIds, selecciones_combo: Object.entries(cart[product.id_producto].comboSelections).map(([optionId, quantity]) => ({ id_opcion: Number(optionId), cantidad: quantity })) })),
      })
      setCart({}); setShowComposer(false)
      await loadAccount(); onChanged()
    } catch (cause) { setError(getErrorMessage(cause)) } finally { setSaving(false) }
  }

  const registerPayment = async (event: FormEvent) => {
    event.preventDefault()
    if (!accountId) return
    setSaving(true); setError(null)
    try {
      await api.post<PaymentResponse>(`/accounts/${accountId}/payments`, { monto: Number(paymentAmount), metodo_pago: paymentMethod })
      await loadAccount(); onChanged()
    } catch (cause) { setError(getErrorMessage(cause)) } finally { setSaving(false) }
  }

  const cancelCommand = async (commandId: number) => {
    if (!window.confirm('¿Cancelar esta comanda? Esta acción quedará registrada.')) return
    setSaving(true); setError(null)
    try {
      await api.patch(`/commands/${commandId}/status`, { estado: 'CANCELADA' })
      await loadAccount(); onChanged()
    } catch (cause) { setError(getErrorMessage(cause)) } finally { setSaving(false) }
  }

  const cancelAccount = async () => {
    if (!accountId || !window.confirm('¿Cancelar toda la cuenta? No debe tener pagos registrados.')) return
    setSaving(true); setError(null)
    try {
      await api.post<MessageResponse>(`/accounts/${accountId}/cancel`)
      await loadAccount(); onChanged()
    } catch (cause) { setError(getErrorMessage(cause)) } finally { setSaving(false) }
  }

  return (
    <Modal description={account ? `${accountTypeLabel(account.tipo)} · abierta a las ${formatTime(account.fecha_apertura)}` : 'Consulta de cuenta'} onClose={onClose} open={open} size="large" title={account ? accountName(account) : 'Detalle de cuenta'}>
      {loading && !account ? <LoadingState label="Cargando cuenta…" /> : error && !account ? <ErrorState message={error} onRetry={loadAccount} /> : account && (
        <div className="account-detail">
          <div className="account-detail__summary">
            <div><span>Estado</span><StatusBadge dot tone={account.estado === 'ABIERTA' ? 'red' : account.estado === 'PAGADA' ? 'green' : 'neutral'}>{account.estado}</StatusBadge></div>
            <div><span>Total</span><strong>{formatCurrency(account.totales.total)}</strong></div>
            <div><span>Pagado</span><strong>{formatCurrency(account.totales.pagado)}</strong></div>
            <div><span>Pendiente</span><strong className="account-detail__pending">{formatCurrency(account.totales.pendiente)}</strong></div>
          </div>

          {error && <ErrorState message={error} />}

          <div className="account-detail__columns">
            <section className="detail-section">
              <div className="detail-section__header"><div><p className="section-kicker">Historial</p><h3>Comandas</h3></div>{canCreateCommand && account.estado === 'ABIERTA' && <button className="button button--secondary button--compact" onClick={() => setShowComposer((value) => !value)} type="button"><Icon name="plus" size={16} />Agregar</button>}</div>
              {!account.comandas.length ? <EmptyState title="Sin comandas" message="Agrega los primeros platillos de esta cuenta." /> : (
                <div className="command-history">{account.comandas.map((command) => <article className="command-card" key={command.id_comanda}><header><div><strong>Comanda #{command.numero_comanda}</strong><span>{formatTime(command.fecha_creacion)}</span></div><StatusBadge tone={statusTone(command.estado)}>{command.estado}</StatusBadge></header><ul>{command.detalles.map((detail) => { const extraTotal = detail.extras.reduce((sum, extra) => sum + Number(extra.precio), 0); return <li key={detail.id_detalle ?? `${command.id_comanda}-${detail.id_producto}`}><span><strong>{detail.cantidad}×</strong> {detail.producto}{detail.nombre_presentacion && <small>{detail.nombre_presentacion}</small>}{detail.selecciones_combo.length > 0 && <small className="combo-summary">{detail.selecciones_combo.map((selection) => `${selection.cantidad}× ${selection.nombre}`).join(', ')}</small>}{detail.extras.length > 0 && <small className="extra-summary">+ {detail.extras.map((extra) => extra.nombre).join(', ')}</small>}{detail.notas && <small>{detail.notas}</small>}</span><span>{formatCurrency((Number(detail.precio_unitario) + Number(detail.cargo_combo) + extraTotal) * detail.cantidad)}</span></li> })}</ul>{canCancelCommand && command.estado !== 'CANCELADA' && account.estado === 'ABIERTA' && !account.pagos.length && <button className="text-danger" disabled={saving} onClick={() => void cancelCommand(command.id_comanda)} type="button">Cancelar comanda</button>}</article>)}</div>
              )}
            </section>

            <aside className="detail-section detail-section--payment">
              <div className="detail-section__header"><div><p className="section-kicker">Caja</p><h3>Pagos</h3></div></div>
              {account.pagos.length > 0 && <div className="payment-history">{account.pagos.map((payment) => <div key={payment.id_pago}><span>{payment.metodo_pago}<small>{formatTime(payment.fecha_pago)}</small></span><strong>{formatCurrency(payment.monto)}</strong></div>)}</div>}
              {canPay && account.estado === 'ABIERTA' && account.totales.pendiente > 0 && <form className="payment-form" onSubmit={registerPayment}><label className="form-field"><span>Método de pago</span><select onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} value={paymentMethod}><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="TRANSFERENCIA">Transferencia</option></select></label><label className="form-field"><span>Monto</span><input max={account.totales.pendiente} min="0.01" onChange={(event) => setPaymentAmount(event.target.value)} required step="0.01" type="number" value={paymentAmount} /></label><button className="button button--primary button--wide" disabled={saving} type="submit"><Icon name="cash" size={17} />Registrar pago</button></form>}
              {!canPay && !account.pagos.length && <p className="muted-message">Aún no hay pagos registrados.</p>}
              {canCancelAccount && account.estado === 'ABIERTA' && account.totales.pagado === 0 && <button className="text-danger text-danger--standalone" disabled={saving} onClick={() => void cancelAccount()} type="button">Cancelar cuenta completa</button>}
            </aside>
          </div>

          {showComposer && <section className="command-composer"><div className="detail-section__header"><div><p className="section-kicker">Nueva comanda</p><h3>Selecciona el menú</h3></div><strong>{formatCurrency(cartTotal)}</strong></div>{!products.length ? <EmptyState title="Menú vacío" message="El administrador debe agregar productos antes de tomar comandas." /> : <div className="product-picker">{products.map((product) => {
            const selected = cart[product.id_producto]
            const comboCount = selected ? Object.values(selected.comboSelections).reduce((sum, quantity) => sum + quantity, 0) : 0
            return <article className={selected ? 'is-selected' : ''} key={product.id_producto}>
              <div><strong>{product.numero ? `#${product.numero} · ` : ''}{product.nombre}</strong><small>{product.categoria} · {formatCurrency(product.precio)}</small></div>
              <div className="quantity-control"><button aria-label={`Quitar ${product.nombre}`} onClick={() => changeQuantity(product, -1)} type="button"><Icon name="minus" size={14} /></button><span>{selected?.quantity || 0}</span><button aria-label={`Agregar ${product.nombre}`} onClick={() => changeQuantity(product, 1)} type="button"><Icon name="plus" size={14} /></button></div>
              {selected && <>
                {product.presentaciones.length > 0 && <label className="product-option-field"><span>Presentación</span><select onChange={(event) => setCart((current) => ({ ...current, [product.id_producto]: { ...selected, presentationId: event.target.value ? Number(event.target.value) : null } }))} value={selected.presentationId || ''}><option value="">Base · {formatCurrency(product.precio)}</option>{product.presentaciones.map((presentation) => <option key={presentation.id_presentacion} value={presentation.id_presentacion}>{presentation.nombre}{presentation.cantidad_piezas ? ` (${presentation.cantidad_piezas} piezas)` : ''} · {formatCurrency(presentation.precio)}</option>)}</select></label>}
                {product.combo && <div className="combo-picker"><div><strong>Elige {product.combo.cantidad_incluida}</strong><small>{comboCount}/{product.combo.cantidad_maxima} seleccionados{comboCount > product.combo.cantidad_incluida ? ` · +${formatCurrency(product.combo.precio_seleccion_extra)}` : ''}</small></div>{product.combo.opciones.map((option) => <div className="combo-option" key={option.id_opcion}><span>{option.nombre}</span><div className="quantity-control"><button onClick={() => changeComboSelection(product, option.id_opcion, -1)} type="button"><Icon name="minus" size={13} /></button><span>{selected.comboSelections[option.id_opcion] || 0}</span><button disabled={comboCount >= product.combo!.cantidad_maxima} onClick={() => changeComboSelection(product, option.id_opcion, 1)} type="button"><Icon name="plus" size={13} /></button></div></div>)}</div>}
                {extras.length > 0 && <div className="extra-picker">{extras.map((extra) => <label className={selected.extraIds.includes(extra.id_extra) ? 'is-selected' : ''} key={extra.id_extra}><input checked={selected.extraIds.includes(extra.id_extra)} onChange={() => toggleExtra(product.id_producto, extra.id_extra)} type="checkbox" /><span>{extra.nombre}<small>+{formatCurrency(extra.precio)}</small></span></label>)}</div>}
                <input onChange={(event) => setCart((current) => ({ ...current, [product.id_producto]: { ...selected, notes: event.target.value } }))} placeholder="Nota opcional" value={selected.notes} />
              </>}
            </article>
          })}</div>}<div className="form-actions"><button className="button button--secondary" onClick={() => { setShowComposer(false); setCart({}) }} type="button">Cancelar</button><button className="button button--primary" disabled={saving || !cartProducts.length} onClick={() => void saveCommand()} type="button">{saving ? 'Enviando…' : 'Enviar a cocina'}<Icon name="chef" size={17} /></button></div></section>}
        </div>
      )}
    </Modal>
  )
}

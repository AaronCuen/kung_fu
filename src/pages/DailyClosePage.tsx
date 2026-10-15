import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { Icon } from '../components/ui/Icon'
import { Modal } from '../components/ui/Modal'
import { ModulePage } from '../components/ui/ModulePage'
import { StatCard } from '../components/ui/StatCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { api, toQuery } from '../lib/api'
import type { DailyCut, DailySummary, Movement } from '../types/api'

type View = 'today' | 'history'
type HistoryReport = {
  desde: string
  hasta: string
  pagos: { efectivo: number; tarjeta: number; transferencia: number; total: number }
  cuentas: { total: number; pagadas: number; canceladas: number; abiertas: number }
  comandas: { total: number; canceladas: number }
  cortes: DailyCut[]
  movimientos: Movement[]
}

function operationalDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Hermosillo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const dateLabel = new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Hermosillo', day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeLabel = new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Hermosillo', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
const timeLabel = new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Hermosillo', hour: '2-digit', minute: '2-digit', hour12: false })

function parseServerDate(value: string) {
  return new Date(value.includes('T') ? value : value.replace(' ', 'T'))
}

function displayDate(value: string) {
  return dateLabel.format(new Date(`${value}T12:00:00-07:00`))
}

function movementDescription(movement: Movement) {
  const descriptions: Record<string, string> = {
    PAGO_REGISTRADO: `Pago de cuenta #${movement.id_cuenta}`,
    COMANDA_CANCELADA: `Comanda #${movement.id_comanda} cancelada`,
    COMANDA_CREADA: `Comanda #${movement.id_comanda} creada`,
    CUENTA_CREADA: `Cuenta #${movement.id_cuenta} creada`,
    CUENTA_CANCELADA: `Cuenta #${movement.id_cuenta} cancelada`,
    CORTE_REALIZADO: 'Corte del día realizado',
    CORTE_REABIERTO: 'Caja reabierta',
    USUARIO_CREADO: 'Usuario creado',
  }
  return descriptions[movement.tipo] || movement.tipo.toLowerCase().replaceAll('_', ' ')
}

function movementAmount(movement: Movement) {
  const amount = Number(movement.detalle?.monto)
  return Number.isFinite(amount) ? money.format(amount) : null
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00-07:00`)
  value.setDate(value.getDate() + days)
  return value.toLocaleDateString('en-CA', { timeZone: 'America/Hermosillo' })
}

export function DailyClosePage() {
  const { hasPermission } = useAuth()
  const canCloseDay = hasPermission('cortes.realizar')
  const today = useMemo(operationalDate, [])
  const [view, setView] = useState<View>('today')
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [todayMovements, setTodayMovements] = useState<Movement[]>([])
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [history, setHistory] = useState<HistoryReport | null>(null)
  const [loadingToday, setLoadingToday] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [closing, setClosing] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [confirmReopen, setConfirmReopen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadToday = useCallback(async () => {
    setLoadingToday(true); setError(null)
    try {
      const query = toQuery({ fecha: today })
      const [daily, movements] = await Promise.all([
        api.get<DailySummary>(`/reports/daily${query}`),
        api.get<Movement[]>(`/reports/movements${query}`),
      ])
      setSummary(daily); setTodayMovements(movements)
    } catch (cause) { setError(errorMessage(cause)) } finally { setLoadingToday(false) }
  }, [today])

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true); setError(null)
    try {
      setHistory(await api.get<HistoryReport>(`/reports/history${toQuery({ desde: fromDate, hasta: toDate })}`))
    } catch (cause) { setError(errorMessage(cause)) } finally { setLoadingHistory(false) }
  }, [fromDate, toDate])

  useEffect(() => { void loadToday() }, [loadToday])
  useEffect(() => { if (view === 'history' && !history) void loadHistory() }, [history, loadHistory, view])

  const closeDay = async () => {
    if (!canCloseDay || !summary || summary.cerrado || summary.cuentas.abiertas > 0) return
    setClosing(true); setError(null)
    try {
      await api.post('/reports/daily-cuts', { fecha: today })
      setConfirmClose(false)
      await loadToday()
      setHistory(null)
    } catch (cause) { setError(errorMessage(cause)); setConfirmClose(false) } finally { setClosing(false) }
  }

  const reopenDay = async () => {
    if (!canCloseDay || !summary?.cerrado) return
    setReopening(true); setError(null)
    try {
      await api.patch(`/reports/daily-cuts/${today}/reopen`)
      setConfirmReopen(false)
      await loadToday()
      setHistory(null)
    } catch (cause) { setError(errorMessage(cause)); setConfirmReopen(false) } finally { setReopening(false) }
  }

  const quickRange = (kind: 'today' | 'week' | 'month') => {
    if (kind === 'today') { setFromDate(today); setToDate(today); return }
    if (kind === 'week') { setFromDate(addDays(today, -6)); setToDate(today); return }
    setFromDate(`${today.slice(0, 8)}01`); setToDate(today)
  }

  const generatePdf = async () => {
    if (!history) return
    const { jsPDF } = await import('jspdf')
    const document = new jsPDF({ unit: 'mm', format: 'letter' })
    const pageHeight = document.internal.pageSize.getHeight()
    let y = 18
    const line = (text: string, size = 10, bold = false, indent = 0) => {
      if (y > pageHeight - 16) { document.addPage(); y = 18 }
      document.setFont('helvetica', bold ? 'bold' : 'normal')
      document.setFontSize(size)
      const wrapped = document.splitTextToSize(text, 180 - indent)
      document.text(wrapped, 16 + indent, y)
      y += wrapped.length * (size * 0.42) + 2
    }

    document.setTextColor(104, 23, 29)
    line('Kung Fu · Reporte de caja', 18, true)
    document.setTextColor(38, 26, 24)
    line(history.desde === history.hasta ? displayDate(history.desde) : `${displayDate(history.desde)} al ${displayDate(history.hasta)}`, 11)
    y += 3
    line(`Venta total: ${money.format(history.pagos.total)}`, 13, true)
    line(`Efectivo: ${money.format(history.pagos.efectivo)}   Tarjeta: ${money.format(history.pagos.tarjeta)}   Transferencia: ${money.format(history.pagos.transferencia)}`, 9)
    line(`Cuentas: ${history.cuentas.total}   Pagadas: ${history.cuentas.pagadas}   Canceladas: ${history.cuentas.canceladas}`, 9)
    line(`Comandas: ${history.comandas.total}   Canceladas: ${history.comandas.canceladas}`, 9)
    y += 4
    line('Cortes de caja', 12, true)
    if (!history.cortes.length) line('No hay cortes registrados en este periodo.', 9)
    history.cortes.forEach((cut) => line(`${cut.fecha_operativa} · ${cut.estado === 'REABIERTA' ? 'Reabierta' : 'Cerrada'} · ${money.format(Number(cut.total_general))} · ${cut.usuario || 'Sin usuario'}`, 9, false, 2))
    y += 4
    line('Movimientos', 12, true)
    if (!history.movimientos.length) line('No hay movimientos registrados en este periodo.', 9)
    history.movimientos.forEach((movement) => {
      const amount = movementAmount(movement)
      line(`${dateTimeLabel.format(parseServerDate(movement.fecha))} · ${movementDescription(movement)}${amount ? ` · ${amount}` : ''} · ${movement.usuario || 'Sistema'}`, 8, false, 2)
    })
    document.save(`reporte-caja-${history.desde}-${history.hasta}.pdf`)
  }

  const percentage = (amount: number) => summary?.pagos.total ? `${Math.round((amount / summary.pagos.total) * 100)}% de las ventas` : '0% de las ventas'
  const readyToClose = Boolean(summary && !summary.cerrado && summary.cuentas.abiertas === 0)

  return <ModulePage eyebrow="Caja y control" title="Cortes de caja" description="Cierra la jornada o consulta el historial sin mezclar ambas tareas.">
    <div className="admin-tabs close-tabs" role="tablist"><button className={view === 'today' ? 'is-active' : ''} onClick={() => setView('today')} type="button"><Icon name="receipt" size={18} />Cierre de hoy</button><button className={view === 'history' ? 'is-active' : ''} onClick={() => setView('history')} type="button"><Icon name="calendar" size={18} />Historial y PDF</button></div>

    {error && <div className="admin-message"><ErrorState message={error} onRetry={view === 'today' ? loadToday : loadHistory} /></div>}

    {view === 'today' ? loadingToday || !summary ? <LoadingState label="Calculando el resumen del día…" /> : <>
      <div className="stats-grid stats-grid--close"><StatCard label="Venta total" value={money.format(summary.pagos.total)} detail={`${summary.cuentas.pagadas} cuentas pagadas`} icon="cash" tone="gold" /><StatCard label="Efectivo" value={money.format(summary.pagos.efectivo)} detail={percentage(summary.pagos.efectivo)} icon="cash" tone="green" /><StatCard label="Tarjeta" value={money.format(summary.pagos.tarjeta)} detail={percentage(summary.pagos.tarjeta)} icon="cash" /><StatCard label="Transferencia" value={money.format(summary.pagos.transferencia)} detail={percentage(summary.pagos.transferencia)} icon="cash" tone="red" /></div>
      <div className="close-readiness content-section"><div className={`readiness-card ${summary.cerrado ? 'is-closed' : readyToClose ? 'is-ready' : 'is-blocked'}`}><span><Icon name={summary.cerrado || readyToClose ? 'check' : 'clock'} size={24} /></span><div><p className="section-kicker">{displayDate(today)}</p><h2>{summary.cerrado ? 'La jornada está cerrada' : readyToClose ? 'Todo listo para realizar el corte' : 'Hay cuentas pendientes'}</h2><p>{summary.cerrado ? canCloseDay ? 'La operación está bloqueada. Puedes reabrir la caja si necesitas corregir o registrar algo más.' : 'Los totales quedaron guardados. Tienes acceso de consulta.' : readyToClose ? canCloseDay ? 'No quedan cuentas abiertas. Revisa los totales y confirma el cierre.' : 'No quedan cuentas abiertas. Tienes acceso de consulta al resumen.' : `Debes cobrar o cancelar ${summary.cuentas.abiertas} cuenta(s) antes de cerrar.`}</p>{summary.corte?.veces_reabierta ? <small>Esta caja se ha reabierto {summary.corte.veces_reabierta} vez/veces.</small> : null}</div><button className={`button ${summary.cerrado ? 'button--secondary' : 'button--primary'}`} disabled={!canCloseDay || (!summary.cerrado && !readyToClose)} onClick={() => summary.cerrado ? setConfirmReopen(true) : setConfirmClose(true)} type="button"><Icon name={summary.cerrado ? 'clock' : 'receipt'} size={18} />{summary.cerrado ? canCloseDay ? 'Reabrir caja' : 'Solo consulta' : canCloseDay ? 'Revisar y cerrar' : 'Solo consulta'}</button></div></div>
      <section className="panel content-section"><div className="panel__header"><div><p className="section-kicker">Actividad de hoy</p><h2>Movimientos</h2></div><StatusBadge tone="neutral">{todayMovements.length}</StatusBadge></div>{!todayMovements.length ? <EmptyState title="Sin movimientos" message="Todavía no hay actividad registrada para hoy." /> : <div className="movement-list">{todayMovements.map((movement) => <article className="movement-row" key={movement.id_movimiento}><time>{timeLabel.format(parseServerDate(movement.fecha))}</time><div><strong>{movementDescription(movement)}</strong><span>{movement.usuario || 'Sistema'}</span></div><strong className={movementAmount(movement) ? 'positive-value' : ''}>{movementAmount(movement) || '—'}</strong></article>)}</div>}</section>
    </> : <>
      <section className="panel report-filters"><div><p className="section-kicker">Periodo</p><h2>Buscar historial</h2></div><div className="quick-ranges"><button onClick={() => quickRange('today')} type="button">Hoy</button><button onClick={() => quickRange('week')} type="button">Últimos 7 días</button><button onClick={() => quickRange('month')} type="button">Este mes</button></div><label className="form-field"><span>Desde</span><input max={today} onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} /></label><label className="form-field"><span>Hasta</span><input max={today} min={fromDate} onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} /></label><button className="button button--primary" disabled={loadingHistory || fromDate > toDate} onClick={() => void loadHistory()} type="button"><Icon name="search" size={17} />Consultar</button></section>
      {loadingHistory ? <LoadingState label="Buscando cortes y movimientos…" /> : history ? <><div className="report-heading content-section"><div><p className="section-kicker">Resultado</p><h2>{history.desde === history.hasta ? displayDate(history.desde) : `${displayDate(history.desde)} — ${displayDate(history.hasta)}`}</h2></div><button className="button button--secondary" onClick={generatePdf} type="button"><Icon name="receipt" size={18} />Generar PDF</button></div><div className="stats-grid"><StatCard label="Venta del periodo" value={money.format(history.pagos.total)} detail={`${history.cuentas.pagadas} cuentas pagadas`} icon="cash" tone="gold" /><StatCard label="Cortes encontrados" value={String(history.cortes.length)} detail="Registros de corte" icon="receipt" /><StatCard label="Movimientos" value={String(history.movimientos.length)} detail="Registros de actividad" icon="orders" tone="green" /></div><div className="history-layout content-section"><section className="panel"><div className="panel__header"><div><p className="section-kicker">Caja</p><h2>Cortes realizados</h2></div></div>{!history.cortes.length ? <EmptyState title="Sin cortes" message="No hay cierres dentro de estas fechas." /> : <div className="cut-list">{history.cortes.map((cut) => <article key={cut.id_corte}><time>{displayDate(cut.fecha_operativa)}</time><div><strong>{money.format(Number(cut.total_general))}</strong><small>{cut.usuario || 'Sin usuario'} · {dateTimeLabel.format(parseServerDate(cut.fecha_corte))} · {cut.estado === 'REABIERTA' ? 'Reabierta' : 'Cerrada'}</small></div><span><small>Efectivo</small>{money.format(Number(cut.total_efectivo))}</span></article>)}</div>}</section><section className="panel"><div className="panel__header"><div><p className="section-kicker">Auditoría</p><h2>Movimientos</h2></div><StatusBadge tone="neutral">{history.movimientos.length}</StatusBadge></div>{!history.movimientos.length ? <EmptyState title="Sin movimientos" message="No se encontró actividad en este periodo." /> : <div className="movement-list movement-list--scroll">{history.movimientos.map((movement) => <article className="movement-row" key={movement.id_movimiento}><time>{dateTimeLabel.format(parseServerDate(movement.fecha))}</time><div><strong>{movementDescription(movement)}</strong><span>{movement.usuario || 'Sistema'}</span></div><strong className={movementAmount(movement) ? 'positive-value' : ''}>{movementAmount(movement) || '—'}</strong></article>)}</div>}</section></div></> : <EmptyState title="Selecciona un periodo" message="Consulta un día completo o un rango de fechas." />}
    </>}

    <Modal description="Esta acción bloquea nuevas cuentas, comandas y pagos para hoy." onClose={() => setConfirmClose(false)} open={confirmClose} size="small" title="Confirmar corte del día"><div className="close-confirmation"><div><span>Venta total</span><strong>{money.format(summary?.pagos.total || 0)}</strong></div><div><span>Cuentas abiertas</span><strong>{summary?.cuentas.abiertas || 0}</strong></div><div><span>Pagadas</span><strong>{summary?.cuentas.pagadas || 0}</strong></div><p><Icon name="check" size={17} />Los totales se guardarán en el historial de cortes.</p><div className="form-actions"><button className="button button--secondary" onClick={() => setConfirmClose(false)} type="button">Volver</button><button className="button button--primary" disabled={closing} onClick={() => void closeDay()} type="button">{closing ? 'Cerrando…' : 'Confirmar corte'}</button></div></div></Modal>
    <Modal description="La caja volverá a aceptar cuentas, comandas y pagos durante el día de hoy." onClose={() => setConfirmReopen(false)} open={confirmReopen} size="small" title="¿Reabrir la caja?"><div className="close-confirmation"><div><span>Fecha operativa</span><strong>{displayDate(today)}</strong></div><div><span>Último total cerrado</span><strong>{money.format(summary?.pagos.total || 0)}</strong></div><p><Icon name="clock" size={17} />La reapertura quedará registrada con tu usuario y hora.</p><div className="form-actions"><button className="button button--secondary" onClick={() => setConfirmReopen(false)} type="button">Cancelar</button><button className="button button--primary" disabled={reopening} onClick={() => void reopenDay()} type="button">{reopening ? 'Reabriendo…' : 'Sí, reabrir caja'}</button></div></div></Modal>
  </ModulePage>
}

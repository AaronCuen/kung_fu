import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/ui/Icon'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { ModulePage } from '../components/ui/ModulePage'
import { StatusBadge } from '../components/ui/StatusBadge'
import { api } from '../lib/api'
import { createAppSocket } from '../lib/socket'

type CommandStatus = 'PREPARANDO' | 'LISTA' | 'CANCELADA'

type CommandDetail = {
  id_detalle: number
  cantidad: number
  producto: string
  nombre_presentacion: string | null
  notas: string | null
  extras: Array<{ nombre: string; precio: number | string }>
  selecciones_combo: Array<{ nombre: string; cantidad: number }>
}

type KitchenCommand = {
  id_comanda: number
  id_cuenta: number
  numero_comanda: number
  estado: CommandStatus
  fecha_creacion: string
  tipo: 'MESA' | 'RECOGER' | 'ENTREGA'
  nombre_cliente: string | null
  numero_mesa: number | null
  detalles: CommandDetail[]
}

const filters: Array<{ status: CommandStatus; label: string }> = [
  { status: 'PREPARANDO', label: 'Preparando' },
  { status: 'LISTA', label: 'Listas' },
  { status: 'CANCELADA', label: 'Canceladas' },
]

function destination(command: KitchenCommand) {
  if (command.tipo === 'MESA') return `Mesa ${command.numero_mesa ?? 'sin número'}`
  if (command.tipo === 'RECOGER') return `Recoger · ${command.nombre_cliente ?? 'Cliente'}`
  return `Domicilio · ${command.nombre_cliente ?? 'Cliente'}`
}

function elapsedMinutes(date: string, now: number) {
  const elapsed = Math.max(0, Math.floor((now - new Date(date).getTime()) / 60_000))
  return `${String(elapsed).padStart(2, '0')} min`
}

function ticketTone(date: string, now: number): 'green' | 'gold' | 'red' {
  const minutes = Math.max(0, (now - new Date(date).getTime()) / 60_000)
  if (minutes >= 18) return 'red'
  if (minutes >= 10) return 'gold'
  return 'green'
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

export function KitchenPage() {
  const [commands, setCommands] = useState<Record<CommandStatus, KitchenCommand[]>>({
    PREPARANDO: [],
    LISTA: [],
    CANCELADA: [],
  })
  const [activeStatus, setActiveStatus] = useState<CommandStatus>('PREPARANDO')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  const loadCommands = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const results = await Promise.all(
        filters.map(({ status }) => api.get<KitchenCommand[]>(`/kitchen/commands?estado=${status}`)),
      )
      setCommands({ PREPARANDO: results[0], LISTA: results[1], CANCELADA: results[2] })
      setError(null)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCommands(true)
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    const socket = createAppSocket()
    const refresh = () => { void loadCommands() }
    socket.on('comanda:creada', refresh)
    socket.on('comanda:actualizada', refresh)
    socket.connect()
    return () => {
      window.clearInterval(timer)
      socket.off('comanda:creada', refresh)
      socket.off('comanda:actualizada', refresh)
      socket.disconnect()
    }
  }, [loadCommands])

  const activeCommands = commands[activeStatus]
  const averageMinutes = useMemo(() => {
    const preparing = commands.PREPARANDO
    if (!preparing.length) return 0
    return Math.round(preparing.reduce((total, command) => (
      total + Math.max(0, now - new Date(command.fecha_creacion).getTime()) / 60_000
    ), 0) / preparing.length)
  }, [commands.PREPARANDO, now])

  async function updateStatus(command: KitchenCommand, status: 'LISTA' | 'CANCELADA') {
    const action = status === 'LISTA' ? 'marcar como lista' : 'cancelar'
    if (!window.confirm(`¿Deseas ${action} la comanda #${command.id_cuenta}-${command.numero_comanda}?`)) return
    setUpdatingId(command.id_comanda)
    try {
      await api.patch(`/commands/${command.id_comanda}/status`, { estado: status })
      await loadCommands()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <ModulePage
      eyebrow="Cocina en vivo"
      title="Comandas en preparación"
      description="Ordenadas por tiempo de llegada para que lo urgente siempre esté primero."
      action={<div className="live-indicator"><span />Actualización en tiempo real</div>}
    >
      <div className="kitchen-toolbar">
        <div className="segmented-control" aria-label="Filtrar comandas">
          {filters.map((filter) => (
            <button
              aria-pressed={activeStatus === filter.status}
              className={activeStatus === filter.status ? 'is-selected' : ''}
              key={filter.status}
              onClick={() => setActiveStatus(filter.status)}
              type="button"
            >
              {filter.label} <span>{commands[filter.status].length}</span>
            </button>
          ))}
        </div>
        <p><Icon name="clock" size={17} /> Promedio actual: <strong>{averageMinutes} min</strong></p>
      </div>

      {loading ? (
        <LoadingState label="Cargando comandas…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { void loadCommands(true) }} />
      ) : activeCommands.length === 0 ? (
        <EmptyState
          title={`No hay comandas ${activeStatus === 'PREPARANDO' ? 'en preparación' : activeStatus.toLowerCase()}`}
          message="Las comandas aparecerán aquí cuando cambie la operación."
        />
      ) : (
        <div className="kitchen-grid">
          {activeCommands.map((command) => {
            const tone = ticketTone(command.fecha_creacion, now)
            const notes = command.detalles.filter((detail) => detail.notas)
            return (
              <article className={`kitchen-ticket kitchen-ticket--${tone}`} key={command.id_comanda}>
                <header className="kitchen-ticket__header">
                  <div><p>Comanda</p><h2>#{command.id_cuenta}-{command.numero_comanda}</h2></div>
                  <StatusBadge tone={tone}><Icon name="clock" size={14} />{elapsedMinutes(command.fecha_creacion, now)}</StatusBadge>
                </header>
                <div className="kitchen-ticket__destination"><Icon name="receipt" size={17} />{destination(command)}</div>
                <ul className="food-list">
                  {command.detalles.map((detail) => (
                    <li key={detail.id_detalle}><strong>{detail.cantidad}×</strong><span>{detail.producto}{detail.nombre_presentacion && <small>{detail.nombre_presentacion}</small>}{detail.selecciones_combo.length > 0 && <small>{detail.selecciones_combo.map((selection) => `${selection.cantidad}× ${selection.nombre}`).join(', ')}</small>}{detail.extras.length > 0 && <small>+ {detail.extras.map((extra) => extra.nombre).join(', ')}</small>}</span></li>
                  ))}
                </ul>
                {notes.map((detail) => (
                  <p className="ticket-note" key={detail.id_detalle}><strong>{detail.producto}:</strong> {detail.notas}</p>
                ))}
                {command.estado === 'PREPARANDO' && (
                  <footer className="kitchen-ticket__actions">
                    <button className="button button--danger-soft" disabled={updatingId === command.id_comanda} onClick={() => { void updateStatus(command, 'CANCELADA') }} type="button"><Icon name="close" size={17} />Cancelar</button>
                    <button className="button button--success" disabled={updatingId === command.id_comanda} onClick={() => { void updateStatus(command, 'LISTA') }} type="button"><Icon name="check" size={18} />Marcar lista</button>
                  </footer>
                )}
              </article>
            )
          })}
        </div>
      )}
    </ModulePage>
  )
}

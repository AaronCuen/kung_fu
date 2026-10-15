import { io, type Socket } from 'socket.io-client'
import { API_URL, getAccessToken } from './api'
import type { Command } from '../types/api'

const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim()

export const SOCKET_URL = (configuredSocketUrl || API_URL.replace(/\/api$/, '')).replace(/\/$/, '')

export interface ServerToClientEvents {
  'comanda:creada': (command: Command) => void
  'comanda:actualizada': (command: Command) => void
}

export type AppSocket = Socket<ServerToClientEvents>

export function createAppSocket(): AppSocket {
  return io(SOCKET_URL, {
    autoConnect: false,
    auth: { token: getAccessToken() },
  })
}


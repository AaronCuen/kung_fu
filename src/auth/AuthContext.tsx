import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, getAccessToken, setAccessToken, UNAUTHORIZED_EVENT } from '../lib/api'
import type { LoginInput, SetupAdminInput, User } from '../types/api'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isRestoring: boolean
  login: (credentials: LoginInput) => Promise<User>
  setupAdmin: (input: SetupAdminInput) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<User | null>
  hasPermission: (...permissions: string[]) => boolean
  hasAnyPermission: (...permissions: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)

  const logout = useCallback(() => {
    setAccessToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      return null
    }
    try {
      const response = await authApi.me()
      setUser(response.usuario)
      return response.usuario
    } catch {
      logout()
      return null
    }
  }, [logout])

  useEffect(() => {
    let active = true
    const restore = async () => {
      if (!getAccessToken()) {
        if (active) setIsRestoring(false)
        return
      }
      try {
        const response = await authApi.me()
        if (active) setUser(response.usuario)
      } catch {
        if (active) logout()
      } finally {
        if (active) setIsRestoring(false)
      }
    }
    void restore()
    return () => {
      active = false
    }
  }, [logout])

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

  const login = useCallback(async (credentials: LoginInput) => {
    const response = await authApi.login(credentials)
    setAccessToken(response.token)
    setUser(response.usuario)
    return response.usuario
  }, [])

  const setupAdmin = useCallback(async (input: SetupAdminInput) => {
    const response = await authApi.setupAdmin(input)
    setAccessToken(response.token)
    setUser(response.usuario)
    return response.usuario
  }, [])

  const hasPermission = useCallback(
    (...permissions: string[]) => permissions.every((permission) => user?.permisos.includes(permission)),
    [user],
  )
  const hasAnyPermission = useCallback(
    (...permissions: string[]) => permissions.some((permission) => user?.permisos.includes(permission)),
    [user],
  )

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isRestoring,
    login,
    setupAdmin,
    logout,
    refreshUser,
    hasPermission,
    hasAnyPermission,
  }), [hasAnyPermission, hasPermission, isRestoring, login, logout, refreshUser, setupAdmin, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  return context
}


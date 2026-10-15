import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getHomePath } from '../auth/routing'
import { Icon } from '../components/ui/Icon'
import { getErrorMessage } from '../lib/api'

export function LoginPage() {
  const { isAuthenticated, isRestoring, login, setupAdmin, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [setupMode, setSetupMode] = useState(false)
  const [nombre, setNombre] = useState('')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) navigate(getHomePath(user), { replace: true })
  }, [isAuthenticated, navigate, user])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const authenticatedUser = setupMode
        ? await setupAdmin({ nombre, usuario, password })
        : await login({ usuario, password })
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(from || getHomePath(authenticatedUser), { replace: true })
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setSubmitting(false)
    }
  }

  if (isRestoring) return <div className="app-loading"><span className="spinner" /><p>Comprobando sesión…</p></div>

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="Kung Fu Comandas">
        <div className="login-pattern" aria-hidden="true" />
        <div className="login-brand">
          <span className="brand-mark brand-mark--large" aria-hidden="true">功</span>
          <div><strong>Kung Fu</strong><span>Comandas</span></div>
        </div>
        <div className="login-quote">
          <span className="gold-line" />
          <p>Todo en orden.<br />Todo a tiempo.</p>
          <small>Una operación sencilla, desde la mesa hasta la cocina.</small>
        </div>
        <p className="login-showcase__footer">Sistema interno · Restaurante Kung Fu</p>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <p className="eyebrow"><span />{setupMode ? 'Primer acceso' : 'Bienvenido'}</p>
          <h1>{setupMode ? 'Crea al administrador' : 'Inicia sesión'}</h1>
          <p className="login-card__intro">
            {setupMode ? 'Este paso solo funciona cuando todavía no existe ningún usuario.' : 'Ingresa tus datos para acceder a tu espacio de trabajo.'}
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {setupMode && (
              <label className="form-field">
                <span>Nombre completo</span>
                <div className="input-shell"><Icon name="users" size={19} /><input autoComplete="name" onChange={(event) => setNombre(event.target.value)} placeholder="Nombre del administrador" required type="text" value={nombre} /></div>
              </label>
            )}
            <label className="form-field">
              <span>Usuario</span>
              <div className="input-shell"><Icon name="users" size={19} /><input autoComplete="username" onChange={(event) => setUsuario(event.target.value)} placeholder="Escribe tu usuario" required type="text" value={usuario} /></div>
            </label>
            <label className="form-field">
              <span>Contraseña</span>
              <div className="input-shell"><Icon name="settings" size={19} /><input autoComplete={setupMode ? 'new-password' : 'current-password'} minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" required type="password" value={password} /></div>
            </label>
            {error && <div className="form-alert" role="alert"><Icon name="close" size={17} /><span>{error}</span></div>}
            <button className="button button--primary button--wide button--large" disabled={submitting} type="submit">
              {submitting ? <><span className="spinner spinner--light" />Procesando…</> : <>{setupMode ? 'Crear administrador' : 'Entrar al sistema'}<Icon name="arrow" size={18} /></>}
            </button>
          </form>

          <p className="login-help">{setupMode ? '¿Ya existe un administrador?' : '¿Es la primera vez que usas el sistema?'}</p>
          <button className="preview-link preview-link--button" onClick={() => { setSetupMode((value) => !value); setError(null) }} type="button">
            {setupMode ? 'Volver al inicio de sesión' : 'Configurar primer administrador'}
          </button>
        </div>
      </section>
    </main>
  )
}

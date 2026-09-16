import { Link } from 'react-router-dom'

export function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card">
        <span className="brand-mark" aria-hidden="true">功</span>
        <p className="eyebrow">Kung Fu</p>
        <h1>Inicio de sesión</h1>
        <p>La autenticación se conectará cuando definamos las reglas de acceso.</p>
        <Link className="text-link" to="/mesera">Ver estructura inicial</Link>
      </section>
    </main>
  )
}

import './globals.css'
import React from 'react'

export const metadata = { title: 'MundoIA Envíos — Shopify → Andreani' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="container">
          <header className="mb-6 flex items-center justify-between">
            <div className="brand">
              <div className="logo">M</div>
              <div>
                <h1 className="h1">MundoIA Envíos</h1>
                <p className="helper">Exportá pedidos de Shopify a la planilla oficial de Andreani — listo para vender.</p>
              </div>
            </div>
            <span className="badge">v6.1 • Pro</span>
          </header>
          {children}
          <footer className="mt-10 text-center helper">© {new Date().getFullYear()} • MundoIA Envíos</footer>
        </div>
      </body>
    </html>
  )
}

import { Link } from "react-router-dom"
import type React from "react"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-layout">
      <nav className="main-nav">
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/dashboard" className="nav-link">
          Wallet Dashboard
        </Link>
      </nav>
      <main className="layout-content">{children}</main>
    </div>
  )
}

import { NavLink } from 'react-router-dom'
import './SiteHeader.css'

const links = [
  { to: '/unitview', label: 'UnitView' },
  { to: '/llmod', label: 'LLMOD' },
  { to: '/house-victoria', label: 'House Victoria' },
  { to: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">
            <strong>LinearThrone</strong>
            <span>Technologies</span>
          </span>
        </NavLink>
        <nav className="site-nav" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

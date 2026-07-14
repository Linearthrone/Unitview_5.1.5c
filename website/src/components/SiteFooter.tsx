import { Link } from 'react-router-dom'
import './SiteFooter.css'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div>
          <p className="footer-brand">LinearThrone Technologies</p>
          <p className="footer-copy">Systems for clarity at the point of care.</p>
        </div>
        <div className="footer-links">
          <Link to="/unitview">UnitView</Link>
          <Link to="/llmod">LLMOD</Link>
          <Link to="/house-victoria">House Victoria</Link>
          <Link to="/contact">Contact</Link>
          <a href="mailto:kurt.wood@linearthrone.com">Email</a>
        </div>
      </div>
      <div className="container footer-meta">
        <span>© {new Date().getFullYear()} LinearThrone Technologies</span>
        <span>linearthrone.com</span>
      </div>
    </footer>
  )
}

import { Link } from 'react-router-dom'
import './TeaserPage.css'

export function HouseVictoriaPage() {
  return (
    <div className="teaser-page house-victoria">
      <section className="section teaser-hero">
        <div className="container">
          <p className="eyebrow">LinearThrone · Division</p>
          <h1>House Victoria</h1>
          <p className="lede teaser-lede">
            An AI systems house named for discipline: architectures that act with
            intent, keep auditable seams, and refuse spectacle for its own sake.
          </p>
          <p className="teaser-note">
            House Victoria designs agentic systems that still answer to humans —
            guardianship patterns, escalation etiquette, and deliberate interfaces
            between ambition and operations. More will unfold as each house rule
            hardens in production.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-ghost" to="/">
              Back to LinearThrone
            </Link>
            <Link className="btn btn-primary" to="/contact">
              Reach the house
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

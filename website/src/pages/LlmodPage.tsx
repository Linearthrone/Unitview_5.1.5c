import { Link } from 'react-router-dom'
import './TeaserPage.css'

export function LlmodPage() {
  return (
    <div className="teaser-page">
      <section className="section teaser-hero">
        <div className="container">
          <p className="eyebrow">LinearThrone · Division</p>
          <h1>LLMOD</h1>
          <p className="lede teaser-lede">
            A modular intelligence laboratory — instruments for composing how
            models observe work, constrain themselves, and escalate only when the
            mission demands it.
          </p>
          <p className="teaser-note">
            Details remain deliberately sparse. LLMOD is the research spine behind
            LinearThrone’s adaptive systems. When UnitView proves the floor, LLMOD
            extends the mind of the stack.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-ghost" to="/">
              Back to LinearThrone
            </Link>
            <Link className="btn btn-primary" to="/unitview">
              See UnitView today
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

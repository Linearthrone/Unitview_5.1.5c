import { Link } from 'react-router-dom'
import './HomePage.css'

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-atmosphere" aria-hidden>
          <div className="hero-grid" />
          <div className="hero-orb hero-orb-a" />
          <div className="hero-orb hero-orb-b" />
          <div className="hero-scan" />
        </div>
        <div className="container hero-content">
          <p className="eyebrow anim-rise">LinearThrone Technologies</p>
          <h1 className="anim-rise-delay">
            Systems that
            <span> hold the line</span>
            of care.
          </h1>
          <p className="lede anim-rise-delay-2">
            We build clinical command software and intelligent platforms that turn
            crowded floors into coordinated motion — starting with UnitView.
          </p>
          <div className="hero-actions anim-rise-delay-2">
            <Link className="btn btn-primary" to="/unitview">
              Explore UnitView
            </Link>
            <Link className="btn btn-ghost" to="/contact">
              Talk with us
            </Link>
          </div>
        </div>
      </section>

      <section className="section vision-section">
        <div className="container">
          <p className="eyebrow">Vision</p>
          <h2 className="section-title">Technology that respects the tempo of the floor.</h2>
          <p className="section-sub">
            LinearThrone exists to close the gap between what bedside teams see in
            the moment and what leadership needs across a shift. Quiet precision.
            Visible accountability. Software that earns its place in a hospital
            hallway.
          </p>
        </div>
      </section>

      <section className="section projects-section">
        <div className="container">
          <p className="eyebrow">Portfolio</p>
          <h2 className="section-title">What we are building</h2>
          <p className="section-sub">
            Three threads under one seal — with UnitView leading the charge into live care environments.
          </p>
          <div className="project-gateways">
            <Link to="/unitview" className="gateway gateway-featured">
              <span className="gateway-kicker">Flagship</span>
              <h3>UnitView</h3>
              <p>
                Patient-unit command for real-time census, assignments, and
                safer handoffs when the board cannot fail.
              </p>
              <span className="gateway-cta">Open product story →</span>
            </Link>
            <Link to="/llmod" className="gateway">
              <span className="gateway-kicker">Division</span>
              <h3>LLMOD</h3>
              <p>
                A research spine for modular intelligence — composed systems that
                learn how work actually moves.
              </p>
              <span className="gateway-cta">Glimpse the vision →</span>
            </Link>
            <Link to="/house-victoria" className="gateway">
              <span className="gateway-kicker">Division</span>
              <h3>House Victoria</h3>
              <p>
                An AI systems house for deliberate architectures — agency with
                constraints, clarity without noise.
              </p>
              <span className="gateway-cta">Glimpse the vision →</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

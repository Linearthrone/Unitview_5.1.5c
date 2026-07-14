import { Link } from 'react-router-dom'
import { MediaFrame } from '../components/MediaFrame'
import './UnitViewPage.css'

const features = [
  {
    title: 'Live unit board',
    body: 'Room-by-room visibility for census, mobility, risk flags, and assignments — the replacement for the crowded whiteboard.',
  },
  {
    title: 'Census & staffing intelligence',
    body: 'Bedded counts, available beds, blocked rooms, discharges today, nurse/PCT headcount, and max patients by staffing ratio.',
  },
  {
    title: 'Clinical safety signals',
    body: 'Fall, isolation, restraints, 1013/2013 holds, sitters, HD/PD, transport readiness — chip-level awareness without digging charts.',
  },
  {
    title: 'Shift prep & print',
    body: 'Oncoming shift drafts, Spectralink assignment, and printable charge/assignment layouts that match how charge nurses run the floor.',
  },
]

const benefits = [
  {
    title: 'Fewer missed handoffs',
    body: 'The same board everyone trusts, updated in real time — from admit through awaiting transport.',
  },
  {
    title: 'Fairer assignments',
    body: 'See workload against ratio limits before the floor tips over — not after the first crisis call.',
  },
  {
    title: 'Faster charge rhythm',
    body: 'Census stats, clinical chips, and print-ready layouts collapse ten hallway conversations into one glance.',
  },
  {
    title: 'Shift continuity',
    body: 'Prep the oncoming board without corrupting the active shift. Activate when the unit is ready.',
  },
]

export function UnitViewPage() {
  return (
    <div className="uv-page">
      <section className="uv-hero section">
        <div className="container">
          <p className="eyebrow">LinearThrone · Flagship</p>
          <h1>UnitView</h1>
          <p className="lede">
            The operating surface for the inpatient unit — where every bed, every
            assignment, and every risk flag live in one shared field of view.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="mailto:kurt.wood@linearthrone.com?subject=UnitView%20demo">
              Request a walkthrough
            </a>
            <Link className="btn btn-ghost" to="/contact">
              Contact LinearThrone
            </Link>
          </div>
        </div>
      </section>

      <section className="section purpose-grid">
        <div className="container purpose-layout">
          <article>
            <p className="eyebrow">Purpose</p>
            <h2 className="section-title">Command clarity for the people who run the floor.</h2>
            <p>
              UnitView is patient-management software purpose-built for nursing
              units: a live map of occupancy, staffing, and clinical urgency that
              travels from charge desk to wall display without losing fidelity.
            </p>
          </article>
          <article>
            <p className="eyebrow">Why every hospital needs this</p>
            <h2 className="section-title">Whiteboards decay. Risk does not.</h2>
            <p>
              Every unit already runs a shadow system of sticky notes, verbal
              updates, and half-copied assignment lists. When census spikes or a
              hold is called, those scraps fail first. UnitView replaces that
              fragile oral tradition with a durable unit of record — so transport,
              sitters, dialysis, and discharges are visible before the next
              interruption arrives.
            </p>
          </article>
        </div>
      </section>

      <section className="section benefits-section">
        <div className="container">
          <p className="eyebrow">Deployed-unit benefits</p>
          <h2 className="section-title">What changes when UnitView is on your floor</h2>
          <div className="benefit-grid">
            {benefits.map((item) => (
              <article key={item.title} className="benefit-item">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section capabilities-section">
        <div className="container">
          <p className="eyebrow">Capabilities</p>
          <h2 className="section-title">Feature detail</h2>
          <p className="section-sub">
            Built for Windows desktop workflows hospital IT already understands —
            with layouts, roles, and print paths that match charge nurse practice.
          </p>
          <div className="feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className="feature-item">
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section media-section">
        <div className="container">
          <p className="eyebrow">See it in motion</p>
          <h2 className="section-title">Screenshots & clips</h2>
          <p className="section-sub">
            Product media below uses branded stand-ins until capture packs are
            dropped into the site. Swap files in{' '}
            <code>public/media/unitview/</code> — the frames auto-prefer real assets.
          </p>
          <div className="media-grid">
            <MediaFrame
              title="Unit board overview"
              caption="Rooms, mobility, clinical chips, and nurse assignment state at a glance."
              mockVariant="board"
              kind="shot"
            />
            <MediaFrame
              title="Census statistics"
              caption="Bedded, available, blocked, discharges today — plus nurses, PCTs, and max patients."
              mockVariant="census"
              kind="shot"
            />
            <MediaFrame
              title="Assignment workflow"
              caption="Short clip: placing patients on nurse cards and preparing the oncoming shift."
              mockVariant="assignments"
              kind="clip"
            />
            <MediaFrame
              title="Printable layouts"
              caption="Uniform nurse blocks and landscape preview for charge and assignment prints."
              mockVariant="print"
              kind="shot"
            />
          </div>
        </div>
      </section>

      <section className="section-tight cta-band">
        <div className="container cta-band-inner">
          <div>
            <h2>Bring UnitView to your next unit.</h2>
            <p>Tell us about your floor size, ratios, and shift pattern — we’ll map a deployment path.</p>
          </div>
          <a className="btn btn-primary" href="mailto:kurt.wood@linearthrone.com?subject=UnitView%20deployment">
            kurt.wood@linearthrone.com
          </a>
        </div>
      </section>
    </div>
  )
}

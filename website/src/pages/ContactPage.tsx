import './ContactPage.css'

const CONTACT_EMAIL = 'kurt.wood@linearthrone.com'

export function ContactPage() {
  return (
    <div className="contact-page">
      <section className="section contact-hero">
        <div className="container contact-layout">
          <div>
            <p className="eyebrow">Contact</p>
            <h1>Let’s build the next unit.</h1>
            <p className="lede">
              For UnitView demos, deployments, partnerships, or questions about
              LinearThrone divisions — write us directly.
            </p>
            <a className="btn btn-primary contact-mail" href={`mailto:${CONTACT_EMAIL}`}>
              Email us · {CONTACT_EMAIL}
            </a>
            <p className="contact-hint">
              Prefer a subject line? Try <em>UnitView demo</em> or <em>Floor deployment</em>.
            </p>
          </div>

          <aside className="about-panel">
            <p className="eyebrow">About us</p>
            <h2>LinearThrone Technologies</h2>
            <p>
              LinearThrone Technologies is a systems company focused on software
              that earns trust in high-stakes environments. Our workstream centers
              on <strong>UnitView</strong> — patient unit command for hospitals —
              while <strong>LLMOD</strong> and <strong>House Victoria AI Systems</strong>{' '}
              advance the longer arc of modular and agentic capability.
            </p>
            <p>
              We design for the people who already carry the shift: charge nurses,
              techs, managers, and the IT teams who keep devices online. Clarity
              over clutter. Continuity over chaos. A throne only as strong as the
              line it protects.
            </p>
            <dl className="about-meta">
              <div>
                <dt>Domain</dt>
                <dd>linearthrone.com</dd>
              </div>
              <div>
                <dt>Primary focus</dt>
                <dd>UnitView</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </div>
  )
}

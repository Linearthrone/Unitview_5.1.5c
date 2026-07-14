import './MediaFrame.css'

type MediaFrameProps = {
  title: string
  caption: string
  kind?: 'shot' | 'clip'
  imageSrc?: string
  videoSrc?: string
  mockVariant?: 'board' | 'census' | 'assignments' | 'print'
}

export function MediaFrame({
  title,
  caption,
  kind = 'shot',
  imageSrc,
  videoSrc,
  mockVariant = 'board',
}: MediaFrameProps) {
  const hasRealMedia = Boolean(imageSrc || videoSrc)

  return (
    <figure className="media-frame">
      <div className={`media-stage media-${mockVariant}`}>
        {videoSrc ? (
          <video controls playsInline preload="metadata" poster={imageSrc}>
            <source src={videoSrc} />
          </video>
        ) : imageSrc ? (
          <img src={imageSrc} alt={title} />
        ) : (
          <div className="media-mock" aria-hidden>
            <div className="mock-chrome">
              <span />
              <span />
              <span />
              <em>{kind === 'clip' ? 'Clip preview' : 'Screenshot stand-in'}</em>
            </div>
            {mockVariant === 'board' && (
              <div className="mock-board">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="mock-room" />
                ))}
              </div>
            )}
            {mockVariant === 'census' && (
              <div className="mock-census">
                <div />
                <div />
                <div />
                <div />
              </div>
            )}
            {mockVariant === 'assignments' && (
              <div className="mock-assign">
                <div className="mock-nurse" />
                <div className="mock-nurse" />
                <div className="mock-nurse" />
              </div>
            )}
            {mockVariant === 'print' && (
              <div className="mock-print">
                <div className="mock-sheet" />
                <div className="mock-sheet wide" />
              </div>
            )}
          </div>
        )}
        {!hasRealMedia && <span className="media-badge">Drop media in /public/media/unitview</span>}
      </div>
      <figcaption>
        <strong>{title}</strong>
        <span>{caption}</span>
      </figcaption>
    </figure>
  )
}

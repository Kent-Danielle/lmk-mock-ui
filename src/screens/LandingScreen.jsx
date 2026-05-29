export default function LandingScreen({ goTo }) {
  return (
    <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <div className="wordmark mb-md" style={{ fontSize: 72, color: 'var(--color-bg-dark)' }}>lmk</div>
      <p className="t-subhead mb-xl">
        <span style={{ fontWeight: 300, opacity: 0.6 }}>from</span> let me know,{' '}
        <span style={{ fontWeight: 300, opacity: 0.6 }}>to</span>{' '}
        <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>let's go</span>
      </p>
      <p className="t-body mb-xl text-muted" style={{ maxWidth: 320, margin: '0 auto' }}>
        Mock UI for testing the lmk backend. Create or join a session to get started.
      </p>
      <div className="hero-visual mb-2xl">
        <div className="hero-circle" style={{ background: 'var(--color-primary)', width: 28, height: 28 }} />
        <div className="hero-circle" style={{ background: 'var(--color-secondary)', width: 20, height: 20, animationDelay: '0.3s' }} />
        <div className="hero-circle" style={{ background: 'var(--color-tertiary)', width: 32, height: 32, animationDelay: '0.6s' }} />
        <div className="hero-circle" style={{ background: 'var(--color-accent)', width: 18, height: 18, animationDelay: '0.9s' }} />
        <div className="hero-circle" style={{ background: 'var(--color-primary)', width: 14, height: 14, opacity: 0.5, animationDelay: '1.2s' }} />
      </div>
      <div className="btn-stack" style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <button className="btn btn-primary" onClick={() => goTo('create')}>Host a Session</button>
        <button className="btn btn-outline" onClick={() => goTo('join')}>Join a Session</button>
        <button className="btn btn-ghost" onClick={() => goTo('rejoin')}>Rejoin Session</button>
      </div>
    </div>
  )
}

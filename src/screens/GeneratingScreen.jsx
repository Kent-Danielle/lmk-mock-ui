export default function GeneratingScreen() {
  return (
    <div className="screen loading-screen" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div className="wordmark mb-2xl" style={{ fontSize: 20, color: '#FAF8F5' }}>lmk</div>
        <div className="loading-dots mb-xl">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
        <p className="t-subhead" style={{ color: 'rgba(250,248,245,0.7)' }}>
          Generating results...
        </p>
      </div>
    </div>
  )
}

export default function SessionCreatedScreen({ joinLink, sessionId, participantId, loading, error, showToast, onContinueToQuestions }) {
  return (
    <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <div className="wordmark mb-2xl" style={{ fontSize: 20, alignSelf: 'flex-start' }}>lmk</div>
      <h1 className="t-heading mb-lg" style={{ fontSize: 36 }}>you're in.</h1>
      <div className="link-pill mb-lg">{joinLink}</div>
      {error && <div className="error-msg">{error}</div>}
      <div className="btn-stack mb-xl">
        <button className="btn btn-primary" onClick={() => {
          navigator.clipboard.writeText(joinLink)
          showToast('Link copied!')
        }}>Copy Link</button>
        <button className="btn btn-outline" onClick={() => {
          const frontendUrl = `${window.location.origin}${window.location.pathname}#join/${joinLink.split('/').pop()}`
          navigator.clipboard.writeText(frontendUrl)
          showToast('Frontend join URL copied!')
        }}>Copy Join URL</button>
      </div>
      <p className="t-body text-muted mb-sm">Share this with your group</p>
      <p className="t-caption text-faint mb-xl">
        Session ID: {sessionId}<br />
        Participant ID: {participantId}
      </p>
      <button className="btn-ghost" onClick={onContinueToQuestions} disabled={loading} style={{ fontSize: 16 }}>
        {loading ? 'Loading questions...' : 'Continue to questions →'}
      </button>
    </div>
  )
}

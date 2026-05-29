export default function SessionCreatedScreen({ joinLink, loading, error, showToast, onContinueToQuestions }) {
  const frontendJoinUrl = `${window.location.origin}${window.location.pathname}#join/${joinLink.split('/').pop()}`

  return (
    <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <div className="wordmark mb-2xl" style={{ fontSize: 20, alignSelf: 'flex-start' }}>lmk</div>
      <h1 className="t-heading mb-lg" style={{ fontSize: 36 }}>you're in.</h1>
      <div className="link-pill mb-lg">{frontendJoinUrl}</div>
      {error && <div className="error-msg">{error}</div>}
      <div className="btn-stack mb-xl">
        <button className="btn btn-primary" onClick={() => {
          navigator.clipboard.writeText(frontendJoinUrl)
          showToast('Link copied!')
        }}>Copy Link</button>
      </div>
      <p className="t-body text-muted mb-xl">Share this with your group</p>
      <button className="btn-ghost" onClick={onContinueToQuestions} disabled={loading} style={{ fontSize: 16 }}>
        {loading ? 'Loading questions...' : 'Continue to questions →'}
      </button>
    </div>
  )
}
